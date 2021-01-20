import { IHandle, INode, COrGateway, CAndGateway, CFlow, CTask, ISignal, IContext, CAction, Role } from './model';
import { __debug } from './logger';
import { PlannerModel, PlannerMemModel, FlowAction } from './planner.model';



abstract class Criteria {
    constructor(private criteria: RegExp, private assert_value: RegExp, ){
    }
    assert(key: string, value ?: string | IHandle | {[flow: string]: IHandle}, checkValue : boolean = true){
        let c = !this.criteria.test(key);
        if(c) {
            return false
        }
        if(checkValue && this.assert_value){
            if(!this.assert_value.test({}.toString.call(value))){
                return false
            }
        }
        //__debug(`${this.constructor.name} '${key}' has right type: ${this.assert_value}.`);
        return true;
    }
    abstract collect(creator: Creator, key: string, value: IHandle | {[name: string]: IHandle} | null): void;
    abstract get(key: string, value ?: IHandle ) : INode;
}
class OrGatewayCriteria extends Criteria{
    collect(creator: Creator, key: string, value: {[name: string]: IHandle}| null): void {
        if(creator.nodes.findIndex(node => node.key == key) < 0){
            creator.nodes.push({key:key,val:{}});
        }
        for(let i in value){
            let criteria = creator.criterias.find(e => e.assert(i, value[i]));
            if(criteria){
                let index = creator.flows.findIndex(f=>f.key == i);
                if(index < 0){
                    creator.flows.push({key:i,val:value[i]});
                }else {
                    creator.flows[index] = {key:i,val:value[i]}
                }
            }
        }
    }
    constructor(){
        super(/^gw_o_[a-z0-9\-\?]+$/, /\[object Object\]/, );
    }
    get(key: string, value ?: IHandle): INode {
        return new COrGateway(key, value);
    }
}
class AndGatewayCriteria extends Criteria{
    collect(creator: Creator, key: string, value: {[name: string]: IHandle}| null): void {
        if(creator.nodes.findIndex(node => node.key == key) < 0){
            creator.nodes.push({key:key,val:{}});
        }
        for(let i in value){
            let criteria = creator.criterias.find(e => e.assert(i, value[i]));
            if(criteria){
                let index = creator.flows.findIndex(f=>f.key == i);
                if(index < 0){
                    creator.flows.push({key:i,val:value[i]});
                }else {
                    creator.flows[index] = {key:i,val:value[i]}
                }
            }
        }
    }
    constructor(){
        super(/^gw_\+_[a-z0-9\-\?]+$/,  /\[object Object\]/, );
    }
    get(key: string, value ?: IHandle): INode {
        return new CAndGateway(key, value);
    }
}
class FlowCriteria extends Criteria{
    collect(creator: Creator, key: string, value: IHandle): void {
        if(creator.flows.findIndex(flow => flow.key == key) < 0){
            creator.flows.push({key:key,val:value});
        }
    }
    constructor(){
        super(/^(?=gw_|t_)[^=]+?\s+?=>\s+?(?=gw_|t_)[A-z0-9\-\?]+$|f_[a-z0-9\-\?]+$/,  /\[object Function\]|null/, );
    }
    get(key: string, value : IHandle): INode {
        return new CFlow(key, value);
    }
}
class TaskCriteria extends Criteria{
    collect(creator: Creator, key: string, value: IHandle): void {
        if(creator.nodes.findIndex(node => node.key == key) < 0){
            creator.nodes.push({key:key,val:value});
        }
    }
    constructor(){
        super(/^t_[a-z0-9\-\?]+$/, /\[object AsyncFunction\]|\[object Function\]/ , );
    }
    get(key: string, value : IHandle): INode {
        return new CTask(key, value);
    }
}
export class Creator {
    criterias : Criteria[];
    constructor(){
        this.criterias = [
            new OrGatewayCriteria(), 
            new AndGatewayCriteria(), 
            new FlowCriteria(), 
            new TaskCriteria()
        ];
    }

    flows: {key: string, val: IHandle | IHandle | {[name: string]: IHandle | null}}[] = [];
    nodes: {key: string, val: IHandle | IHandle | {[name: string]: IHandle | null}}[] = [];
    private collect(plan: PlannerMemModel){
        plan.flows.forEach(flow => {
            let criteria = this.criterias.find(e => e.assert(flow, 'null'));
            if(criteria){
                criteria.collect(this, flow, null);
            }
        });
        for(let i in plan) {
            let criteria = this.criterias.find(e => e.assert(i, plan[i] as any));
            if(criteria){
                criteria.collect(this, i, plan[i] as any);
            }
        }
    }

    fromPlanMemModel(plan: PlannerMemModel) {
        this.collect(plan);
        let nodes: {[id: string]: INode} = {}
        this.flows.forEach(flow => {
            let criteria = this.criterias.find(e => e.assert(flow.key, flow.val));
            if(criteria){
                nodes[flow.key] = criteria.get(flow.key, flow.val as any);
            }
        });
        this.nodes.forEach(node => {
            let criteria = this.criterias.find(e => e.assert(node.key, node.val));
            if(criteria){
                nodes[node.key] = criteria.get(node.key, node.val as any);
            }
        });
        this.flows.forEach(flow => {
            let [from, to] = flow.key.split('=>').map(e=>e.trim());
            let first = nodes[from], second = nodes[to], f = nodes[flow.key];
            if(!first || !second || !f) {
                __debug(`${from} is ${first}, ${to} is ${second}, ${ flow.key} is ${f}`)
            }else {
                first.setOut(f);
                f.setOut(second);

                second.setIn(f);
                f.setIn(first);
            }
            
        });
        return nodes;
    }

    fromPlanModel(plan: PlannerModel) {
        let nodes: {[id: string]: INode} = {}
        plan.tasks.forEach(task => {
            let criteria = this.criterias.find(e => e.assert(task.id, null, false));
            if(criteria){
                nodes[task.id] = criteria.get(task.id, _NOPE);
                (nodes[task.id] as CTask).setRole(new Role(task.role.id, task.role.name));
                (nodes[task.id] as CTask).setExpire(task.expire);
                (nodes[task.id] as CTask).setPrivilege(task.privilege);
            }
        })
        plan.andgateways.forEach(gw => {
            let criteria = this.criterias.find(e => e.assert(gw.id, null, false));
            if(criteria){
                nodes[gw.id] = criteria.get(gw.id, _NOPE);
            }
        })
        plan.orgateways.forEach(gw => {
            let criteria = this.criterias.find(e => e.assert(gw.id, null, false));
            if(criteria){
                nodes[gw.id] = criteria.get(gw.id, _NOPE);
            }
        })
        plan.flows.forEach(flow => {
            let criteria = this.criterias.find(e => e.assert(flow.id, null, false));
            if(criteria){
                nodes[flow.id]  = criteria.get(flow.id, _ACTION);
                (nodes[flow.id] as CFlow).setAction(new CAction(flow.action.id, flow.action.name));
            }
            let first = nodes[flow.from], second = nodes[flow.to], f = nodes[flow.id];
            if(!first || !second || !f) {
                __debug(`${flow.from} is ${first}, ${flow.to} is ${second}, ${ flow.id} is ${f}`)
            }else {
                first.setOut(f);
                f.setOut(second);

                second.setIn(f);
                f.setIn(first);
            }
        })
        return nodes;
    }
}

const _NOPE = (context: IContext, signal: ISignal) : ISignal => {
    return signal;
};
const _ACTION = function(context: IContext, signal: ISignal) : ISignal  {
    if( signal ){
        let code = this.action.id == FlowAction.NOPEID ? true : signal['action'].id == this.action.id;
        signal['code'] = code ? 'yes' : 'no';
    }
    return signal;
};
