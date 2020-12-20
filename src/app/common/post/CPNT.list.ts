import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/data/path';
import { DomSanitizer } from '@angular/platform-browser';
import { IAction } from './CPNT.action';
import { IPost } from './CPNT.post';


@Component({
    selector: 'lists',
    templateUrl: './CPNT.list.html',
    styleUrls: ['./CPNT.list.css'],
})
export class CLists extends Bus implements AfterViewInit  {
    name(): string {
        return  'CLists';
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