// import { v4 as uuid } from 'uuid';
// import { UserService } from './user';


// export interface IContext {
//     [key: string]: any;
// }

// export interface ISignal {
//     [key: string]: any;
// }

// interface IBounds {
//     [name: string]: INode;
// }
// export type ICondition = (context: IContext, signal: ISignal) => boolean;
// export type IHandle = (context: IContext, signal: ISignal) => Promise<ISignal>;

// const __debug = (...args: any[]) => {
//     if(1){
//         let str = args.reduce((p,c)=>p+=c, '');
//         console.log(str);
//     }
// };

// interface INode {
//     name: string;
//     label?: string;
//     inBounds: IBounds;
//     outBounds: IBounds;
//     flowFrom(node: INode): void;
//     flowTo(node: INode): void;
//     step(context: IContext, signal: ISignal): IBounds;
//     handle(context: IContext, signal: ISignal): Promise<ISignal>;
// }

// class CNode1to1 implements INode {
//     constructor(public name: string, handle: IHandle) {
//         this.handle = handle && handle;
//     }
//     async handle(context: IContext, signal: ISignal): Promise<ISignal> {
//         return signal;
//     }
//     inBounds: IBounds;    outBounds: IBounds;
//     flowFrom(node: INode): void {
//         if(this.inBounds && this.inBounds[node.name]) {
//             return;
//         }
//         this.inBounds = {};
//         this.inBounds[node.name] = node;
//         node.flowTo(this);
//     }
//     flowTo(node: INode): void {
//         if(this.outBounds && this.outBounds[node.name]) {
//             return;
//         }
//         this.outBounds = {};
//         this.outBounds[node.name] = node;
//         node.flowFrom(this);
//     }
//     step(context: IContext, signal: ISignal): IBounds {
//         __debug(this.name, ' to ', Object.keys(this.outBounds).join(','));
//         return this.outBounds;
//     }
// }
// abstract class CGateway implements INode {
//     constructor(public name: string, handle: IHandle){
//         this.handle = handle && handle;
//     }
//     async handle(context: IContext, signal: ISignal): Promise<ISignal> {
//         return signal;
//     }
//     inBounds: IBounds = {};    outBounds: IBounds ={};
//     flowFrom(node: INode): void {
//         if(this.inBounds && this.inBounds[node.name]) {
//             return;
//         }
//         this.inBounds[node.name] = node;
//         node.flowTo(this);
//     }
//     flowTo(node: INode): void {
//         if(this.outBounds && this.outBounds[node.name]) {
//             return;
//         }
//         this.outBounds[node.name] = node;
//         node.flowFrom(this);
//     }
//     abstract step(context: IContext, signal: ISignal): IBounds;
// }
// class CTask extends CGateway {
//     step(context: IContext, signal: ISignal): IBounds {
//         __debug(this.name, ' to ', Object.keys(this.outBounds).join(','));
//         return this.outBounds;
//     }
//     constructor(public name: string, handle: IHandle){
//         super(name, handle);
//     }
// }
// class CFlow extends CNode1to1 {
//     constructor(public name: string, condition ?: ICondition, handle ?: IHandle){
//         super(name, handle);
//         this.condition = condition && condition;
//     }
//     condition(context: IContext, signal: ISignal): boolean {
//         return true;
//     }
// }

// class COrGateway extends CGateway {
//     constructor(public name: string, handle ?: IHandle){
//         super(name, handle);
//     }
//     step(context: IContext, signal: ISignal): IBounds {
//         let iflow = Object.values(this.inBounds).find((e: CFlow) => { return e.condition(context, signal) });
//         if (iflow) {
//             return Object.values(this.outBounds).reduce((p, e: CFlow) => {
//                 if (e.condition(context, signal)) {
//                     p[e.name] = e
//                 }
//                 __debug(this.name, ' to ', e.name);
//                 return p;
//             }, {});
//         }
//         return null;
//     }
// }
// class CAndGateway extends CGateway {
//     constructor(public name: string, handle ?: IHandle){
//         super(name, handle);
//     }
//     step(context: IContext, signal: ISignal): IBounds {
//         let iflow = Object.values(this.inBounds).every((e: CFlow) => { return e.condition(context, signal) });
//         if (iflow) {
//             return Object.values(this.outBounds).reduce((p, e: CFlow) => {
//                 p[e.name] = e
//                 __debug(this.name, ' to ', e.name);
//                 return p;
//             }, {});
//         }
//         return null;
//     }
// }

// /*
//     {
//         flows : [
//             't_anonymous => gw_o_registered?',
//             'gw_o_registered? => t_registering', 't_registering => t_registering2', 't_registering2 => gw_o_registered?'
//             'gw_o_registered? => t_registered', 't_registered => gw_o_profile',
//             'gw_o_profile => t_profile'
//         ]
//         t_anonymous :()=>{
//         },
//         t_registering : ()=>{
//         },
//         t_registering2 : ()=>{
//         },
//         t_registered : ()=>{
//         },
//         t_profile : ()=>{
//         },
//         'gw_o_registered?' : {
//             't_anonymous => gw_o_registered?' : (signal) =>{
                        
//             },
//             't_registering2 => gw_o_registered?' : (signal) =>{
                        
//             },
//         }
//         gw_o_profile : {
//             't_registered => gw_o_profile' : (signal) =>{
                        
//             },
//         }
//     }
// */

// export interface IPlanConf {
//     flows : string[];
//     [key : string] : string[] | IHandle | { [flowName : string] : ICondition } ;
// }

// abstract class NodeCreator {
//     constructor(public assert_key: string, private assert_value: string){
//     }
//     assertKey(key: string){
//         if(key.indexOf(this.assert_key) != 0) {
//             throw new Error(`${this.constructor.name} '${key}' has no prefix: '${this.assert_key}'.`);
//         }
//         return true;
//     }
//     assertValue(key: string, value ?: string | IHandle | ICondition | {[name: string]: ICondition}) {
//         if({}.toString.call(value) != this.assert_value){
//             throw new Error(`${this.constructor.name} '${key}' has no value type: ${this.assert_value}.`);
//         }
//         return true;
//     }
//     abstract isPrefix(key: string): boolean;
//     abstract create(key: string, value ?: ICondition | IHandle ) : INode;
// }
// class OrGatewayCreator extends NodeCreator{
//     isPrefix(key: string): boolean {
//         return key.indexOf('gw_o_')==0 && !key.includes('=>')
//     }
//     constructor(){
//         super('gw_o_', '[object Object]');
//     }
//     create(key: string, value ?: IHandle): INode {
//         return new COrGateway(key, value);
//     }
// }
// class AndGatewayCreator extends NodeCreator{
//     isPrefix(key: string): boolean {
//         return key.indexOf('gw_+_')==0 && !key.includes('=>')
//     }
//     constructor(){
//         super('gw_+_', '[object Object]');
//     }
//     create(key: string, value ?: IHandle): INode {
//         return new CAndGateway(key, value);
//     }
// }
// class FlowWithConditionCreator extends NodeCreator{
//     isPrefix(key: string): boolean {
//         return key.indexOf('=>') > 1 
//     }
//     constructor(){
//         super('=>', '[object Function]');
//     }
//     assertKey(key: string){
//         if(key.indexOf(this.assert_key) < 0) {
//             throw new Error(`${this.constructor.name} '${key}' has no prefix: '${this.assert_key}'.`);
//         }
//         if(key.split(this.assert_key).length != 2){
//             throw new Error(`${this.constructor.name} '${key}' can't be split to 2.`);
//         }
//         return true;
//     }
//     create(key: string, value : ICondition): INode {
//         return new CFlow(key, value);
//     }
// }
// class TaskCreator extends NodeCreator{
//     isPrefix(key: string): boolean {
//         return key.indexOf('t_')==0 && !key.includes('=>')
//     }
//     constructor(){
//         super('t_', '[object AsyncFunction]');
//     }
//     create(key: string, value : IHandle): INode {
//         return new CTask(key, value);
//     }
// }
// class Creator {
//     points : {[prefix: string] : NodeCreator};
//     constructor(){
//         this.points = [
//             new OrGatewayCreator(), 
//             new AndGatewayCreator(), 
//             new FlowWithConditionCreator(), 
//             new TaskCreator()
//         ].reduce((p,c) =>  (p[c.assert_key] = c) && p , {});
//     }

//     assertDef(nodes: IBounds, name: string, flowName: string){
//         if(!nodes[name]) {
//             throw `node '${name}' in '${flowName}' is undefined.`;
//         }
//     }

//     loot(conf: {}) {
//         try {
//             let nodes: IBounds = {}
//             for(let i in conf) {
//                 if({}.toString.call(conf[i]) == '[object Array]'){
//                     continue;
//                 }
//                 nodes[i] = this.create(i, conf[i]);
//                 if({}.toString.call(conf[i]) == '[object Object]'){
//                     nodes = {...nodes, ...this.loot(conf[i])};
//                 }
//             }
//             for(let i = 0 ; conf['flows'] && i < conf['flows'].length ; i ++) {
//                 this.points['=>'].assertKey(conf['flows'][i]);
//                 nodes[conf['flows'][i]] = nodes[conf['flows'][i]] || new CFlow(conf['flows'][i]);

//                 let nodeNames = conf['flows'][i].split('=>').map(e=>e.trim());
//                 this.assertDef(nodes, nodeNames[0], conf['flows'][i]);
//                 this.assertDef(nodes, nodeNames[1], conf['flows'][i]);

//                 let first = nodes[nodeNames[0]], second = nodes[nodeNames[1]];
//                 first.flowTo(nodes[conf['flows'][i]]);
//                 nodes[conf['flows'][i]].flowTo(second);
//             }
//             return nodes;
//         }catch(e){
//             console.log(e.toString());
//         }   
//     }
    
//     create(key: string, value ?: ICondition | IHandle ){
//         let pre = Object.keys(this.points);
//         let prefix =pre.filter(e=>this.points[e].isPrefix(key))[0];
//         if(!prefix) {
//             throw new Error(`'${key}' has no right prefix '${pre.join(',')}'.`);
//         }
//         this.points[prefix].assertKey(key);
//         this.points[prefix].assertValue(key, value);
//         return this.points[prefix].create(key, value);
//     }
// }


// export class CPlan {
//     constructor(
//         protected context: IContext, 
//         protected plans: {[name: string] : IBounds} = {}, 
//         protected schedules: {[id: string] : IBounds} = {}
//     ) {
//     }
//     async move(schedid: string, signal: ISignal): Promise<void> {
//         try {
//             let curr = this.schedules[schedid];
//             let next: IBounds = {};
//             for (let i in curr) {
//                 let sig = await curr[i].handle(this.context, signal);
//                 next = { ...next, ...(curr[i].step(this.context, sig)) };
//             }
//             this.schedules[schedid] = next;
//         } catch (i) {
//             throw (i);
//         }
//     }
//     getState(schedid: string){
//         return this.schedules[schedid].name;
//     }
//     start(name: string) {
//         let id = Math.round(Math.random() * 100000000);
//         let rootName = Object.keys(this.plans[name])[0];
//         let root =this.plans[name][rootName] ;
//         this.schedules['sched_'+id] = <IBounds>{};
//         this.schedules['sched_'+id][root.name] = root;
//         return 'sched_'+id;
//     }
//     create(name: string, conf: IPlanConf): void {
//         console.log('plan create')
//         if({}.toString.call(conf.flows) != '[object Array]'){
//             throw `flows is not [].`;
//         }
//         let creator = new Creator();
//         let nodes : IBounds = creator.loot(conf);
        
//         this.plans[name] = nodes;
//     }
// }

// interface IStep { 
//     id:string, label:string, optid:string, actions: {[label:string]:boolean}, cursor?:{id:string,name:string}//cursor to option 
// }

// class Workflow {
//     constructor(public name: string, serial?: string){
//         if(!serial){
//             this.blank(0, '发起人');
//         }else {
//             this.unserialize(serial);
//         }
        
//     }
//     drawing: Drawing = new Drawing();
//     steps: { label: string, curr: IStep, fwd: IStep }[] = [];
//     blank(i:number, label: string){
//         this.steps[i] = {
//             label: label,
//             curr: {id: '', optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}},
//             fwd: {id: '',  optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}}
//         };
//         return this.steps[i];
//     }
//     valid(step: IStep){
//         return step && step.cursor && step.cursor.id && step.cursor.name;
//     }
//     count(){
//         return this.steps.length;
//     }
//     build(){
//         for(let i = 0; i < this.steps.length; i ++){
//             if(!this.valid(this.steps[i].curr)){
//                 this.steps.splice(i,1);
//             }else{
//                 this.steps[i].curr.id = this.steps[i].curr.id || uuid();
//                 this.steps[i].curr.optid = this.steps[i].curr.cursor.id;
//                 this.steps[i].curr.label = this.steps[i].curr.cursor.name;
//                 if(!this.steps[i].curr.actions[Action.FORWARD]) {
//                     this.steps[i].fwd = {id: '',  optid: '', label: '', actions:{'_COMMIT':true}, cursor:{id:'',name:''}};
//                 }else if(this.valid(this.steps[i].fwd)){
//                     this.steps[i].fwd.id = this.steps[i].fwd.id || uuid();
//                     this.steps[i].fwd.optid = this.steps[i].fwd.cursor.id;
//                     this.steps[i].fwd.label = this.steps[i].fwd.cursor.name;
//                 }
//             }
//         }
//         this.drawing.clear();
//         for(let i = 0; i < this.steps.length; i ++){
//             if(this.steps[i] && this.steps[i].curr && this.steps[i].curr.id) {
//                 this.drawing.drop(this.steps[i].curr);
//                 this.drawing.connect(
//                     this.steps[i-1] ? this.steps[i-1].curr : null, 
//                     this.steps[i].curr, 
//                     this.steps[i+1] ? this.steps[i+1].curr : null,
//                     this.steps[0] ? this.steps[0].curr : null,
//                     this.steps[i].fwd
//                 );
//             }
//         }
//     }
//     toPlanConf(){
//         // let result = {flows: this.flows.map(e=> e.id.replace('___', ' => '))};
//         // result = this.nodes.filter(e => e.id.indexOf('t_') == 0).reduce((p,c) =>p[c.id]= WorkflowAction[Action.HANDLE] && p, result);
//         // result = this.nodes.filter(e => e.id.indexOf('gw_o_') == 0).reduce((p,c) => 
//         //     p[c.id]= this.flows.filter(f=>f.id.includes(c.id)).reduce((a,fl) => a[fl.id.replace('___', ' => ')] = WorkflowAction[fl.act], {}) && p, result);
//         // return result;
//     }
//     summary(){
//         // let result = {flows: this.flows.map(e=> e.id.replace('___', ' => '))};
//         // result = this.nodes.filter(e => e.id.indexOf('t_') == 0).reduce((p,c) =>p[c.id]= Action.HANDLE && p, result);
//         // result = this.nodes.filter(e => e.id.indexOf('gw_o_') == 0).reduce((p,c) => 
//         //     p[c.id]= this.flows.filter(f=>f.id.includes(c.id)).reduce((a,fl) => a[fl.id.replace('___', ' => ')] = fl.act, {}) && p, result);
//         // return result;
//     }
//     serialize(){
//         return JSON.stringify(this.steps)
//     }
//     unserialize(str: string){
//         try{
//             this.steps = JSON.parse(str);
//             this.build();
//         }catch(e){
//             console.log('unserialization error.')
//         }
//     }
// }

// class Drawing {
//     constructor(){
//         this.connectors = [
//             new CommitConnector(), 
//             new ConfirmConnector(), 
//             new RejectConnector(), 
//             new ForwardConnector()
//         ].reduce((p,c) =>  (p[c.tag] = c) && p , {});
//     }
//     connectors : {[action: string] : IConnector}
//     flows: { id: string, label: string, source: string, target: string, act: Action}[] = [];
//     nodes: { id: string, label: string }[] = [];
//     clear(){
//         this.flows.splice(0, this.flows.length);
//         this.nodes.splice(0, this.nodes.length);
//     }
//     flow(source: string, target: string, act: Action){
//         let flow = this.flows.find(e=>e.id == `${source}___${target}`);
//         if(flow){
//             flow.label += `/${ActionLabel[act]}`
//         }else{
//             this.flows.push({ id: `${source}___${target}`, source: `${source}`, target: `${target}`, label: ActionLabel[act], act: act });
//         }
//     }
//     node(source: string, label: string) {
//         let index = this.nodes.findIndex(e=>e.id == `${source}`);
//         index < 0 && this.nodes.push({id: source, label: label});
//     }
//     drop(step: IStep){
//         this.node(`t_${step.id}`, step.label);
//         this.node(`gw_o_${step.id}`, '');
//         this.flow(`t_${step.id}`, `gw_o_${step.id}`, Action.DEFAULT);
//     }
//     connect(prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep){
//         Object.keys(curr.actions).filter(e=>curr.actions[e]).forEach(e=>this.connectors[e].connect(this, prev, curr, next, first, fwd));
//     }
// }
// interface IConnector {
//     tag: Action;
//     connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void;
// }
// class CommitConnector implements IConnector{
//     tag = Action.COMMIT;
//     connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
//         next && next.id && drawing.flow(`gw_o_${curr.id}`, `t_${next.id}`, Action.COMMIT);
//     }
// }
// class ConfirmConnector implements IConnector{
//     tag = Action.CONFIRM;
//     mode = 1;
//     connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
//         this.mode == 1 && prev && prev.id && drawing.flow(`gw_o_${curr.id}`, `t_${prev.id}`, Action.CONFIRM);
//         this.mode == 2 && first && first.id && drawing.flow(`gw_o_${curr.id}`, `t_${first.id}`, Action.CONFIRM);
//     }
// }
// class RejectConnector implements IConnector{
//     tag = Action.REJECT;
//     connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
//         prev && prev.id && drawing.flow(`gw_o_${curr.id}`, `t_${prev.id}`, Action.REJECT);
//     }
// }
// class ForwardConnector implements IConnector{
//     tag = Action.FORWARD;
//     connect(drawing: Drawing, prev: IStep, curr: IStep, next: IStep, first: IStep, fwd: IStep): void {
//         if(fwd && fwd.id){
//             drawing.drop(fwd);
//             drawing.flow(`gw_o_${curr.id}`, `t_${fwd.id}`, Action.FORWARD);
//             drawing.flow(`t_${fwd.id}`, `gw_o_${fwd.id}`, Action.DEFAULT);
//             drawing.flow(`gw_o_${fwd.id}`, `t_${curr.id}`, Action.COMMIT);
//         }
//     }
// }
// const ActionLabel = {
//     _COMMIT : '通过',
//     _CONFIRM : '解决',
//     _REJECT : '拒绝',
//     _FORWARD : '转交',
//     _TRUE : ''
// }
// const WorkflowAction = {
//     _COMMIT: (context: IContext, signal: ISignal) : boolean => {
//         return signal && signal['code'] == 'OK' && signal['action'] == Action.COMMIT;
//     },
//     _REJECT: (context: IContext, signal: ISignal) : boolean => {
//         return signal && signal['code'] == 'OK' && signal['action'] == Action.REJECT;
//     },
//     _FORWARD: (context: IContext, signal: ISignal) : boolean => {
//         return signal && signal['code'] == 'OK' && signal['action'] == Action.FORWARD;
//     },
//     _CONFIRM: (context: IContext, signal: ISignal) : boolean => {
//         return signal && signal['code'] == 'OK' && signal['action'] == Action.CONFIRM;
//     },
//     _TRUE: (context: IContext, signal: ISignal) : boolean => {
//         return true;
//     },
//     _HANDLE: async (context: IContext, signal: ISignal) : Promise<ISignal> => {
//         let action = RemoteAction[signal['action']];
//         if(action){
//             let { code } = await context.remote[action]({ownerid : signal.param.ownerid, schedid : signal.param.schedid, action : signal['action']});
//             signal['code'] = code;
//         }
//         return signal;
//     },
//     _NOPE:  async (context: IContext, signal: ISignal) : Promise<ISignal> => {
//         return signal;
//     }
// }
// export enum Action {
//     COMMIT = '_COMMIT',
//     CONFIRM = '_CONFIRM',
//     REJECT = '_REJECT',
//     FORWARD = '_FORWARD',
//     DEFAULT = '_TRUE',
//     HANDLE = '_HANDLE',
//     NOPE = '_NOPE',
// }
// const RemoteAction = {
//     _COMMIT : 'commit',
//     _CONFIRM : 'confirm',
//     _REJECT : 'reject',
//     _FORWARD : 'forward'
// }
// export class WorkflowPlan{
//     workflows : Workflow[] = [];
//     cursor: Workflow = null;
//     actlabels = [];
//     constructor(public options : {id:string,name:string}[]){
//         this.actlabels = Object.keys(Action).filter(e=>ActionLabel[Action[e]]).map(e=>({action:Action[e], label:ActionLabel[Action[e]]}));
//         this.create('空白模板');
//         this.cursor = this.workflows[0];
//     };
    
//     create(name: string, serial?: string){
//         if(!name){
//             return;
//         }
//         let wf = new Workflow(name, serial);
//         let first = wf.steps[0];
//         first.curr.cursor = this.options && this.notNullOptions()[0];
//         this.workflows.push(wf);
//     }
//     blank(i: number, label: string){
//         let b = this.cursor.blank(i, label);
//         b.curr.cursor = this.options && this.notNullOptions()[0];
//     }
//     rm(){
//         if(this.workflows.length == 1){
//             return;
//         }
//         this.workflows.splice(this.workflows.findIndex(e=>e==this.cursor),1);
//     }
//     notNullOptions(){
//         return this.options.filter(e=>e.id && e.name);
//     }
//     nullOptions(){
//         return this.options.filter(e=> !e.id || !e.name);
//     }
//     build(){
//         this.cursor.build();
//     }
//     async save(us: UserService){
//         let params = this.workflows.map(e => ({name: e.name, wf: e.serialize()}));
//         let r = await us.saveWorkflow(params);
//         console.log('save '+r.code);
//     }

//     async restore(us: UserService){
//         let wf = await us.getWorkflow();
//         wf && wf.forEach(e =>{
//             this.create(e.name, e.wf);
//         })
//         if(this.workflows.length < 1){
//             this.create('空白模板');
//         }
//         this.cursor = this.workflows[this.workflows.length-1];
//         return this.cursor;
//         //console.log(this.cursor.name, this.cursor.steps, this.cursor.drawing)
//     }
// }