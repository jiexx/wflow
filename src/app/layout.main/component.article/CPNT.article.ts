import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';
import { FormControl } from '@angular/forms';
import { UserService } from 'app/common/data/user';


@Component({
    templateUrl: './CPNT.article.html',
    styleUrls: ['./CPNT.article.css'],
})
export class CArticle {
    public data:{[key:string]:any} = {};
    myControl = new FormControl();
    constructor(private router: Router, private route: ActivatedRoute, private user: UserService, private cdr:ChangeDetectorRef) {
        this.user.geResult(null, null, {_id:this.route.snapshot.queryParamMap.get('id')}).then(data =>{
            this.data = data[0]
            this.cdr.detectChanges();
        })
    }
    toLocalString(datatime:string){
        try{
            return new Date(datatime).toLocaleString();
        }catch(e){
            return '';
        }
    }
}