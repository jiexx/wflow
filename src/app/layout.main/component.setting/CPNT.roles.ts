import { ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
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
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}

@Component({
    templateUrl: './CPNT.roles.html',
    styleUrls: ['./CPNT.roles.css'],
})
export class CRoles extends Bus implements AfterViewInit {
    name(): string {
        return 'CUsers';
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
    roles = [];
    rolesPaginator = null;
    status = [{id:1,name:'在职'},{id:8,name:'离职'}];
    privileges = [{id:0,name:'普通'},{id:10,name:'统计查看'},{id:8,name:'后台配置'},{id:18,name:'超级管理'}];
    rolesInit(){
        let index = 0;
        this.items[index] = ({
            name: '角色管理', 
            finish: 'rolesFinish',
            descr: [], 
            list: []
        });
        this.cdr.detectChanges();
        let item = this.items[index];
        this.rolesPaginator =  this.paginators.toArray()[index];
        this.user.getRoles({$where:"parseInt(this._id)<=1000000"}).then(roles => {
            item.list = new MatTableDataSource(roles);
            item.descr = [{key: 'id', val: '编号'}, {key: 'name', val: '名称', input:'txt'}];
            this.cols = this.items.map(e => e.descr.map(desc => desc.key));
            this.cdr.detectChanges();
            item.list.sort = this.sorts.toArray()[index];
            item.list.paginator = this.paginators.toArray()[index];
            this.roles = item.list.data;
            // this.allRoles = item.list.data;
        });
    }
    async rolesFinish(){
        if(this.roles.length > 0 && this.rolesPaginator){
            let r = this.roles.filter((e,i)=>i >= this.rolesPaginator.pageIndex*this.rolesPaginator.pageSize && i < this.rolesPaginator.pageIndex*this.rolesPaginator.pageSize+this.rolesPaginator.pageSize)
            let res = await this.user.saveRoles(r);
            let info = `更新${JSON.stringify(res)}`;
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        }
    }

    ngAfterViewInit() {
        this.user.getRoles({$where:"parseInt(this._id)<=1000000"}).then(roles => {
            this.roles = roles;
            this.rolesInit();
        });
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
        if(key=='roles' && this.roles){
            let r = this.roles.find(e=>e.id == optid);
            if(r){
                return r.name;
            }
        }else if(key == 'status'){
            let r = this.status.find(e=>e.id == optid);
            if(r){
                return r.name;
            }
        }else if(key == 'privileges'){
            let r = this.privileges.find(e=>e.id == optid);
            if(r){
                return r.name;
            }
        }
        return '';
    }
    finishExpired(){

    }
    openRepo(item){
        //this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CDDlg, button: '', component: CRepoOpen, returnto: this, item: item, title: '解决方案 ID:'+item._id, info: '删除后不能恢复，确定删除？',  } })
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
}

function compareNumber(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function compareString(a: string, b: string, isAsc: boolean) {
    return a.localeCompare(b, 'zh-CN') * (isAsc ? 1 : -1);
}