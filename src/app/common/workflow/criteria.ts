import { IHandle, ICondition, INode, COrGateway, CAndGateway, CFlow, CTask, IBounds } from './node';
import { __debug } from './logger';
import { IPlan } from './plan';



abstract class Criteria {
    constructor(private criteria: RegExp, private assert_value: RegExp ){
    }
    assert(key: string, value ?: string | IHandle | ICondition | {[name: string]: ICondition}){
        let c = !this.criteria.test(key);
        if(c) {
            //__debug(`${this.constructor.name} '${key}' has no prefix: '${this.criteria.source}'.`);
            return false
        }
        if(this.assert_value){
            if(!this.assert_value.test({}.toString.call(value))){
                //__debug(`${this.constructor.name} '${key}' has no value type: ${this.assert_value}.`);
                return false
            }
        }
        //__debug(`${this.constructor.name} '${key}' has right type: ${this.assert_value}.`);
        return true;
    }
    abstract collect(creator: Creator, key: string, value: ICondition | IHandle | {[name: string]: ICondition} | null): void;
    abstract get(key: string, value ?: ICondition | IHandle ) : INode;
}
class OrGatewayCriteria extends Criteria{
    collect(creator: Creator, key: string, value: {[name: string]: ICondition}| null): void {
        creator.nodes.push({key:key,val:{}});
        for(let i in value){
            let criteria = creator.criterias.find(e => e.assert(i, value[i]));
            if(criteria){
                let index = creator.flows.findIndex(f=>f.key == i);
                index > -1 ? creator.flows[index] = {key:i,val:value[i]} : creator.flows.push({key:i,val:value[i]});
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
    collect(creator: Creator, key: string, value: {[name: string]: ICondition}| null): void {
        creator.nodes.push({key:key,val:{}});
        for(let i in value){
            let criteria = creator.criterias.find(e => e.assert(i, value[i]));
            if(criteria){
                let index = creator.flows.findIndex(f=>f.key == i);
                index > -1 ? creator.flows[index] = {key:i,val:value[i]} : creator.flows.push({key:i,val:value[i]});
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
class FlowWithGwCriteria extends Criteria{
    collect(creator: Creator, key: string, value: ICondition): void {
        creator.flows.push({key:key,val:value});
    }
    constructor(){
        super(/^(?=gw_|t_)[^=]+?\s+?=>\s+?(?=gw_|t_)[A-z0-9\-\?]+$/,  /\[object Function\]/, );
    }
    get(key: string, value : ICondition): INode {
        return new CFlow(key, value);
    }
}
class FlowWithDefaultCriteria extends Criteria{
    collect(creator: Creator, key: string, value: ICondition): void {
        creator.flows.push({key:key,val:null});
    }
    constructor(){
        super(/^(?=gw_|t_)[^=]+?\s+?=>\s+?(?=gw_|t_)[A-z0-9\-\?]+$/, null, );
    }
    get(key: string, value : ICondition): INode {
        return new CFlow(key, value);
    }
}
class TaskCriteria extends Criteria{
    collect(creator: Creator, key: string, value: IHandle): void {
        creator.nodes.push({key:key,val:value});
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
            new FlowWithGwCriteria(), 
            new TaskCriteria(),
            new FlowWithDefaultCriteria()
        ];
    }

    flows: {key: string, val: ICondition | IHandle | {[name: string]: ICondition | null}}[] = [];
    nodes: {key: string, val: ICondition | IHandle | {[name: string]: ICondition | null}}[] = [];
    private collect(plan: IPlan){
        plan.flows.forEach(flow => {
            let criteria = this.criterias.find(e => e.assert(flow, null));
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
        this.flows = this.flows.filter((flow,i) => this.flows.filter(e=>e.key == flow.key).length < 2 || flow.val )
    }

    build(plan: IPlan) {
        this.collect(plan);
        let nodes: IBounds = {}
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
                first.flowTo(f);
                f.flowTo(second);
            }
            
        });
        return nodes;
    }
}
