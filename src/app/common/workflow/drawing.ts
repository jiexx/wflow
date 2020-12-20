import { Action, ActionLabel, IStep } from './plan';



/////////////////////////interface/////////////////////////
///////////////////////class///////////////////////////////
export class Drawing {
    constructor(){
        this.connectors = [
            new CommitConnector(), 
            new ConfirmConnector(), 
            new RejectConnector(), 
            new ForwardConnector()
        ].reduce((p,c) =>  (p[c.tag] = c) && p , {});
    }
    connectors : {[action: string] : IConnector}
    flows: { id: string, label: string, source: string, target: string, act: Action}[] = [];
    nodes: { id: string, label: string }[] = [];
    clear(){
        this.flows.splice(0, this.flows.length);
        this.nodes.splice(0, this.nodes.length);
    }
    flow(source: string, target: string, act: Action){
        let flow = this.flows.find(e=>e.id == `${source}___${target}`);
        if(flow){
            flow.label += `/${ActionLabel[act]}`
        }else{
            this.flows.push({ id: `${source}___${target}`, source: `${source}`, target: `${target}`, label: ActionLabel[act], act: act });
        }
    }
    node(source: string, label: string) {
        let index = this.nodes.findIndex(e=>e.id == `${source}`);
        index < 0 && this.nodes.push({id: source, label: label});
    }
    drop(step: IStep){
        this.node(`t_${step.id}`, step.label);
        this.node(`gw_o_${step.id}`, '');
        this.flow(`t_${step.id}`, `gw_o_${step.id}`, Action.DEFAULT);
    }
    connect(prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep){
        Object.keys(curr.actions).filter(e=>curr.actions[e]).forEach(e=>this.connectors[e].connect(this, prev, curr, next, first, fwd));
    }
}
interface IConnector {
    tag: Action;
    connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void;
}
class CommitConnector implements IConnector{
    tag = Action.COMMIT;
    connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
        next && next.id && drawing.flow(`gw_o_${curr.id}`, `t_${next.id}`, Action.COMMIT);
    }
}
class ConfirmConnector implements IConnector{
    tag = Action.CONFIRM;
    mode = 1;
    connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
        this.mode == 1 && prev && prev.id && drawing.flow(`gw_o_${curr.id}`, `t_${prev.id}`, Action.CONFIRM);
        this.mode == 2 && first && first.id && drawing.flow(`gw_o_${curr.id}`, `t_${first.id}`, Action.CONFIRM);
    }
}
class RejectConnector implements IConnector{
    tag = Action.REJECT;
    connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
        prev && prev.id && drawing.flow(`gw_o_${curr.id}`, `t_${prev.id}`, Action.REJECT);
    }
}
class ForwardConnector implements IConnector{
    tag = Action.FORWARD;
    connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
        if(fwd && fwd.id){
            drawing.drop(fwd);
            drawing.flow(`gw_o_${curr.id}`, `t_${fwd.id}`, Action.FORWARD);
            drawing.flow(`t_${fwd.id}`, `gw_o_${fwd.id}`, Action.DEFAULT);
            drawing.flow(`gw_o_${fwd.id}`, `t_${curr.id}`, Action.COMMIT);
        }
    }
}