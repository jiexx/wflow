import { Model, ISignal, INode, CFlow, CTask } from './model';
import { __db, __dbName, __colName } from './db';
import { v4 as uuid } from 'uuid';
import { Creator } from './criteria';
import { PlannerMemModel, PlannerModel } from './planner.model';
class MemSchedule {
    constructor(private schedules: {_id: string, id:string, ownerid:string, planid:string, planame:string, datatime:Date, curr:string[]}[] = []){

    }
    find(query): {_id: string, id:string, ownerid:string, planid:string, planame:string, datatime:Date, curr:string[]}[]{
        let keys = Object.keys(query);
        return this.schedules.filter(sched => keys.every((k,i)=>sched[k]==query[k]));
    }
    current(schedid: string): {id:string, ownerid:string, planid:string, planame:string, datatime:Date, curr:string[]}[]{
        return this.find({_id: schedid})
    }
    start(who: string, plan: Model){
        let id = uuid();
        this.schedules.push({_id:id, planid: plan.id(), planame: plan.name(), id: id, ownerid: who,  curr: plan.root().map(c=>c.id), datatime: new Date()});
    }
    move(schedid: string, signal: ISignal, plan: Model) {
        let curr = this.current(schedid);
        let id = curr.map(sched => sched.id);
        let next = plan.next(id, signal);
        this.current(schedid)[0].curr = next.map(n=>n.id);
    }
}
class Schedule {

    constructor(){

    }
    async find(query): Promise<{id:string, ownerid:string, planid:string, planame:string, datatime:Date, expired:number, curr:string[]}[]>{
        let scheds = await __db.find(__dbName.PLANS, __colName.SCHEDULES, query, {id:1, ownerid:1, planid:1, planame:1, datatime:1, expired:1, curr:1} );
        return scheds.length > 0 ? scheds : [];
    }
    async start(who: string, plan: Model){
        let id = uuid();
        let sched = {_id:id, planid: plan.id(), planame: plan.name(), id: id, ownerid: who,  curr: plan.root().map(c=>c.id), datatime: new Date()};
        await __db.insert(__dbName.PLANS, __colName.SCHEDULES, [sched]);
        return sched;
    }
    async current(schedid: string): Promise<{id:string, ownerid:string, planid:string, planame:string, datatime:Date, curr:string[]}[]>{
        return await this.find({_id: schedid})
    }
    async move(schedid: string, signal: ISignal, next: string[]) {
        //let curr = await this.current(schedid);
        //let id = curr.map(sched => sched.curr);
        //let next = plan.next(id, signal);
        let result = await __db.update(__dbName.PLANS, __colName.SCHEDULES, {_id: schedid}, {$set:{curr: next}});
        return result;
    }
}
export class Planner{
    async createSchedule(planid: string, ownerid: string){
        return await this.schedule.start(ownerid, this.models[planid]);
    }
    async moveSchedule(schedid: string, signal: ISignal){
        let curr = await this.schedule.current(schedid);
        if(curr.length == 1){
            let sched = curr[0]
            let next = this.models[sched.planid].next(sched.curr, signal).map(n=>n.id);
            if(next.length > 0){
                let result = await this.schedule.move(schedid, signal, next);
                return {...{movedSchedCount:result}, ...{planid:sched.planid,ownerid:sched.ownerid,curr:next}};
            }
        }
    }
    async stopSchedule(schedid: string, signal: ISignal){
        let curr = await this.schedule.current(schedid);
        if(curr.length == 1){
            let sched = curr[0]
            let next = this.models[sched.planid].root().map(n=>n.id);
            if(next.length > 0){
                let result = await this.schedule.move(schedid, signal, next);
                return {...{movedSchedCount:result}, ...{planid:sched.planid,ownerid:sched.ownerid,curr:next}};
            }
        }
    }
    currExpire(planid: string, curr: string[]){
        if(this.models[planid]){
            let ts = this.models[planid].tasks(curr) as CTask[];
            return Math.min(...ts.map(e=>e.getExpire()));
        }
        return 1000;
    }
    currPrivilege(planid: string, curr: string[]){
        if(this.models[planid]){
            let ts = this.models[planid].tasks(curr) as CTask[];
            return ts.map(e=>e.getPrivilege());
        }
        return [];
    }
    currIncludesRoot(curr: string[], root: string[]){
        return curr.findIndex(e => root.findIndex(r => e == r)>-1)>-1;
    }
    async getScheduleByOwner(ownerid: string){
        let scheds = await this.schedule.find({ownerid: ownerid});
        return scheds.map(sched => ({...sched, ...{end: !this.models[sched.planid] ? false : this.currIncludesRoot(sched.curr,this.models[sched.planid].root().map(e=>e.id))}}));
    }
    async getScheduleByRole(roleid: string[]){
        //roleid.push('0');
        let tasks = Object.values(this.models).map(m => m.findTaskByRole(roleid).map(t => t.id)).reduce((p,c) => ([...p, ...c]), []);
        let scheds = await this.schedule.find({curr: {$in: tasks}});
        return scheds.map(sched => ({...sched, ...{end: !this.models[sched.planid] ? false : this.currIncludesRoot(sched.curr,this.models[sched.planid].root().map(e=>e.id)), expire:this.currExpire(sched.planid, sched.curr), privilege:this.currPrivilege(sched.planid, sched.curr)}}));
    }
    async getAllCurrentSchedule(){
        let scheds = await this.schedule.find({});
        return scheds.map(sched => ({...sched, ...{end: !this.models[sched.planid] ? false : this.currIncludesRoot(sched.curr,this.models[sched.planid].root().map(e=>e.id)), expire:this.currExpire(sched.planid, sched.curr), privilege:this.currPrivilege(sched.planid, sched.curr)}}));
    }
    getRolesByTaskId(taskids: string[]){
        return Object.values(this.models).map(m => m.findRoleByTask(taskids));
    }
    async getScheduleStart(ownerid: string){
        //roleid.push('0');
        let tasks = Object.values(this.models).map(m => m.findTaskByStart().map(t => t.id)).reduce((p,c) => ([...p, ...c]), []);
        let scheds = await this.schedule.find({curr: {$in: tasks}, ownerid: ownerid});
        return scheds.map(sched => ({...sched, ...{end: !this.models[sched.planid] ? false : this.currIncludesRoot(sched.curr,this.models[sched.planid].root().map(e=>e.id)), expire:this.currExpire(sched.planid, sched.curr), privilege:this.currPrivilege(sched.planid, sched.curr)}}));
    }
    getScheduleAction(planid: string, currid: string[]) {
        return this.getModel(planid) ? this.getModel(planid).outflows(currid).map(flow => flow.getAction()) : null;
    }
    private getTaskbyflow(flow: CFlow) : CTask{
        return flow.getOuts().filter(i => i && i.name() == 'CTask')[0] as any;
    }
    getScheduleActionidRole(planid: string, currid: string[]) {
        return this.getModel(planid) ? this.getModel(planid).outflows(currid).reduce((p,flow) => { p[flow.getAction().id] = this.getTaskbyflow(flow).getRole(); return p;}, {}) : null;
    }
    async getScheduleWithEndflag(schedids: string[]) {
        let scheds = await this.schedule.find({_id:  {$in: schedids}});
        return scheds.map(sched => ({...sched, ...{end: !this.models[sched.planid] ? false : this.currIncludesRoot(sched.curr,this.models[sched.planid].root().map(e=>e.id))}}));
    }
    getScheduleRoles(planid: string[]){
        return planid.length == 1 && this.getModel(planid[0]) ? this.getModel(planid[0]).tasks(null).map((t:CTask)=>({...t.getRole(), expire:t.getExpire()})) : null
    }
    getModel(id: string){
        return this.models[id];
    }
    private schedule = new Schedule(); 
    public memSchedule = new MemSchedule();
    constructor(private models: {[id: string] : Model } = {}){

    }

    fromPlanMemModel(model: PlannerMemModel){
        let creator = new Creator()
        let nodes = creator.fromPlanMemModel(model);
        this.models[model.root] = new Model(model.root, model.root, [nodes[model.root]], nodes, {});
    }

    async fromPlanModel(){
        let models: PlannerModel[] = await __db.find(__dbName.PLANS, __colName.MODELS, {} );
        let creator = new Creator()
        models.forEach(model => {
            let nodes = creator.fromPlanModel(model);
            this.models[model.id] = new Model(model.id, model.name, [nodes[model.root.id]], nodes, {});
            this.models[model.id].expired = model.expired;
        })
    }
}
