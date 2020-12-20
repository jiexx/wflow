import { IHandle, ICondition, INode, IContext, ISignal, IBounds  } from './node';


/////////////////////////interface/////////////////////////
export interface IPlan {
    flows : string[];
    root : string;
    [key : string] : string[] | string | IHandle | { [flowName : string] : ICondition } ;
}

export interface IStep { 
    id:string, label:string, optid:string, actions: {[label:string]:boolean}, cursor?:{id:string,name:string}//cursor to option 
}
export const ActionLabel = {
    _COMMIT : '通过',
    _CONFIRM : '解决',
    _REJECT : '拒绝',
    _FORWARD : '转交',
    _TRUE : ''
}
export const WorkflowAction = {
    _COMMIT: (context: IContext, signal: ISignal) : boolean => {
        return signal && signal['code'] == 'OK' && signal['action'] == Action.COMMIT;
    },
    _REJECT: (context: IContext, signal: ISignal) : boolean => {
        return signal && signal['code'] == 'OK' && signal['action'] == Action.REJECT;
    },
    _FORWARD: (context: IContext, signal: ISignal) : boolean => {
        return signal && signal['code'] == 'OK' && signal['action'] == Action.FORWARD;
    },
    _CONFIRM: (context: IContext, signal: ISignal) : boolean => {
        return signal && signal['code'] == 'OK' && signal['action'] == Action.CONFIRM;
    },
    _TRUE: (context: IContext, signal: ISignal) : boolean => {
        return true;
    },
    _HANDLE: async (context: IContext, signal: ISignal) : Promise<ISignal> => {
        /* let action = RemoteAction[signal['action']];
        if(action){
            let { code } = await context.remote[action]({ownerid : signal.param.ownerid, schedid : signal.param.schedid, action : signal['action']});
            signal['code'] = code;
        } */
        return signal;
    },
    _NOPE:  async (context: IContext, signal: ISignal) : Promise<ISignal> => {
        return signal;
    }
}
export enum Action {
    COMMIT = '_COMMIT',
    CONFIRM = '_CONFIRM',
    REJECT = '_REJECT',
    FORWARD = '_FORWARD',
    DEFAULT = '_TRUE',
    HANDLE = '_HANDLE',
    NOPE = '_NOPE',
}
export const RemoteAction = {
    _COMMIT : 'commit',
    _CONFIRM : 'confirm',
    _REJECT : 'reject',
    _FORWARD : 'forward'
}

///////////////////////class///////////////////////////////
/*
    {
        flows : [
            't_anonymous => gw_o_registered?',
            'gw_o_registered? => t_registering', 't_registering => t_verify', 
            'gw_o_registered? => t_registered', 
            't_verify => gw_o_done?', 'gw_o_done? => t_registering', 'gw_o_done? => t_registered', 
        ],
        root: t_anonymous,
        t_anonymous :()=>{
        },
        t_registering : ()=>{
        },
        t_verify : ()=>{
        },
        t_registered : ()=>{
        },
        t_profile : ()=>{
        },
        'gw_o_registered?' : {
            'gw_o_registered? => t_registering' : (signal) =>{
                        
            },
            'gw_o_registered? => t_registered' : (signal) =>{
                        
            },
        }
        'gw_o_done?' : {
            'gw_o_done? => t_registered' : (signal) =>{
                        
            },
            'gw_o_done? => t_registering': (signal) =>{
                        
            },
        }
        'gw_o_workflow' :{
            'gw_o_done? => t_registered': WorkflowAction[Action.COMMIT]
        }
    }
*/