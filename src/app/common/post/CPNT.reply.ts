import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'config/index';
import { DomSanitizer } from '@angular/platform-browser';
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
    selector: 'reply',
    templateUrl: './CPNT.reply.html',
    styleUrls: ['./CPNT.reply.css'],
})
export class CReply extends Bus implements AfterViewInit  {
    name(): string {
        return  'CWorks';
    }
    ngAfterViewInit(): void {
        
    }
    avatar: string = null;
    model = {
        plan: {},
        textarea : {
            content: '',
            attachments : []
        },
        action: {}
    }
    @Input() id = '';
    @Input() forwards = [];
    @Input() actions = [];
    @Input() state = '';
    @Output() onCancel : EventEmitter<any> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    submit(){
        console.log(this.model);
        if(this.model.textarea.content && this.model.textarea.content.length > 20 && this.id && this.model.action['which']){
            let data = {solution: this.model.textarea.content, attachments: this.model.textarea.attachments.map(e=>e.a), schedid: this.id, action: this.model.action['which'], rating:this.model.action['rating'], reject:this.model.action['reject']};
            if(this.model.action['forward'] && this.model.action['forward'].id) {
                data['forward'] = this.model.action['forward']
            } 
            this.user.moveSchedule(data).then(res =>{
                this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: null, title: '提交', info: '回复'+res.code } })
            })
        }
    }
    cancel(){
        this.onCancel.emit();
    }
}