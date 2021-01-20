import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'config/index';
import { DomSanitizer } from '@angular/platform-browser';
import { ITag } from './CPNT.tag';
import { IAttachment } from './CPNT.attachment';
import { IColumn } from '../table/CPNT.table';
import { IAction } from './CPNT.action';
import { IUploaderResult } from '../uploader/CPNT.uploader';
import { IDialogMessage } from '../dialog/ITF.dialog';
import { CInfo } from '../dialog/CPNT.info';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
    if(control.value.length< 20) {
        return {invalid: true, msg: '不能少于20字'};
    }
}
@Component({
    selector: 'cnew',
    templateUrl: './CPNT.new.html',
    styleUrls: ['./CPNT.new.css'],
})
export class CNew extends Bus implements AfterViewInit  {
    name(): string {
        return  'CNew';
    }
    ngAfterViewInit(): void {
        
    }
    model = {
        plan: {},
        tags: [],
        textarea : {
            content: '',
            attachments : []
        },
        instead : {},
        actions: []
    }
    // @Input() tags: ITag[] = [];
    // @Input() attachments: IAttachment[] = [];
    // @Input() persons: IColumn[] = [];
    // @Input() actions: IAction[] = []
    @Output() onCancel : EventEmitter<any> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    async submit(){
        if( (this.model.instead['id'] || this.user.myId()) && this.model.textarea.content && this.model.textarea.content.length > 20 && this.model.plan['id']){
            let res = await this.user.startSchedule({userid: this.model.instead['id'] || this.user.myId(), solution:this.model.textarea.content, planid:this.model.plan['id'], tags: this.model.tags, attachments: this.model.textarea.attachments.map(e=>e.a) });
            let info =  JSON.stringify('新建工单'+res.code);
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        }
        else {
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: 'error' } })
        }
    }
    cancel(){
        this.onCancel.emit();
    }
}