import { Component, AfterViewInit, AfterViewChecked, ChangeDetectorRef, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

const codeValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}

@Component({
    selector: 'flow',
    templateUrl: './CPNT.flow.wflow.html',
    styleUrls: ['./CPNT.flow.wflow.css'],
})
export class CWFlowFlow implements AfterViewInit {
    
    ngAfterViewInit(): void {
        this.name.setValue(this.action);
    }
    name = new FormControl('', [codeValidator]);
    @Input() action;
    @Output()
    actionChange = new EventEmitter<{}>();
    constructor() {
        console.log(2)
        this.name.valueChanges.subscribe(e=>{ 
            this.actionChange.emit(e);
        })
    }
    
}