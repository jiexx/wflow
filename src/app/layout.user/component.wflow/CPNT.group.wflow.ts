import { Component, AfterViewInit, EventEmitter, Input, Output, ChangeDetectorRef, ApplicationRef, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Bus, BusService, IBusMessage } from 'app/common/bus/bus';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CDDlg } from 'app/common/dialog/CPNT.ddlg';
import { CChangeWflow } from './CPNT.change.wflow';


const codeValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
@Component({
    selector: 'groups',
    templateUrl: './CPNT.group.wflow.html',
    styleUrls: ['./CPNT.group.wflow.css'],
    changeDetection: ChangeDetectionStrategy.OnPush    
})
export class CWFlowGroup extends Bus implements AfterViewInit {
    name(): string {
        return this.className;
    }
    ngOnChanges(){
        this.titleCtrl.setValue(this.title);
    }
    
    ngAfterViewInit(): void {
        this.bus.register(this);
        this.titleCtrl.valueChanges.subscribe(e =>{
            this.title = e;
            this.titleChange.emit(e);
        })
    }
    titleCtrl = new FormControl('',[codeValidator]);
    @Input() className;
    @Input() title;
    @Output() titleChange = new EventEmitter<string>();
    @Input() isAction = false;
    @Input() canRemove = true;
    @Input() canCheck = true;
    @Input() objects = [];
    @Input() options;
    @Output() objectsChange = new EventEmitter<any>();
    @Output() onAppend = new EventEmitter<any>();
    @Output() onChange = new EventEmitter<any>();
    @Output() onRemove = new EventEmitter<any>();
    @Output() onSelect = new EventEmitter<any>();
    selected: number = -1;
    constructor(protected bus: BusService, private cdr:ChangeDetectorRef, private ar:ApplicationRef) {
        super(null)
        this.selected = -1;
        
    }
    select(obj,i){
        this.selected = i;
        this.onSelect.emit(obj);
    }
    append(){
        let appendix: any = this.options ? {opts: this.options, obj: {}, checked:this.canCheck} :  {obj:'', valid:true, checked:this.canCheck};
        if(this.isAction){
            appendix = {obj: '', checked:this.canCheck, target:this.options[0], options:this.options}
        }
        this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CDDlg, button: 'yes | no', component: CChangeWflow, returnto: this, cb:'onAppendClose', title: '添加'+this.title,appendix:appendix } })
    }
    remove(obj,i){
        this.objects.splice(i,1);
        // this.objectsChange.emit(this.objects);
        //this.onRemove.emit({obj:obj, idx:i});
        if(this.className == 'taskGroups'){
            this.bus.send('CWFlow', <IBusMessage>{command: 'removeTask', data:{obj: obj, idx: i}})
        }
        if(this.className == 'flowGroups'){
            this.bus.send('CWFlow', <IBusMessage>{command: 'removeFlow', data:{obj: obj, idx: i}})
        }
    }
    change(obj,i){
        let appendix:any = this.options ? {opts: this.options, obj: obj, index:i, checked:this.canCheck} :  {valid: obj.valid, obj: obj.name, index:i, checked:this.canCheck};
        if(this.isAction){
            appendix = {obj: obj.name, index:i, checked:this.canCheck, target:obj.target, options:this.options}
        }
        this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CDDlg, button: 'yes | no', component: CChangeWflow, returnto: this, title: '修改'+this.title, appendix: appendix } })
    }
    onDlgClose({data}){
        if(data.action == 'yes'){
            if(this.isAction){
                //this.onChange.emit({obj: data.appendix.obj, idx: data.appendix.index, target: data.appendix.target});
                this.bus.send('CWFlow', <IBusMessage>{command: 'changeFlow', data:{obj: data.appendix.obj, idx: data.appendix.index, target: data.appendix.target}})
                return;
            }
            if(data.appendix.opts){
                this.bus.send('CWFlow', <IBusMessage>{command: 'changeTask', data:{obj: data.appendix.obj, idx: data.appendix.index, exp:data.appendix.obj.expire}})
                //this.onChange.emit({obj: data.appendix.obj, idx: data.appendix.index});
            }else{
                this.bus.send('CWFlow', <IBusMessage>{command: 'changeViewer', data:{obj: {name:data.appendix.obj, valid:data.appendix.valid}, idx: data.appendix.index}})
                //this.onChange.emit({obj: {name:data.appendix.obj, valid:data.appendix.valid}, idx: data.appendix.index});
            }
            //this.objectsChange.emit(this.objects);
        }
    }
    onAppendClose({data}){
        if(data.action == 'yes'){
            if(data.appendix.target){
                //this.onAppend.emit({obj: data.appendix.obj, idx: data.appendix.index, target: data.appendix.target});
                this.bus.send('CWFlow', <IBusMessage>{command: 'createFlow', data:{obj: data.appendix.obj, idx: data.appendix.index, target: data.appendix.target}})
                return;
            }
            let result;
            if(data.appendix.opts){
                result = data.appendix.obj;
                this.bus.send('CWFlow', <IBusMessage>{command: 'createTask', data:{obj: result, exp:data.appendix.obj.expire}})
            }else{
                result = {name:data.appendix.obj, valid: data.appendix.valid};
                this.bus.send('CWFlow', <IBusMessage>{command: 'createViewer', data:{obj: result}})
            }
            //this.onAppend.emit({obj: result});
        }
    }
}