import { ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import * as XLSX from 'xlsx';
import { BusService, Bus } from 'app/common/bus/bus';
import { CDialog } from 'app/common/dialog/CPNT.dialog';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CInfo } from 'app/common/dialog/CPNT.info';
import { v4 as uuid } from 'uuid';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import {merge, Observable, of as observableOf} from 'rxjs';
import { FormControl } from '@angular/forms';
import { UserService } from 'app/common/data/user';
import { CDDlg } from 'app/common/dialog/CPNT.ddlg';
import { CRepoOpen } from './CPNT.open.repo';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}

@Component({
    templateUrl: './CPNT.repo.html',
    styleUrls: ['./CPNT.repo.css'],
})
export class CRepo extends Bus implements AfterViewInit {
    name(): string {
        return 'CRepo';
    }
    // colTitles: string[] = ['select', 'id', 'state', 'title', 'commitee', 'owner', 'datetime'];  
    
    items: Array<any> = [
    ];
    cols = this.items.map(e => e.descr.map(desc => desc.key));

    initialSelection = [];
    allowMultiSelect = true;
    selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);

    constructor(protected user: UserService, protected bus: BusService, private cdr:ChangeDetectorRef,) {
        super(bus);
        
    }

    isAllSelected(dataSource) {
        const numSelected = this.selection.selected.length;
        const numRows = dataSource.length;
        return numSelected == numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle(dataSource) {
        this.isAllSelected(dataSource) ?
            this.selection.clear() :
            dataSource.forEach(row => this.selection.select(row));
    }

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    @ViewChildren(MatSort) sorts: QueryList<MatSort>;
    @ViewChildren(MatPaginator) paginators: QueryList<MatPaginator>;

    applyFilter(event: Event, i) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.items[i].list.filter = filterValue.trim().toLowerCase();

        if (this.items[i].list.paginator) {
            this.items[i].list.paginator.firstPage();
        }
    }

    repos = [];
    reposPaginator = null;
    status = [{id:1,name:'在职'},{id:8,name:'离职'}];
    
    reposInit(){
        let index = 0;
        this.items[index] = ({
            name: '知识管理', 
            finish: 'reposFinish',
            descr: [], 
            list: []
        });
        this.cdr.detectChanges();
        let item = this.items[index];
        this.reposPaginator =  this.paginators.toArray()[index];
        this.reposPaginator.page.pipe( 
            startWith({}), 
            switchMap(async () => {
                return await this.user.getSolns( this.reposPaginator.pageSize, this.reposPaginator.pageIndex*this.reposPaginator.pageSize);
            }),
            map(data => {
                return data;
            }),
            catchError(() => {
                return observableOf([]);
            })
        ).subscribe(data => {
            //data = data.map(e=> ({...e[e.length-1],...{content:e.map(c=>c.solution).join('\\n')}}));
            item.list = new MatTableDataSource(data);
            item.descr = [{key: '_id', val: '编号'}, 
                {key: 'solution', val: '方案', input:'txt'},
                /* {key: 'origin', val: '工单内容', input:'txt'}, */
                {key: 'content', val: '工单内容', input:'txt'},
                {key: 'flag', val: '编辑', button:'number'},
                {key: 'planname', val: '删除', remove:'number'},
                {key: 'planid', val: '归档', store:'number'}];
            this.cols = this.items.map(e => e.descr.map(desc => desc.key));
            this.cdr.detectChanges();
            item.list.sort = this.sorts.toArray()[index];
            item.list.paginator = this.paginators.toArray()[index];
            this.repos = item.list.data;
        });
    }

    ngAfterViewInit() {
        this.reposInit();
    }
    stringify(s){
        return JSON.stringify(s)
    }
    sortData(sort: Sort, i) {
        if (!sort.active || sort.direction === '') {
            return;
        }

        this.items[i].list.data = this.items[i].list.data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            return compareString(a[sort.active]+'', b[sort.active]+'', isAsc);
        });
    }
    displayWith(opt){
        console.log(opt.name)
        return opt ? opt.name : '';
    }
    showWith(optid, key){
        if(key == 'status'){
            let r = this.status.find(e=>e.id == optid);
            if(r){
                return r.name;
            }
        }
        return '';
    }
    finishExpired(){

    }
    openRepo(item){
        this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CDDlg, button: '', component: CRepoOpen, returnto: this, item: item, title: '解决方案 ID:'+item._id, info: '删除后不能恢复，确定删除？',  } })
    }
    async rmRepo(item){
        let res = await this.user.rmSoln([item._id]);
        let info = `更新${JSON.stringify(res)}`;
        this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        this.items[0].list.data = this.items[0].list.data.filter(e=>e._id !=item._id);
        this.items[0].list = new MatTableDataSource(this.items[0].list.data)
        this.cdr.detectChanges();
    }
    load(){

    }
    add(){
        let id = uuid();
        let userid = localStorage.getItem('logined1');
        this.items[0].list.data.push({_id:id, id:id, userid:userid, solution:'', content:'',  flag: 'hidden', datatime: new Date()});
        this.items[0].list = new MatTableDataSource(this.items[0].list.data)
        this.cdr.detectChanges();
    }
    async finishRepo(){
        let res = await this.user.saveSolns(this.items[0].list.data.map(e=>{
            return {_id:e._id, id:e._id, userid:e.userid, solution:e.solution, content:e.content, planid:e.planid, planname:e.planname, tags:e.tags, flag:!e.flag ? 'hidden': e.flag, attachments:e.attachments, datatime:e.datatime ? e.datatime: new Date()};
        }));
        let info = `更新${JSON.stringify(res)}`;
        this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
    }
    public onComplete( result : IUploaderResult[] ){
        if( !result || result.length < 1){
            return;
        }
        let userid = localStorage.getItem('logined1');
        /* let list = (result[0]._base64imgs[0].replace(/.+?base64,/g, '')).split('\n');
        for(let i = 0; i < list.length; i ++){
            let id = uuid();
            let data = list[i].split(',');
            this.items[0].list.data.push({_id:id, id:id, userid:userid, solution:data[0], content:data[1],  flag: 'hidden', datatime: new Date()});
        } 
        this.items[0].list = new MatTableDataSource(this.items[0].list.data)*/
        let workbook = XLSX.read((result[0]._base64imgs), {type:"binary"})
        let list = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1, raw:true});
        for(let i = 1; i < list.length; i ++){
            let id = uuid();
            let data = list[i];
            this.items[0].list.data.push({_id:id, id:id, userid:userid, solution:data[0], content:data[1],  flag: 'show', datatime: new Date()});
        } 
        this.items[0].list = new MatTableDataSource(this.items[0].list.data)
        this.cdr.detectChanges();
    }
}

function compareNumber(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function compareString(a: string, b: string, isAsc: boolean) {
    return a.localeCompare(b, 'zh-CN') * (isAsc ? 1 : -1);
}