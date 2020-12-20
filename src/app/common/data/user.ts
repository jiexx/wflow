import { Router, NavigationEnd } from '@angular/router';
import { Data, IResult } from './data';
import { interval, Observable, Subject } from 'rxjs';
import { Injectable, OnInit, OnDestroy, NgModule, ChangeDetectorRef } from '@angular/core';
import { EDataPath, _url, _storageurl } from './path';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { IProductConf, IProduct, IUserWork } from 'app/intf/ITF.product';
import { IPlan, IContext, ISignal, IHandle, ICondition, Manager } from '../workflow/index';
import { PlannerModel, __colName, Role } from '../wflow';
import { Content } from '@angular/compiler/src/render3/r3_ast';

const conf : IPlan = {
    root: 't_anonymous',
    flows : [
        't_anonymous => gw_o_registered?',
        'gw_o_registered? => t_registering', 't_registering => t_verify', 
        'gw_o_registered? => t_registered', 
        't_verify => gw_o_done?', 'gw_o_done? => t_registering', 'gw_o_done? => t_registered', 
    ],
    t_anonymous : async (context: IContext, signal: ISignal) : Promise<ISignal> => {
        let { code } = await context.remote.sign({tk : signal.token});
        signal['code'] = code;
        return signal;
    },
    t_registering : async (context: IContext, signal: ISignal) : Promise<ISignal> => {
        signal['restored'] = signal.router.url;
        context.router.navigate(['/login/profile']);
        let result : IResult = await context.remote.postSync(EDataPath.REGISTER, signal.params);// with only mobile
        signal['code'] = result.code;
        return signal;
    },
    t_verify : async (context: IContext, signal: ISignal) : Promise<ISignal> => { // with mobile, code
        return new Promise(async (resolve, reject) => {
            if(!signal['timeout']){
                signal['timeout'] = interval(120000);
                signal['timeout'].subscribe(() => {
                    signal['timeout'] = true;
                    resolve(signal);
                })
            }
            let result : IResult = await context.remote.postSync(EDataPath.REGISTER, signal.params);
            signal['code'] = result.code;
            resolve(signal)
        })
    },
    t_registered : async (context: IContext, signal: ISignal) : Promise<ISignal> => {
        return signal;
    },
    'gw_o_registered?' : {
        'gw_o_registered? => t_registered' : (context: IContext, signal: ISignal) : boolean => {
            return signal.code == 'OK';
        },
        'gw_o_registered? => t_registering' : (context: IContext, signal: ISignal) : boolean => {
            return signal.code != 'OK';
        },
        
    },
    'gw_o_done?' : {
        'gw_o_regdone? => t_registered' : (context: IContext, signal: ISignal) : boolean => {
            return signal.code == 'OK';
        },
        'gw_o_regdone? => t_registering' : (context: IContext, signal: ISignal) : boolean => {
            return signal.code != 'OK' || signal.timeout == true;;
        },
    },
}

@Injectable()
export class UserService {

    constructor(public router : Router, public http: HttpClient){
        this.data = new Data(http);
        this.init();
        if(!localStorage.getItem('logined1')){
            this.router.navigate(['/user/login'])
        }
    }
    async init(){
        this.plan = new Manager({router:this.router, remote:this.data.remote, storage:this.data.storage});
        this.plan.build(conf, 'register')
        this.schedid = await this.plan.start('register', '0');
    }
    subtotal : {I:number, V:number, R:number, C:number, X:number}
    data : Data;
    plan : Manager;
    schedid : string; 

    async next(params : {[key : string] : string}): Promise<void> {
        await this.plan.move(this.schedid, params);
        console.log(this.plan.curr(this.schedid));
    }

    async getProfile(): Promise<IResult> {
        let profile = this.data.storage.get('save', 'profile');
        if(profile){
            return {code: 'OK', data: this.data.storage.get('save', 'profile')};
        }else {
            let result = await this.data.remote.postSync(EDataPath.PROFILE, {});
            if(result && result.code == 'OK'){
                this.data.storage.save('profile', result.data);
            }
            return result;
        }
    }

    async getProdConf(): Promise<IProductConf[]> {
        let result = await this.data.remote.postSync(EDataPath.GETPRODCONF, {});
        if(result && result.code == 'OK'){
            return result.data as IProductConf[]
        }
        return [];
    }

    async getProducts(): Promise<IUserWork> {
        let result = await this.data.remote.postSync(EDataPath.GETPRODUCTS, {});
        if(result && result.code == 'OK'){
            return result.data as IUserWork
        }
    }

    async getOrders(): Promise<IUserOrder> {
        let result = await this.data.remote.postSync(EDataPath.GETPRODUCTS, {});
        if(result && result.code == 'OK'){
            return result.data as IUserOrder
        }
    }
    async getModels(): Promise<{id: string, name: string, expired: number}[]> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {data: {actived:true}, project:{id:1, name:1, expired:1}, method:'qry', col:__colName.MODELS});
        if(result && result.code == 'ERR'){
            console.log('save workflow error.')
        }
        return result.data as any;
    }
    async storeModel(models: PlannerModel[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {data:models, method:'mod', col:__colName.MODELS});
        if(result && result.code == 'ERR'){
            console.log('save workflow error.')
        }
        return result;
    }
    async restoreModel(): Promise<
        { 
            id: string, name: string, actived: boolean,
            root: { id: string, role: { id: string, name: string } }, 
            xml: string 
        }[]
    > {
        let result = await this.data.remote.postSync(EDataPath.QUERY, {method:'qry', col:__colName.MODELS});
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return [];
    }
    
    async rmWorkflow(wf: {id:string}): Promise<IResult> {
        let result = await this.data.remote.postSync(EDataPath.RMWORKFLOW, wf);
        return result;
    }

    async geRoles(limit:number = null, skip:number = null): Promise<{id:string,name:string}[]> {
        let result = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ROLES, method:'qry', limit:limit, skip:skip});
        if(result && result.code == 'OK'){
            return result.data as Promise<{id: string, name: string}[]>;
        }
        return [];
    }
    async getTag0s(): Promise<{_id:string, name:string}[]> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.TAG0S, method:'qry', limit:null, skip:null});
        if(result && result.code == 'OK'){
            return result.data as Promise<{_id: string, name: string}[]>;
        }
        return [];
    }
    async saveTag0s(tags: {_id?:string, name:string}[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.TAG0S, method:'mod', data:tags});
        if(result && result.code == 'ERR'){
            console.log('save tags error.')
        }
        return result;
    }
    async rmTag0s(tagIds:string[]): Promise<IResult> {
        let result = await this.data.remote.postSync(EDataPath.QUERY,  {col:__colName.TAG0S, method:'rm', id:tagIds});
        return result;
    }
    async getTags(): Promise<{_id:string, name:string}[]> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.TAGS, method:'qry', limit:null, skip:null});
        if(result && result.code == 'OK'){
            return result.data as Promise<{_id: string, name: string}[]>;
        }
        return [];
    }
    async saveTags(tags: {_id?:string, name:string}[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.TAGS, method:'mod', data:tags});
        if(result && result.code == 'ERR'){
            console.log('save tags error.')
        }
        return result;
    }
    async rmTags(tagIds:string[]): Promise<IResult> {
        let result = await this.data.remote.postSync(EDataPath.QUERY,  {col:__colName.TAGS, method:'rm', id:tagIds});
        return result;
    }
    async getCount(colname:string, query: any): Promise<number> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:colname, method:'cnt', data: query, project:{_id:1}});
        if(result && result.code == 'OK'){
            return result.data as Promise<number>;
        }
        return 0;
    }
    myId(){
        return localStorage.getItem('logined1');
    }
    async getUsers(limit:number = null, skip:number = null, roleid:string = null, query = null): Promise<{_id:string, id:string, name:string, label:string, status:string, roles:string}[]> {
        let data = roleid ? {status:1, roles: roleid} : {status:1}
        if(query){
            data = roleid ? {...{roles: roleid}, ...query} : query;
        }
        data = {...data, ...{status:1}};
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'qry', data: data, limit:limit, skip:skip});
        if(result && result.code == 'OK'){
            return result.data as Promise<{_id:string, id:string, name:string, label:string, status:string, roles:string}[]>;
        }
        return [];
    }
    async saveUsers(users: {_id:string, id:string, name:string, label:string, status:string, roles:string}[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'mod', data: users});
        if(result && result.code == 'ERR'){
            console.log('save users error.')
        }
        return result;
    }
    async getUser(userIds:string[] = null): Promise<{_id:string, id:string, name:string, label:string, avatar:string, email:string, tel:string, status:string, roles:string}> {
        let userid = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'qry', data: userIds ? {_id: {$in : userIds}} : {_id:userid}});
        let avatar =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.AVATARS, method:'qry', data: userIds ? {_id: {$in : userIds}} : {_id:userid}});
        if(result && result.code == 'OK'){
            if(!userIds){
                return {...result.data[0], ...{avatar:avatar && avatar.data && avatar.data[0] ? avatar.data[0].avatar: null}} as any
            }else if(avatar && avatar.code == 'OK' && avatar.data){
                return result.data.map(e=>{
                    let r = avatar.data.find(a=>a.id==e.id);
                    if(r){
                        e['avatar'] = r.avatar;
                    }
                    return e;
                });
            }
        }
        return null;
    }
    async getUserMap(userIds:string[] = null): Promise<{[userid:string]:{_id:string, id:string, name:string, label:string, avatar:string, email:string, tel:string, status:string, roles:string, rolex: {id:string, name:string}[]}}> {
        let userid = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'qry', data: userIds ? {_id: {$in : userIds}} : {_id:userid}});
        let avatar =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.AVATARS, method:'qry', data: userIds ? {_id: {$in : userIds}} : {_id:userid}});
        let res = {};
        if(result && result.code == 'OK'){
            if(!userIds && result.data[0]){
                let user = result.data[0];
                let roles = null;
                if(user.roles){
                    let rs =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ROLES, method:'qry', data:{_id: {$in: user.role.split(',') }}, limit:null, skip:null});
                    if(rs && rs.code == 'OK'){
                        roles = rs.data;
                    }
                }
                res[user.id] = {...user, ...{avatar:avatar && avatar.data && avatar.data[0] ? avatar.data[0].avatar: null}, ...{rolex: roles }} as any
                return res;
            }else if(avatar && avatar.code == 'OK' && avatar.data){
                let user = result.data;
                let roleids = user.reduce((p,c)=>[...p, ...(c.roles ? c.roles.split(',') :[])], []) as any;
                roleids = roleids.filter((e,i)=>roleids.indexOf(e) == i);
                let roles = null;
                if(roleids && roleids.length > 0){
                    let rs =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ROLES, method:'qry', data:{_id: {$in: roleids }}, limit:null, skip:null});
                    if(rs && rs.code == 'OK'){
                        roles = rs.data;
                    }
                }
                res = result.data.reduce((p,e)=>{
                    let r = avatar.data.find(a=>a.id==e.id);
                    if(r){
                        e['avatar'] = r.avatar;
                    }
                    if(roles){
                        let roleids = e.roles ? e.roles.split(',') : [];
                        if(roleids.length > 0){
                            e['rolex'] = roleids.map(e=>roles.find(a=>a.id==e));
                        }
                    }
                    p[e.id] = e;
                    return p;
                }, res);
            }
        }
        return res;
    }
    async saveUser(user: {_id:string, id:string, name:string, label :string, email:string, tel:string, avatar?:string, status ?:string, roles ?:string}): Promise<IResult> {
        let u = {_id:user._id, id:user.id, name:user.name, label :user.label, email:user.email, tel:user.tel}
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'mod', data: [u]});
        if(user.avatar) {
            let res = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.AVATARS, method:'mod', data: [{_id:user._id, id:user.id, avatar:user.avatar}]});
            if(res && res.code == 'ERR'){
                console.log('save users error.')
            }
        }
        if(result && result.code == 'ERR'){
            console.log('save users error.')
        }
        return result;
    }
    async rmUser(userid:string[]): Promise<IResult> {
        let result = await this.data.remote.postSync(EDataPath.QUERY,  {col:__colName.USERS, method:'rm', id:userid});
        return result;
    }
    async upload(files: {filename:string, base64:string}[]): Promise<{a: string, url:string, filename:string}[]> {
        let id = localStorage.getItem('logined1');
        let result = await this.data.remote.postSync(EDataPath.UPLOAD, {data: files, userid:id});
        if(result && result.code == 'OK') {
            return (result.data as {id:string, filename:string}[]).map(e=>({a:id+'/'+e.id+'/'+e.filename,  url:_storageurl(id+'/'+e.id+'/'+e.filename), filename:e.filename}));
        }
        return [];
    }
    async getRoles(data = null): Promise<{_id:string, id:string, name:string}[]> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ROLES, method:'qry', data: data, limit:null, skip:null});
        if(result && result.code == 'OK'){
            return result.data as Promise<{_id:string, id:string, name:string}[]>;
        }
        return [];
    }
    async saveRoles(roles: {_id:string, id:string, name:string}[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ROLES, method:'mod', data: roles});
        if(result && result.code == 'ERR'){
            console.log('save roles error.')
        }
        return result;
    }
    async geTops(limit:number=5, skip:number=0): Promise<{_id:string, id:string, userid:string, solution:string, content:string, planid:string, planname:string, tags:any[], flag:string, attachments?:string[]}[]> {
        let result = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'qry', data: {flag:{$in:['top']}}, limit:limit, skip:skip});
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return [];
    }
    async getSolns(limit:number = null, skip:number = null): Promise<{_id:string, id:string, userid:string, solution:string, content:string, planid:string, planname:string, tags:any[], flag:string, attachments?:string[]}[]> {
        let id = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.GETSCHEDPAGE, {state:['all'], filterState:'C', limit:limit, skip:skip});
        //let res = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'qry', data: {}});
        if(result && result.code == 'OK' && result.data.page){
            let data;
            data = Object.values(result.data.page).map((e: any) => ({...e[e.length-1],...{content:e.map(c=>c.solution).join('<br>')}}));
            //data = data.map(e=>({...e, ...{flag:res.data.find(f=>f._id==e._id) && res.data.find(f=>f._id==e._id).flag}}));
            //data = [...res.data.filter(e=> !data.find(d=>d._id == e.id)), ...data]
            return data as any;
        }
        return null;
    }
    async getArtics(limit:number = null, skip:number = null): Promise<{_id:string, id:string, userid:string, solution:string, content:string, planid:string, planname:string, tags:any[], flag:string, attachments?:string[]}[]> {
        let res = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'qry', data: {}, limit:limit, skip:skip});
        if( res && res.code == 'OK'){
            let data: any = res.data;
            data = [...res.data.filter(e=> !data.find(d=>d._id == e.id)), ...data]
            return data as any;
        }
        return null;
    }
    async rmSoln(solnids: string[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'rm', id:solnids});
        if(result && result.code == 'ERR'){
            console.log('save roles error.')
        }
        result = await this.data.remote.postSync(EDataPath.LOAD, {});
        return result;
    }
    async saveSolns(solns: {_id:string, id:string, userid:string, solution:string, content:string, planid:string, planname:string, tags:any[], flag:string, attachments?:string[]}[]): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'mod', data: solns});
        if(result && result.code == 'ERR'){
            console.log('save roles error.')
        }
        result = await this.data.remote.postSync(EDataPath.LOAD, {});
        return result;
    }
    async download(url){
        let result =  await this.data.remote.getSync(url, {responseType: 'text', headers:new HttpHeaders()});
        return result;
    }
    async check(user: {_id?:string, label?:string}) : Promise<{id:string, label:string, email:string, tel:string}> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.USERS, method:'qry', data: user});
        if(result && result.code == 'OK' && result.data.length > 0){
            return result.data[0]  as Promise<{id:string, label:string, email:string, tel:string}>;
        }
        return null;
    }
    async start(data: {userid:string, solution:string, planid:string, tags:any[], attachments?:string[]}){
        let result =  await this.data.remote.postSync(EDataPath.USERSTART, data);
        if(result && result.code == 'ERR'){
            console.log('start error.')
        }
        return result;
    }
    async move(data: {solution:string, schedid:string, action:string}){
        data['userid'] = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.USERMOVE, data);
        if(result && result.code == 'ERR'){
            console.log('start error.')
        }
        return result;
    }
    async startSchedule(data: {userid:string, solution:string, planid:string, tags:any[], attachments?:string[]}){
        let result =  await this.data.remote.postSync(EDataPath.STARTSCHED, data);
        if(result && result.code == 'ERR'){
            console.log('start error.')
        }
        return result;
    }
    async stopSchedule(data: {schedid:string}){
        data['userid'] = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.STOPSCHED, data);
        if(result && result.code == 'ERR'){
            console.log('start error.')
        }
        return result;
    }
    async moveSchedule(data: {solution:string, schedid:string, action:string, rating?: number, reject?: boolean, forward?: Role}){
        data['userid'] = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.MOVESCHED, data);
        if(result && result.code == 'ERR'){
            console.log('start error.')
        }
        return result;
    }

    async saveScheduleExpiredTime(data: {id: string, expired: number}[]):Promise<IResult>{
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {data:data, method:'mod', col:__colName.MODELS});
        if(result && result.code == 'ERR'){
            console.log('save expired error.')
        }
        return result;
    }

    async syncRoles(data?: {ip: string, username: string, password: string}):Promise<IResult>{
        let result =  await this.data.remote.postSync(EDataPath.SYNCROLES, data);
        if(result && result.code == 'ERR'){
            console.log('sync roles error.')
        }
        return result;
    }
    async getSchedule(schedid: string): Promise<{[schedid:string]:{_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, expired: string, datatime: any}[]}> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.SOLUTIONS, method:'qry', data:{schedid:schedid}});
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return null;
    }
    ensuffix(a, b){
        return '<span style="display:none" id="ensuffix">'+btoa(a+'&&'+b)+'</span>';
    }
    desuffix(str){
        let res = str.match(/<span style="display:none" id="ensuffix">([^<]*)<\/span>/);
        if(res && res.length > 1){
            return atob(res[1]).split('&&');
        }
        return null;
    }
    isExpired(datatime, expired){
        let e = expired>=0 ? parseInt(expired) : 2;
        let start = new Date(datatime);
        let end = new Date();
        let diff = (end.getTime() - start.getTime());
        return diff > e * (24*60*60*1000);
    }
    timer(period) {
        return interval(period);
    }
    async getSchedules(state: 'cim' | 'oim' | 'uim' | 'all'): Promise<{[schedid:string]:{_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, reject:boolean, rating: number, expired: string,  datatime: any}[]}> {
        let id = localStorage.getItem('logined1');
        let result =  await this.data.remote.postSync(EDataPath.GETSCHED, {ownerid:id, state:state});
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return null;
    }
    async getSchedulePage(data:{data?:any, state?: ('cim' | 'oim' | 'uim' | 'all') [], filterState?:'I'|'V'|'E'|'C'|'X'|'A', limit?: number, skip?: number, counter?:boolean, subtotal?:boolean,fitlerCompleted?:boolean , stats?:boolean, sort?:any})
        : Promise<{page:{[schedid:string]:{_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, reject:boolean, rating: number, expired: string,  datatime: any}[]}}> 
    {
        let id = localStorage.getItem('logined1');
        data['ownerid'] = id;
        let result =  await this.data.remote.postSync(EDataPath.GETSCHEDPAGE, data);
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return null;
    }
    private counter = null;
    setCounter(a){
        this.counter = a
    }
    getCounter(){
        return Observable.create(observer => { 
            //if(!this.counter){
                this.getSchedulePage({subtotal:true,state:['cim','uim','oim']}).then((data:any)=>{ //data: {count:{total:total, subtotal:subtotal}, page:output}
                    if(data && data.count && data.count.subtotal){
                        this.setCounter(data.count);
                        observer.next(this.counter);
                    }
                })
            // }else{
            //     observer.next(this.counter);
            // }
        });
    }
    async getSolutions(d:any, p:any): Promise<{_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, reject:boolean, rating: number,  datatime: any}[]> {
        let result =  await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.SOLUTIONS, method:'qry', data:d, project:p});
        if(result && result.code == 'OK'){
            return result.data as any;
        }
        return null;
    }
    async restart(): Promise<IResult> {
        let result =  await this.data.remote.postSync(EDataPath.RESTART, {});
        if(result && result.code == 'OK'){
            return result as any;
        }
        return null;
    }
    async geResult(limit:number = null, skip:number = null, data?:{_id?:string}, sort?:{[key:string]:number}, kw?:string): Promise<{id:string, solution: string, tags:  {id:string, name:string}[], datatime: any}[]> {
        let result = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.ARTICLES, method:'qry', data:{_id:data._id}, limit:limit, skip:skip, sort:sort });
        if(result && result.code == 'OK'){
            return result.data as Promise<{_id: string, id: string, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], action: string, planid: string, ownerid: string, curr: [], datatime: any, Content:string}[]>;
        }
        return [];
    }
    search = {kw:'', result: [], count: 0};
    async geResults(limit:number = null, skip:number = null, data?:{_id?:string}, sort?:{[key:string]:number}, kw?:string): Promise<{id:string, solution: string, tags:  {id:string, name:string}[], datatime: any}[]> {
        // let result = await this.data.remote.postSync(EDataPath.QUERY, {col:__colName.SOLUTIONS, method:'qry', data:data, limit:limit, skip:skip, sort:sort });
        // if(result && result.code == 'OK'){
        //     return result.data as Promise<{_id: string, id: string, schedid:string, userid: string, solution: string, attachments: string, tags: {id:string, name:string}[], action: string, planid: string, ownerid: string, curr: [], datatime: any}[]>;
        // }
        // return [];
        /* if(this.search.kw == kw && this.search.result) {
            if(sort){
                return this.search.result.filter((_,i)=>i>=skip && i<limit+skip).sort((a,b)=>new Date(b.datatime)>new Date(a.datatime)? sort.datatime : sort.datatime*-1);
            }
            else{
                return this.search.result.filter((_,i)=>i>=skip && i<limit+skip);
            }
        }else  */{
            let result = await this.data.remote.postSync(EDataPath.SEARCH, {keyword:kw || '', limit:limit, skip:skip, sort:sort.datatime});
            this.search.kw = kw;
            /* if(result && result.code == 'OK'){
                this.search.result = result.data.map(e=>({datatime:e.datatime, tags:e.tags ? e.tags.map(e=>e.name) : [], solution:e.solution, content:e.content, id: e.id}))
                if(sort){
                    return this.search.result.filter((_,i)=>i>=skip && i<limit+skip).sort((a,b)=>new Date(b.datatime)>new Date(a.datatime)? 1 : -1);
                }
                else{
                    return this.search.result.filter((_,i)=>i>=skip && i<limit+skip);
                }
            } */
            if(result && result.code == 'OK'){
                this.search.result = result.data as any;
                this.search.count = result['count'];
                return this.search.result
            }
            return [];
        }
    }
    
}


@NgModule({
    imports: [
        HttpClientModule
    ],
    providers: [
        UserService
    ],
    
    
})
export class UserModule { }