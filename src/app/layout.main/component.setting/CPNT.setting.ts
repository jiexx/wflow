import { ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { UserService } from 'app/common/data/user';
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

const tagValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
const planExpctrlValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(parseInt(control.value) < 0) {
        return {invalid: true, msg: '不能小于0'};
    }
}
const hostIPctrlValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
    if(!/^(?:(?:^|\.)(?:2(?:5[0-5]|[0-4]\d)|1?\d?\d)){4}$/.test(control.value)){
        return {invalid: true, msg: 'IP不正确'};
    }
}
const hostUsernamectrlValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
const hostPwdctrlValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}

@Component({
    templateUrl: './CPNT.setting.html',
    styleUrls: ['./CPNT.setting.css'],
})
export class CSetting extends Bus implements AfterViewInit {
    name(): string {
        return 'CSetting';
    }
    // colTitles: string[] = ['select', 'id', 'state', 'title', 'commitee', 'owner', 'datetime'];  
    
    items: Array<any> = [
    ];
    cols = this.items.map(e => e.descr.map(desc => desc.key));

    initialSelection = [];
    allowMultiSelect = true;
    selection = new SelectionModel<any>(this.allowMultiSelect, this.initialSelection);

    planid:string = '';
    plans;
    planExpctrl: FormControl[]= [];
    hostIPctrl = new FormControl('',[hostIPctrlValidator]);
    hostUsernamectrl = new FormControl('',[hostUsernamectrlValidator]);
    hostPwdctrl = new FormControl('',[hostPwdctrlValidator]);

    tag0ctrl = new FormControl('',[]);
    tag0input = new FormControl('',[tagValidator]);
    tag0id = null;
    tag0s = [];
    delTag0s = [];
    addTag0(){
        if(this.tag0input.valid){
            this.tag0s.push({id:uuid(), name:this.tag0input.value, childs:[]});
            this.user.saveTag0s(this.tag0s).then(res =>{
                this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: '一级标签'+res.code } })
            });
        }else {
            this.tag0input.markAllAsTouched();
        }
    }
    rmTag0(){
        if(this.tag0ctrl.value && this.tag0ctrl.value.childs.length > -1) {
            const index = this.tag0s.indexOf(this.tag0ctrl.value);
            if (index >= 0) {
                let tag = this.tag0s.splice(index, 1);
                this.delTag0s = [...this.delTag0s, ...tag];
                this.delTags = [...this.delTags, ...this.tag0ctrl.value.childs ];
                this.tag0ctrl.setValue(null)
            }
        }
    }
    displayWith0(opt){
        console.log(opt.name)
        return opt ? opt.name : '';
    }
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
    //tags = [];
    delTags = [];
    addTag(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
        if ((value || '').trim() && this.tag0ctrl.value && this.tag0ctrl.value.childs.length > -1) {
            this.tag0ctrl.value.childs.push({id:uuid(), name: value.trim() });
        }
        if (input) {
            input.value = '';
        }
    }
    rmTag(tag): void {
        if(this.tag0ctrl.value && this.tag0ctrl.value.childs.length > -1) {
            const index = this.tag0ctrl.value.childs.indexOf(tag);
            if (index >= 0) {
                let tag = this.tag0ctrl.value.childs.splice(index, 1);
                this.delTags.push(tag);
            }
        }
    }
    async finishTags() {
        let rm = this.delTags.length > 0 ? await this.user.rmTags(this.delTags.map(e => e.id)) : { data: { deletedCount: 0 } };
        //let r = await this.user.saveTags(this.tags.map(e => ({ _id: e._id || uuid(), name: e.name })));
        let rm0 = this.delTag0s.length > 0 ? await this.user.rmTag0s(this.delTag0s.map(e => e.id)) : { data: { deletedCount: 0 } };
        let r = await this.user.saveTags(this.tag0s.reduce((p,c)=>{p = [...p, ...c.childs]; return p}, []));
        let res = await this.user.saveTag0s(this.tag0s);
        let info = JSON.stringify(`更新${ r.code == 'OK' && res.code == 'OK'? 'OK': 'FAILED' }`);
        this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
    }

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
    // allRoles = [];
    rolesPaginator = null;
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
        this.user.getRoles().then(roles => {
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
    users = [];
    usersPaginator = null;
    status = [{id:1,name:'在职'},{id:8,name:'离职'}];
    privileges = [{id:0,name:'普通'},{id:10,name:'统计查看'},{id:8,name:'后台配置'},{id:18,name:'超级管理'}];
    usersInit(){
        let index = 1;
        this.items[index] = ({
            name: '用户管理', 
            finish: 'usersFinish',
            descr: [], 
            list: []
        });
        this.cdr.detectChanges();
        let item = this.items[index];
        this.usersPaginator =  this.paginators.toArray()[index];
        this.usersPaginator.page.pipe( 
            startWith({}), 
            switchMap(async () => {
                return await this.user.getUsers(this.usersPaginator.pageSize, this.usersPaginator.pageIndex*this.usersPaginator.pageSize)
            }),
            map(data => {
                return data;
            }),
            catchError(() => {
                return observableOf([]);
            })
        ).subscribe(data => {
            data = data.map(e=> {
                if(!e.email){
                    e['email'] = '';
                }
                if(!e.tel){
                    e['tel'] = '';
                }
                return e;
            });
            item.list = new MatTableDataSource(data);
            item.descr = [{key: 'id', val: '编号'}, {key: 'name', val: '姓名', input:'txt'},{key: 'password', val: '密码', input:'password'},
                {key: 'label', val: '用户名', input:'txt'}, {key: 'status', val: '状态', options:this.status},
                {key: 'roles', val: '角色', options:this.roles}, {key: 'email', val: '邮件', input:'txt'}, {key: 'tel', val: '电话', input:'number'},
                {key: 'privileges', val: '权限', options:this.privileges},
            ];
            this.cols = this.items.map(e => e.descr.map(desc => desc.key));
            this.cdr.detectChanges();
            item.list.sort = this.sorts.toArray()[index];
            item.list.paginator = this.paginators.toArray()[index];
            this.users = item.list.data;
        });
    }
    async usersFinish(){
        if(this.users.length > 0 && this.usersPaginator){
            let res = await this.user.saveUsers(this.users);
            let info = `更新${JSON.stringify(res)}`;
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        }
    }
    finish(func: string){
        if(this[func]){
            this[func]();
        }
    }

    async finishSync(){
        if(this.hostIPctrl.valid && this.hostUsernamectrl.valid && this.hostPwdctrl.valid){
            let res = await this.user.syncRoles({ip:this.hostIPctrl.value, username: this.hostUsernamectrl.value, password:this.hostPwdctrl.value});
            let info = `更新${JSON.stringify(res)}`;
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        }else {
            this.hostIPctrl.markAllAsTouched();
            this.hostUsernamectrl.markAllAsTouched();
            this.hostPwdctrl.markAllAsTouched();
        }
    }

    ngAfterViewInit() {
        //this.rolesInit();
        //this.usersInit();
        this.user.getTag0s().then(e=>{
            this.tag0s = e;
            //this.tags = this.tag0s.reduce((p,c)=>{p = [...p, ...c.childs]; return p}, []);
        })
        /* this.user.getTags().then(e=>{
            this.tags = e;
        }) */
        this.user.getModels().then(model=>{
            this.plans = model.map(e=>{
                if(!e.expired) {
                    e['expired'] = 3;
                }
                return e;
            });
            this.plans.forEach((e,i) => {
                this.planExpctrl[i] = new FormControl(e.expired,[planExpctrlValidator]);
                this.planExpctrl[i].valueChanges.subscribe(d=>{
                    e.expired = d;
                })
            });
            this.cdr.detectChanges();
        })
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
            // switch (sort.active) {
            //     case 'position': return compareNumber(a.position, b.position, isAsc);
            //     case 'name': return compareString(a.name, b.name, isAsc);
            //     case 'description': return compareString(a.description, b.description, isAsc);
            //     default: return 0;
            // }
        });
    }
    displayWith(opt){
        console.log(opt.name)
        return opt ? opt.name : '';
    }
    // filterOptions(event){
    //     this.roles = this.allRoles.filter(option => option.name.toLowerCase().includes(event.target.value.toLowerCase()));
    // }
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
    async finishExpired(){
        if(this.planExpctrl.every(e => e.valid)){
            let res = await this.user.saveScheduleExpiredTime( this.plans.map(e=>({_id:e._id,id:e.id,expired:e.expired})) );
            let r = this.user.restart();
            let info = `更新${JSON.stringify(res)}${JSON.stringify(r)}`;
            this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: this, title: '提交', info: info } })
        }else {
            this.planExpctrl.forEach(e => e.markAllAsTouched());
        }
    }
}

function compareNumber(a: number, b: number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

function compareString(a: string, b: string, isAsc: boolean) {
    return a.localeCompare(b, 'zh-CN') * (isAsc ? 1 : -1);
}