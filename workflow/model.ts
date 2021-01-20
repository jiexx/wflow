import { __debug } from './logger';
import { __db, __dbName, __colName } from './db';


/////////////////////////interface/////////////////////////
export interface IContext {
    [key: string]: any;
}

export interface ISignal {
    code?: 'yes' | 'no' | string;
    [key: string]: any;
}

export interface INode {
    id: string;
    inBounds: {[key:string]:INode};
    outBounds: {[key:string]:INode};
    name(): string;
    setOut(node: INode): void;
    getOuts(): INode[];
    setIn(node: INode): void;
    getIns(): INode[];
    next(context: IContext, signal: ISignal): INode[];
    handle(context: IContext, signal: ISignal): ISignal;
}

export type IHandle = (context: IContext, signal: ISignal) => ISignal;
export type ICondition = (context: IContext, signal: ISignal) => boolean;
export interface IBounds {
    [name: string]: INode;
}
export interface IPlan {
    flows : string[];
    root : string;
    [key : string] : string[] | string | IHandle | { [flowName : string] : ICondition } ;
}
///////////////////////class///////////////////////////////
abstract class CNode implements INode {
    abstract name(): string;
    inBounds: {[key:string]:INode} = {};    outBounds: {[key:string]:INode} = {};
    setOut(node: INode): void {
        this.outBounds[node.id] = node;
    }
    getOuts(): INode[] {
        return Object.values(this.outBounds);
    }
    setIn(node: INode): void {
        this.inBounds[node.id] = node;
    }
    getIns(): INode[] {
        return Object.values(this.inBounds);
    }
    constructor(public id: string, handle: IHandle){
        if({}.toString.call(handle) == '[object AsyncFunction]' || {}.toString.call(handle) == '[object Function]' ) {
            this.handle = handle
        } 
    }
    handle(context: IContext, signal: ISignal): ISignal{
        return signal;
    }
    abstract next(context: IContext, signal: ISignal):  INode[];
}
export class CTask extends CNode {
    name(): string{
        return 'CTask';
    }
    private role: Role = null;
    private expire: number = null;
    private privilege: string = null;
    setRole(role: Role){
        this.role = role;
    }
    getRole(){
        return this.role;
    }
    setExpire(exp: any){
        this.expire = parseInt(exp);
    }
    getExpire(){
        return this.expire;
    }
    setPrivilege(priv: any){
        this.privilege = priv;
    }
    getPrivilege(){
        return this.privilege;
    }
    next(context: IContext, signal: ISignal): INode[] {
        return this.getOuts();
    }
}
export class CFlow extends CNode {
    name(): string{
        return 'CFlow';
    }
    next(context: IContext, signal: ISignal): INode[] {
        return this.handle(context, signal).code == 'yes' ? this.getOuts() : [];
    }
    handle(context: IContext, signal: ISignal): ISignal{
        return {code: signal['action'] == this.action.id ? 'yes' : 'no'};
    }
    setAction(action: CAction){
        this.action = action;
    }
    getAction(){
        return this.action;
    }
    constructor(public id: string, handle: IHandle, private action: CAction = null){
        super(id, handle);
    }
}

export class COrGateway extends CNode {
    name(): string{
        return 'COrGateway';
    }
    next(context: IContext, signal: ISignal): INode[] {
        let allow = this.getIns().find((flow: CFlow) => flow.name() == 'CFlow' ? flow.handle(context, signal).code == 'yes' : true );
        if (allow) {
            return this.getOuts().filter(n => n.name() == 'CFlow').reduce((p, flow: CFlow) => {
                // if(flow.handle(context, signal).code == 'yes'){
                if(flow.handle(context, signal).code == 'yes'){
                    p = [...p, ...flow.getOuts()];
                }
                __debug(this.name(), ' to ',  p.map(e=>e.id));
                return p;
            }, []);
        }
        return [];
    }
}
export class CAndGateway extends CNode {
    name(): string{
        return 'CAndGateway';
    }
    next(context: IContext, signal: ISignal): INode[] {
        let allow = this.getIns().every((flow: CFlow) => flow.name() == 'CFlow' ? flow.handle(context, signal).code == 'yes' : true );
        if (allow) {
            return this.getOuts().filter(n => n.name() == 'CFlow').reduce((p, flow: CFlow) => {
                if(flow.handle(context, signal).code == 'yes'){
                    p = [...p, ...flow.getOuts()];
                }
                __debug(this.name, ' to ',  p.map(e=>e.id));
                return p;
            }, []);
        }
        return [];
    }
}

export class CAction {
    constructor(public id: string, public name: string) {

    }
}
export class Role {
    constructor(public id: string, public name: string) {

    }
}


export class Model {
    id(){
        return this._id;
    }
    name(){
        return this._name;
    }
    root(): INode[]{
        return this._root;
    }
    tasks(id: string[]): INode[]{
        return id ? id.filter(i => this.table[i] && this.table[i].name()=='CTask').map(i => this.table[i]) : Object.values(this.table).filter(i => i && i.name()=='CTask');
    }
    flows(id: string[]): INode[]{
        return this.tasks(id).map(t => t.getOuts().filter(i => i && i.name()=='CFlow')).reduce((p,c) => ([...p, ...c]), []);
    }
    gateways(id: string[]): INode[]{
        return this.flows(id).map(t => t.getOuts().filter(i => i && i.name().includes('Gateway'))).reduce((p,c) => ([...p, ...c]), []);
    }
    outflows(id: string[]): CFlow[]{
        return this.gateways(id).map(t => t.getOuts().filter(i => i && i.name() == 'CFlow')).reduce((p,c) => ([...p, ...c]), []) as any;
    }
    next(id: string[], signal: ISignal): INode[] {
        let flow = this.tasks(id).map(t => t.next(this.context, signal)).reduce((p,c) => ([...p, ...c]), []);
        let gw = flow.filter(c => c.name() == 'CFlow').map(t => t.next(this.context, signal)).reduce((p,c) => ([...p, ...c]), []);
        return gw.filter(c => c.name().includes('Gateway')).map(t => t.next(this.context, signal)).reduce((p,c) => ([...p, ...c]), []);
    }
    findTaskByRole(roleids: string[]): INode[]{
        return Object.values(this.table).filter(i => i && i.name()=='CTask').filter((t:CTask) => {
            return t.getRole() && (/* (t.getRole().id=='0' && roleids.every(e=>!this.roleids.includes(e)) )|| */ roleids.includes(t.getRole().id)) 
        });
    }
    findRoleByTask(taskids: string[]): Role[]{
        return Object.values(this.table).filter(i => i && i.name()=='CTask' && taskids.indexOf(i.id)>-1).map((e:CTask)=>e.getRole())
        
    }
    findTaskByStart(): INode[]{
        return Object.values(this.table).filter(i => i && i.name()=='CTask').filter((t:CTask) => {
            return t.getRole() &&  t.getRole().id=='0'
        });
    }
    roles: Role[];
    expired: number;
    constructor(private _id: string, private _name: string, private _root: INode[], private table: {[id: string]: INode}, private context: IContext){
        this.roles = Object.values(this.table).filter(i => i && i.name()=='CTask' ).filter((t:CTask) => t.getRole()).map((e:CTask)=>e.getRole());
    }
    
}
