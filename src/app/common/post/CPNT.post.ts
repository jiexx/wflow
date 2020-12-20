import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/data/path';
import { DomSanitizer } from '@angular/platform-browser';
import { IAction } from './CPNT.action';

export interface IPost {
    avatar: string;
    title: string;
    username: string;
    rolename: string;
    datatime: string;
    cover: string;
    content: string;
    attachments: string;
    id: string;
    actions: any[];
    forwards: any[];
    state: string;
    replies: IPost[];
}

@Component({
    selector: 'posts',
    templateUrl: './CPNT.post.html',
    styleUrls: ['./CPNT.post.css'],
})
export class CPosts extends Bus implements AfterViewInit  {
    name(): string {
        return  'CPosts';
    }

    ngAfterViewInit(): void {

    }
    @Input() posts: IPost[];
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    toLocalString(datatime:string){
        return new Date(datatime).toLocaleString();
    }
    dispalyImage(a) {
        if(a.replace){
            let b = a.replace(/<img.+?src="(.+?)".+?>/g, '<a href="$1" target="_blank"><img style="width:auto;max-height:10rem" src="$1"></a>');
            return this.sanitizer.bypassSecurityTrustHtml(b);
        }else {
            return a;
        }
    }
}