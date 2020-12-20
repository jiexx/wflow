import {  IContext, ISignal, IBounds, INode} from './node';
import { v4 as uuid } from 'uuid';
import { IPlan, Action, WorkflowAction } from './plan';
import { Creator } from './criteria';
import { __dbName, __db, __colName } from './db';
import { __debug } from './logger';
export class Manager {
    constructor(
        protected context: IContext, 
        protected plans: {[id: string] : {root: string, nodes: IBounds} } = {}, 
        protected schedules: {[id: string] : {ownerid: string, curr:IBounds, planid: string}} = {}
    ) {

    }
    
    async move(schedid: string, signal: ISignal): Promise<IBounds> {
        try {
            let curr = await this.curr(schedid);
            let next: IBounds = {};
            for (let i in curr) {
                let sig = await curr[i].handle(this.context, signal);
                next = { ...next, ...(curr[i].step(this.context, sig)) };
            }
            await this.next(schedid, next);
            return next;
        } catch (i) {
            throw (i);
        }
    }
    async next(schedid: string, next: IBounds){
        this.schedules[schedid].curr = next;
    }
    async curr(schedid: string): Promise<IBounds> {
        let sched = this.schedules[schedid];
        let plan = this.plans[sched.planid];
        return plan ? sched.curr : {};
    }
    async start(planid: string, ownerid: string) {
        if(!this.plans[planid]){
            return;
        }
        let schedid = uuid();
        let root = {};
        root[this.plans[planid].root] = this.plans[planid].nodes[this.plans[planid].root];
        this.schedules[schedid] = {ownerid: ownerid, planid: planid, curr: root}
        return schedid;
    }
    build(plan: IPlan, id: string) {
        __debug(`plan  ${plan.id}:${plan.name} create`);
        if({}.toString.call(plan.flows) != '[object Array]'){
            __debug(`${plan.id}:${plan.name} flows is not [].`);
            return;
        }
        if(!plan.root){
            __debug( `${plan.id}:${plan.name} plan has no root.`);
            return;
        }
        let creator = new Creator();
        let nodes : IBounds = creator.build(plan);
        this.plans[id] = {nodes: nodes, root: plan.root};
        return id;
    }
}
export class WorkflowManager extends Manager {
    constructor(
        protected context: IContext, 
        protected plans: {[id: string] : {root: string, nodes: IBounds} } = {}, 
        /* protected schedules: {[id: string] : {ownerid: string, curr:IBounds, planid: string}} = {} */
    ) {
        super(context, plans)
    }
    async next(schedid: string, next: IBounds){
        await __db.update(__dbName.PLANS, __colName.SCHEDULES, {_id: schedid}, {$set:{curr: Object.keys(next)}});
    }
    async curr(schedid: string): Promise<IBounds> {
        let sched = await __db.find(__dbName.PLANS, __colName.SCHEDULES, {_id: schedid}, {id:1, ownerid:1, planid:1, curr:1} );
        if(sched.length == 1){
            let plan = this.plans[sched[0].planid];
            if(plan){
                return sched[0].curr.reduce((p,c) => {
                    p[c] = plan.nodes[c];
                    return p;
                }, {})
            }
        }
        return {};
    }
    async start(planid: string, ownerid: string) {
        if(!this.plans[planid]){
            return;
        }
        let schedid = uuid();
        let root = this.plans[planid].root['id'];
        let sched = {_id:schedid, planid: planid, id: schedid, ownerid: ownerid,  curr: [root]};
        __debug( `start schedule ${JSON.stringify(sched)}.`);
        await __db.insert(__dbName.PLANS, __colName.SCHEDULES, [sched]);
        return sched;
    }
    outFlows(curr:IBounds){
        let  flows:INode[] = [];
        for(let i in curr){
            if(curr[i].constructor.name == 'CFlow') {
                flows.push(curr[i]);
            }
            if(curr[i].constructor.name != 'CTask') {
                let o = this.outFlows(curr[i].out());
                flows = [...flows, ...o];
            }
        }
        return flows;
    }
    outBounds(curr: IBounds){
        let out: IBounds = {};
        for(let i in curr){
            out = {...out, ...curr[i].out()}
        }
        return out;
    }
    async collectFlows(schedids: string[]){
        let result = {};
        let wfs= await __db.find(__dbName.PLANS, __colName.WORKFLOWS, {}, {flows:1} );
        for(let i = 0 ; i < schedids.length ; i ++ ){
            let schedid = schedids[i];
            let curr = await this.curr(schedid);
            let out = this.outBounds(curr);
            let flows = this.outFlows(out);
            let r = wfs.reduce((p,wf) => {
                let a = wf.flows.filter(f=>flows.findIndex(e=>e.name == f.id) > -1)
                p = [...a, ...p];
                return p;
            },[]);
            result[schedids[i]]= r;
        }
        return result;
    }
    async restore() {
        let wfs= await __db.find(__dbName.PLANS, __colName.WORKFLOWS, {}, {id:1, label:1, flows:1, nodes:1, gateways:1} );
        wfs.forEach(wf => {
            let plan = this.extract(/* wf.root */wf.nodes[0], wf.flows, wf.nodes, wf.gateways);
            this.build(plan, wf.id);
        });
    }
    extract(root:string, flows: {id:string, act:Action}[], nodes: { id: string, label:string }[], gateways: {id: string, label:string }[]): IPlan{
        let plan = {root:root, flows: flows.map(e=>e.id)};
        plan = nodes.reduce((p,c) => { p[c.id]= WorkflowAction[Action.HANDLE]; return p}, plan);
        plan = gateways.reduce((p,gw) => {
            p[gw.id]= flows.filter(f=>f.id.includes(gw.id)).reduce((_,flow)=>{
                _[flow.id] = WorkflowAction[flow.act]; 
                return  _
            }, {});
            return p
        }, plan);
        return plan;
    }
}