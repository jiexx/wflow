import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, NgModel } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { IUploaderResult } from '../uploader/CPNT.uploader';
import { Model } from '../../../../workflow';

export interface IAttachment {
    a: string;
    url: string;
    filename: string;
}

@Component({
    selector: 'attachments',
    templateUrl: './CPNT.attachment.html',
    styleUrls: ['./CPNT.attachment.css'],
})
export class CAttachments extends Bus implements AfterViewInit  {
    name(): string {
        return  'CAttachments';
    }

    ngAfterViewInit(): void {
    }
    @Input() model: IAttachment[] = [];
    @Output() modelChange: EventEmitter<IAttachment[]> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService) {
        super(bus);
    }
    getIcon(file:string){
        if(!file){
            return 'white';
        }
        if(['.pdf'].includes(file.substr(file.lastIndexOf('.')))){
            return 'picture_as_pdf';
        }else if(['.zip','.rar'].includes(file.substr(file.lastIndexOf('.')))){
            return 'attach_file';
        }else if(['.xlsx','.doc','.docx'].includes(file.substr(file.lastIndexOf('.')))){
            return 'attach_file';
        };
    }
    getColor(file:string){
        if(!file){
            return 'white';
        }
        if(['.pdf'].includes(file.substr(file.lastIndexOf('.')))){
            return 'rgb(217,28,38)'
        }else if(['.zip','.rar'].includes(file.substr(file.lastIndexOf('.')))){
            return 'rgb(255,231,150)'
        }else if(['.xlsx','.doc','.docx'].includes(file.substr(file.lastIndexOf('.')))){
            return 'rgb(23,87,186)'
        };
    }
    isImage(file:string){
        return file ? ['.png','.jpeg','.jpg','.gif','.bmp'].includes(file.substr(file.lastIndexOf('.'))) : false;
    }
    
}