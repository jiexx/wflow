import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
export interface ICPlan {
    id: string;
    name: string;
}

@Component({
    selector: 'plans',
    templateUrl: './CPNT.plan.html',
    styleUrls: ['./CPNT.plan.css'],
})
export class CPlans extends Bus implements AfterViewInit  {
    name(): string {
        return  'CPlans';
    }
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    ngAfterViewInit(): void {
        this.user.getModels().then(wf=>{
            this.plans = wf.map(e=>({id:e.id, name:e.name}));
        })
        this.plan.valueChanges.subscribe(e=>{
            this.modelChange.emit(e);
        })
    }
    plans: ICPlan[] = [];
    plan = new FormControl('',[solnValidator]);
    @Input() model: ICPlan = null;
    @Output() modelChange: EventEmitter<ICPlan> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService,) {
        super(bus);
    }

    displayWith(plan){
        if(plan){
            return plan.name;
        }
        return ''
    }
}