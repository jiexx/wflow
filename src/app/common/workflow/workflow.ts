import { v4 as uuid } from 'uuid';
import { Drawing } from './drawing';
import { IStep, Action, ActionLabel } from './plan';


/////////////////////////interface/////////////////////////

///////////////////////class///////////////////////////////
class Workflow {
    id: string;
    constructor(public name: string, serial?: string){
        if(!serial){
            this.id = uuid();
            this.blank(0, '发起人');
        }else {
            this.unserialize(serial);
        }
        
    }
    drawing: Drawing = new Drawing();
    steps: { label: string, curr: IStep, fwd: IStep }[] = [];
    blank(i:number, label: string){
        this.steps[i] = {
            label: label,
            curr: {id: '', optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}},
            fwd: {id: '',  optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}}
        };
        return this.steps[i];
    }
    valid(step: IStep){
        return step && step.cursor && step.cursor.id && step.cursor.name;
    }
    count(){
        return this.steps.length;
    }
    build(){
        for(let i = 0; i < this.steps.length; i ++){
            if(!this.valid(this.steps[i].curr)){
                this.steps.splice(i,1);
            }else{
                this.steps[i].curr.id = this.steps[i].curr.id || uuid();
                this.steps[i].curr.optid = this.steps[i].curr.cursor.id;
                this.steps[i].curr.label = this.steps[i].curr.cursor.name;
                if(!this.steps[i].curr.actions[Action.FORWARD]) {
                    this.steps[i].fwd = {id: '',  optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}};
                }else if(this.valid(this.steps[i].fwd)){
                    this.steps[i].fwd.id = this.steps[i].fwd.id || uuid();
                    this.steps[i].fwd.optid = this.steps[i].fwd.cursor.id;
                    this.steps[i].fwd.label = this.steps[i].fwd.cursor.name;
                }
            }
        }
        this.drawing.clear();
        for(let i = 0; i < this.steps.length; i ++){
            if(this.steps[i] && this.steps[i].curr && this.steps[i].curr.id) {
                this.drawing.drop(this.steps[i].curr);
                this.drawing.connect(
                    this.steps[i-1] ? this.steps[i-1].curr : null, 
                    this.steps[i].curr, 
                    this.steps[i+1] ? this.steps[i+1].curr : null,
                    this.steps[0] ? this.steps[0].curr : null,
                    this.steps[i].fwd
                );
            }
        }
    }
    toPlan(){
        let result = { 
            root: this.steps[0].curr.id,
            flows: this.drawing.flows.map(e=> e.id.replace('___', ' => '))
        };
        result = this.drawing.nodes.filter(e => e.id.indexOf('t_') == 0).reduce((p,c) =>p[c.id]= Action.HANDLE && p, result);
        result = this.drawing.nodes.filter(e => e.id.indexOf('gw_o_') == 0).reduce((p,c) => 
            p[c.id]= this.drawing.flows.filter(f=>f.id.includes(c.id)).reduce((a,fl) => a[fl.id.replace('___', ' => ')] = fl.act, {}) && p, result);
        return result;
    }
    summary(){
        // let result = {flows: this.flows.map(e=> e.id.replace('___', ' => '))};
        // result = this.nodes.filter(e => e.id.indexOf('t_') == 0).reduce((p,c) =>p[c.id]= Action.HANDLE && p, result);
        // result = this.nodes.filter(e => e.id.indexOf('gw_o_') == 0).reduce((p,c) => 
        //     p[c.id]= this.flows.filter(f=>f.id.includes(c.id)).reduce((a,fl) => a[fl.id.replace('___', ' => ')] = fl.act, {}) && p, result);
        // return result;
    }
    serialize(){
        /* return JSON.stringify({id:this.id, name:this.name, steps:this.steps, 
            flows: this.drawing.flows.map(e=> ({id:e.id.replace('___', ' => '),act:e.act})), 
            nodes:this.drawing.nodes.filter(e => e.id.indexOf('t_') == 0), 
            gateways: this.drawing.nodes.filter(e => e.id.indexOf('gw_o_') == 0)}); */
        return {id:this.id, name:this.name, steps:this.steps, 
                flows: this.drawing.flows.map(e=> ({id:e.id.replace('___', ' => '),act:e.act})), //only used for manager restore.
                nodes:this.drawing.nodes.filter(e => e.id.indexOf('t_') == 0).map(e=>({id:e.id,label:e.id})), 
                gateways: this.drawing.nodes.filter(e => e.id.indexOf('gw_o_') == 0).map(e=>({id:e.id,label:e.id}))};
    }
    unserialize(str: any){
        try{
            /* let o = JSON.parse(str); */
            let o = str;
            this.id = o.id;
            this.name = o.name;
            this.steps = o.steps;
            this.build();
        }catch(e){
            console.log('unserialization error.')
        }
    }
}
export class WorkflowPlanner{
    workflows : Workflow[] = [];
    cursor: Workflow = null;
    actlabels = [];
    constructor(public options : {id:string,name:string}[]){
        this.actlabels = Object.keys(Action).filter(e=>ActionLabel[Action[e]]).map(e=>({action:Action[e], label:ActionLabel[Action[e]]}));
        this.create('空白模板');
        this.cursor = this.workflows[0];
    };
    
    create(name: string, serial?: string){
        if(!name){
            return;
        }
        let wf = new Workflow(name, serial);
        let first = wf.steps[0];
        first.curr.cursor = this.options && this.notNullOptions()[0];
        this.workflows.push(wf);
    }
    blank(i: number, label: string){
        let b = this.cursor.blank(i, label);
        b.curr.cursor = this.options && this.notNullOptions()[0];
    }
    rm(){
        if(this.workflows.length == 1){
            return;
        }
        this.workflows.splice(this.workflows.findIndex(e=>e==this.cursor),1);
    }
    notNullOptions(){
        return this.options.filter(e=>e.id && e.name);
    }
    nullOptions(){
        return this.options.filter(e=> !e.id || !e.name);
    }
    build(){
        this.cursor.build();
    }
    save(){
        return this.workflows.map(e => ( e.serialize()));
    }

    restore(data: any[]){
        data && data.forEach(e =>{
            this.create(e.name, e);
        })
        if(this.workflows.length < 1){
            this.create('空白模板');
        }
        this.cursor = this.workflows[this.workflows.length-1];
        return this.cursor;
        //console.log(this.cursor.name, this.cursor.steps, this.cursor.drawing)
    }
}