import { __debug } from './logger';

/////////////////////////interface/////////////////////////
export interface IContext {
    [key: string]: any;
}

export interface ISignal {
    [key: string]: any;
}

export interface INode {
    name: string;
    label?: string;
    inBounds: IBounds;
    outBounds: IBounds;
    flowFrom(node: INode): void;
    flowTo(node: INode): void;
    out(): IBounds;
    in():IBounds;
    step(context: IContext, signal: ISignal): IBounds;
    handle(context: IContext, signal: ISignal): Promise<ISignal>;
}

export interface IBounds {
    [name: string]: INode;
}
export type ICondition = (context: IContext, signal: ISignal) => boolean;
export type IHandle = (context: IContext, signal: ISignal) => Promise<ISignal>;

///////////////////////class///////////////////////////////

class CNode1to1 implements INode {
    out(): IBounds {
        return this.outBounds
    }
    in(): IBounds {
        return this.inBounds
    }
    constructor(public name: string, handle: IHandle) {
        if({}.toString.call(handle) == '[object AsyncFunction]' || {}.toString.call(handle) == '[object Function]' ) {
            this.handle = handle
        } 
    }
    async handle(context: IContext, signal: ISignal): Promise<ISignal> {
        return null;
    }
    inBounds: IBounds;    outBounds: IBounds;
    flowFrom(node: INode): void {
        if(this.inBounds && this.inBounds[node.name]) {
            return;
        }
        this.inBounds = {};
        this.inBounds[node.name] = node;
        node.flowTo(this);
    }
    flowTo(node: INode): void {
        if(this.outBounds && this.outBounds[node.name]) {
            return;
        }
        this.outBounds = {};
        this.outBounds[node.name] = node;
        node.flowFrom(this);
    }
    step(context: IContext, signal: ISignal): IBounds {
        __debug(this.name, ' to ', Object.keys(this.outBounds).join(','));
        return this.outBounds;
    }
}
abstract class CGateway implements INode {
    out(): IBounds {
        return this.outBounds
    }
    in(): IBounds {
        return this.inBounds
    }
    constructor(public name: string, handle: IHandle){
        if({}.toString.call(handle) == '[object AsyncFunction]' || {}.toString.call(handle) == '[object Function]' ) {
            this.handle = handle
        } 
    }
    async handle(context: IContext, signal: ISignal): Promise<ISignal> {
        return signal;
    }
    inBounds: IBounds = {};    outBounds: IBounds ={};
    flowFrom(node: INode): void {
        if(this.inBounds && this.inBounds[node.name]) {
            return;
        }
        this.inBounds[node.name] = node;
        node.flowTo(this);
    }
    flowTo(node: INode): void {
        if(this.outBounds && this.outBounds[node.name]) {
            return;
        }
        this.outBounds[node.name] = node;
        node.flowFrom(this);
    }
    abstract step(context: IContext, signal: ISignal): IBounds;
}
export class CTask extends CGateway {
    step(context: IContext, signal: ISignal): IBounds {
        return Object.values(this.outBounds).reduce((p, flow: CFlow) => {
            if(flow.condition(context, signal)){
                let out = Object.values(flow.outBounds).reduce((s, gw: CGateway) => {
                    s = {...s, ...gw.step(context, signal)};
                    return s;
                }, {});
                p = {...p, ...out};
            }
            __debug(this.name, ' to ',  Object.keys(p));
            return p;
        }, {});
        // let outBounds = Object.keys(this.outBounds).reduce((p, out) => {
        //     this.outBounds[out].constructor.name == 'CFlow' ? p = {...p,...this.outBounds[out].step(context, signal)} : p[out] = this.outBounds[out];
        //     __debug(this.name, ' to ',  Object.keys(p));
        //     return p;
        // }, {})
        // return outBounds;
    }
    constructor(public name: string, handle: IHandle){
        super(name, handle);
    }
}
export class CFlow extends CNode1to1 {
    constructor(public name: string, condition ?: ICondition, handle ?: IHandle){
        super(name, handle);
        this.condition = condition || this.condition;
    }
    condition(context: IContext, signal: ISignal): boolean {
        return true;
    }
}

export class COrGateway extends CGateway {
    constructor(public name: string, handle ?: IHandle){
        super(name, handle);
    }
    step(context: IContext, signal: ISignal): IBounds {
        let allow = Object.values(this.inBounds).find((flow: CFlow) => flow.constructor.name == 'CFlow' ? flow.condition(context, signal) : true );
        if (allow) {
            return Object.values(this.outBounds).reduce((p, flow: CFlow) => {
                if(flow.condition(context, signal)){
                    p = {...p, ...flow.outBounds};
                }
                __debug(this.name, ' to ',  Object.keys(p));
                return p;
            }, {});
        }
        return {};
    }
}
export class CAndGateway extends CGateway {
    constructor(public name: string, handle ?: IHandle){
        super(name, handle);
    }
    step(context: IContext, signal: ISignal): IBounds {
        let allow = Object.values(this.inBounds).every((e: CFlow) => { return e.condition(context, signal) });
        if (allow) {
            return Object.values(this.outBounds).reduce((p, flow: CFlow) => {
                if(flow.condition(context, signal)){
                    p = {...p, ...flow.outBounds};
                }
                __debug(this.name, ' to ',  Object.keys(p));
                return p;
            }, {});
        }
        return null;
    }
}
