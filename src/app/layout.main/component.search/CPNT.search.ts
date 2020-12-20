import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';
import { FormControl } from '@angular/forms';
import { UserService } from 'app/common/data/user';
import { MatPaginator } from '@angular/material/paginator';
import { startWith, switchMap, map, catchError } from 'rxjs/operators';
import {merge, Observable, of as observableOf} from 'rxjs';



@Component({
    templateUrl: './CPNT.search.html',
    styleUrls: ['./CPNT.search.css'],
})
export class CSearch implements AfterViewInit {
    sort = { datatime: -1};
    all:{id:string, solution: string, tags:  {id:string, name:string}[], datatime: any}[];
    load(){
        if(this.sort.datatime == 1){
            this.sort.datatime = -1;
        }else {
            this.sort.datatime = 1;
        }
        this.paginator.page.pipe( 
            startWith({}), 
            switchMap(async () => {
                return await this.user.geResults(this.paginator.pageSize, this.paginator.pageIndex*this.paginator.pageSize, {}, this.sort, this.searchCtrl.value)
            }),
            map(data => {
                return data;
            }),
            catchError(() => {
                return observableOf([]);
            })
        ).subscribe(data => {
            this.all = data;
            this.cdr.detectChanges();
        });
    }
    ngAfterViewInit(): void {
        this.load();
    }
    @ViewChild(MatPaginator) paginator: MatPaginator;
    searchCtrl = new FormControl();
    constructor( private route: ActivatedRoute,public user: UserService, private cdr:ChangeDetectorRef) {
        this.searchCtrl.setValue(this.route.snapshot.queryParamMap.get('kw') || null);
    }
    stringify(str): void {
        JSON.stringify(str);
    }
    toLocalString(datatime:string){
        try{
            return new Date(datatime).toLocaleString();
        }catch(e){
            return '';
        }
    }
    num = [1,1,1,1,1,1,1,1,1];
    selected = 'option1';
    enterSearch() {
        var event = window.event || arguments.callee.caller.arguments[0];
        if (event.keyCode == 13) {
            this.load();
        }
    }

}