import { Injectable, OnDestroy, Component } from '@angular/core';
import { Subject } from 'rxjs';


export interface IMessageData {
}

export interface IBusMessage {
    command : string;
    data : IMessageData;
}


export interface IBus { 
    name(): string;
    receive(_this : IBus, msg : IBusMessage) : void;
}

export abstract class Bus implements IBus{
    abstract name(): string;
    constructor(protected bus: BusService){
        if(bus){
            bus.register(this);
        }
        //console.log(this.constructor.name, 'rgistered.');
    }
    receive(_this : IBus, msg : IBusMessage) : void{
        //console.log(_this.constructor.name, _this,  _this[msg.command], msg.command);
        _this[msg.command] && _this[msg.command](msg);
    }
}

interface SubjectList {
    [key: string]: Subject<IBusMessage>;
}

@Injectable()
export class BusService {
    private subjects : SubjectList = {}; 
    constructor(){
        // console.log(this.constructor.name)
    }

    send(to: string, msg: IBusMessage) {
        if(to && this.subjects[to]){
            // console.log('send',to)
            this.subjects[to].next(msg);
        }
    }
    unregister(bus: IBus, name: string) {
        //console.log(bus.constructor.name, 'to be unrgistered.');
        if(this.subjects[name]) {
            this.subjects[name] = null;
            //console.log(bus.constructor.name, 'unrgistered.');
        }
    }
    register(bus: IBus) {
        if(bus && this.subjects[bus.name()]) {
            this.subjects[bus.name()] = null;
        }
        if(bus && !this.subjects[bus.name()]) {
            this.subjects[bus.name()] = new Subject<IBusMessage>();
            //only register once
            this.subjects[bus.name()].asObservable().subscribe((msg)=>{/* console.log(bus.name(),msg); */bus.receive(bus, msg)});
        }
    }
}

