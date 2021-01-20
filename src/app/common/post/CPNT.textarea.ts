import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { IUploaderResult } from '../uploader/CPNT.uploader';
import { IAttachment } from './CPNT.attachment';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
    if(control.value.length< 20) {
        return {invalid: true, msg: '不能少于20字'};
    }
}


@Component({
    selector: 'ctextarea',
    templateUrl: './CPNT.textarea.html',
    styleUrls: ['./CPNT.textarea.css'],
})
export class CTextarea extends Bus implements AfterViewInit  {
    name(): string {
        return  'CTextarea';
    }
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    ngAfterViewInit(): void {

    }
    content = new FormControl('',[solnValidator]);
    attachments: IAttachment[] = [];
    @Input() model: any = null;
    @Output() modelChange: EventEmitter<any> = new EventEmitter();
    @ViewChild('textarea') textarea: ElementRef<HTMLDivElement>;
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    onComplete( result : IUploaderResult[] ){
        if( !result || result.length < 1){
            return;
        }
        this.user.upload(result.map(e=>({filename:e.name,base64:e._base64imgs}))).then(res=>{
            this.attachments = [...this.attachments,...res];
            //this.textarea.nativeElement.innerHTML += res.map(e=>'<img src="'+e.url+'">').join('');
            this.modelChange.emit({content:this.textarea.nativeElement.innerHTML, attachments:this.attachments});
        })
    }
    onInput(target){
        this.content.setValue(target.innerHTML);
        this.modelChange.emit({content:this.textarea.nativeElement.innerHTML, attachments:this.attachments});
    }
    onKey(evt: KeyboardEvent){
        if(evt.keyCode === ENTER){
            this.textarea.nativeElement.innerHTML = this.textarea.nativeElement.innerHTML.replace('<div>', '<br>').replace('</div>','');
            this.moveCaret();
        }
    }
    moveCaret(): void {
        let range = document.createRange(),
            pos = this.textarea.nativeElement.lastChild.textContent.length > 0 ? this.textarea.nativeElement.lastChild.textContent.length - 1 : 0,
            sel = window.getSelection();
        console.log(pos, this.textarea.nativeElement.lastChild.textContent)
        range.setStart(this.textarea.nativeElement.lastChild, pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}