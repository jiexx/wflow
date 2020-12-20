import { IHandle } from "./model";

export interface PlannerMemModel {
    flows : string[];
    root : string;
    [node : string] : string | string[] | IHandle | { [flow : string] : IHandle };
}

export interface PlannerModel { 
    id: string; name: string;
    root: { id: string, role: { id: string, name: string } };
    tasks: { id: string, role: { id: string, name: string }, expire:number, privilege: string }[];
    orgateways: { id: string}[];
    andgateways: { id: string}[];
    flows: { id: string, action: { id: string, name: string }, from: string, to: string }[];
    xml: string;
    expired: number;
}

export enum FlowAction {
    NOPEID = '0',
}