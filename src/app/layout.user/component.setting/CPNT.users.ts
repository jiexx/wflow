import { ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewChildren, QueryList, AfterViewInit, Injector, ReflectiveInjector } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BusService, Bus } from 'app/common/bus/bus';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CInfo } from 'app/common/dialog/CPNT.info';
import { v4 as uuid } from 'uuid';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import {merge, Observable, of as observableOf, from} from 'rxjs';
import { FormControl } from '@angular/forms';
import { UserService } from 'app/common/data/user';
import { __colName } from 'app/common/workflow';
import { IColumn } from 'app/common/table/CPNT.table';
import { CTree, BASE } from '../component.wflow/CPNT.tree';
import { DData } from 'app/common/dialog/CPNT.ddlg';

@Component({
    templateUrl: './CPNT.users.html',
    styleUrls: ['./CPNT.users.css'],
})
export class CUsers extends Bus implements AfterViewInit {
    ngAfterViewInit(): void { //{key: 'id', val: '编号'}, {key: 'name', val: '名称', input:'txt'}
        this.columns = [
            {
                position: 'name',
                title: '姓名',
                input: {
                    type: 'txt',
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?  '80%' : '20%'
                    }
                }
            },
            {
                position: 'label',
                title: '登录名',
                input: {
                    type: 'txt',
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
            {
                position: 'roles',
                title: '部门',
                select : {
                    options: this.roles,
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
            {
                position: 'email',
                title: '邮件',
                input: {
                    type: 'txt',
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
            {
                position: 'tel',
                title: '电话',
                input: {
                    type: 'txt',
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
            {
                position: 'status',
                title: '状态',
                select : {
                    options:[{id:1,name:'在职'},{id:8,name:'离职'}],
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
            {
                position: 'privileges',
                title: '权限',
                select : {
                    options:[{id:0,name:'普通'},{id:10,name:'统计查看'},{id:8,name:'后台配置'},{id:18,name:'超级管理'}],
                    appearance: 'outline'
                },
                style : (i,j)=>{
                    return {
                        'border-bottom-style':  'none',
                        'width': j > 0 ?   '80%' : '20%'
                    }
                }
            },
        ];
        // this.user.getUsers().then(users =>{
        //     this.users = users;
        // });
    }
    name(): string {
        return 'CUsers';
    }
    treer = CTree;
    columns: IColumn[]
    users;
    roles = [];
    inj: Injector;
    constructor(protected user: UserService, protected bus: BusService, private cdr:ChangeDetectorRef,public injector: Injector ) {
        super(bus);
        this.inj = ReflectiveInjector.resolveAndCreate([{ provide: DData, useValue: {appendix:this.users, component:'CUsers'} }], this.injector);
        this.user.getRoles().then(roles=>{
            this.roles = roles.filter(e=>parseInt(e._id)<BASE);
            this.columns.filter(e=>e.position=='roles').forEach(e=>e.select.options = this.roles)
        })
    }
    onSelect({data}): void {
        console.log(data);
        this.user.getUserMap([data.id]).then(users =>{
            this.users = Object.values(users);
        });
    }
    append(){
        this.user.getCount(__colName.USERS,{}).then(count =>{
            this.users = [{
                _id:(count+1)+'', id:(count+1)+'', name:'', label:'', email:'', tel:'', status:1, roles:this.roles[0]._id+'', privileges:0
            }]
        });
    }
    remove(){
        if(this.users && this.users.length == 1){
            let user = this.users[0];
            this.user.rmUser([user._id]).then(result=>{
                if(result.code == 'OK'){
                    this.inj = ReflectiveInjector.resolveAndCreate([{ provide: DData, useValue: {appendix:this.users, component:'CUsers'} }], this.injector);
                    this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: null, title: '提交', info: '更新成功' } })
                }
            })
        }
    }
    commit(){
        if(this.users && this.users.length == 1){
            let user = this.users[0]; 
            this.user.saveUsers([{_id:user._id, id:user._id, name:user.name, label:user.label, status:user.status, roles:user.roles, privileges:user.privileges}] as any).then(result=>{
                if(result.code == 'OK'){
                    this.inj = ReflectiveInjector.resolveAndCreate([{ provide: DData, useValue: {appendix:this.users, component:'CUsers'} }], this.injector);
                    this.bus.send('CDialog', <IDialogMessage>{ command: 'open', data: { CPNT: CInfo, button: 'yes', returnto: null, title: '提交', info: ('更新成功') } })
                }
            })
        }
    }
}