const express = require('express');
import * as bodyParser from 'body-parser';
import { v4 as uuid } from 'uuid';
import { resolve } from 'path';
// import { WorkflowManager, Action} from '../src/app/common/workflow/index';
import { Planner, __debug, __db, __dbName, __colName, arrayEqual, Role } from '../workflow';
import { EDataPath } from '../config';
import { Mysql, Mongodb } from './database';
//import * as lunrjs from 'lunr-chinese';
import { readFileSync, promises, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
const BASE = 10000000;
const app = express();
app.use('/', express.static(process.cwd()+'/dist', {
    setHeaders: function(res, path) {
        res.set("Access-Control-Allow-Origin", "*");
    }
}) );
if(!existsSync(process.cwd()+'/upload')) {
    mkdirSync(process.cwd()+'/upload', {recursive:true});
}
app.use('/storage', express.static(process.cwd()+'/upload', {
    setHeaders: function(res, path) {
        res.set("Access-Control-Allow-Origin", "*");
    }
}) );

app.use('*',(req, res)=>{
    res.sendFile(resolve(process.cwd()+'/dist/index.html')) 
})

app.listen(6600,  () => {
	console.log('server at：6600');
});

interface IResult {
    code : 'OK' | 'ERR' | 'OKWITHMORE';
    data ?: {[key : string] : any};
}
const server = express();
server.use(bodyParser.json({ limit: '50mb' })); // for parsing application/json
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
    if (req.method == 'OPTIONS') {
        res.send(200);
    }else {
        next();
    }
});


server.use(EDataPath.UPLOAD, async (req, res)=>{
    try{
        let q = {...req.body, ...req.params, ...req.query};
        __debug(`${EDataPath.UPLOAD} ${q.method}`);
        if (q.data && q.data.length > 0 && q.userid && q.data[0].filename && q.data[0].base64) {
            let d = new Date();
            let id = d.getFullYear()+'_'+d.getMonth()+'_'+d.getDay();
            if(!existsSync(process.cwd()+`/upload/${q.userid}/${id}`)) {
                mkdirSync(process.cwd()+`/upload/${q.userid}/${id}`, {recursive:true});
            }
            Promise.all(q.data.map(e=>promises.writeFile(`./upload/${q.userid}/${id}/${e.filename}`, e.base64.replace(/^data:.+?;base64,/,''), 'base64')))
            .then(r=>{
                res.json({code: 'OK', data: q.data.map(e=>({id:id, filename:e.filename}))});
            }).catch(e=>{
                __debug(`${EDataPath.UPLOAD} err at ${e.toString()} ${e.message}`);
                res.json({code: 'ERR', data: e});
            })
        }
    }catch(e){
        __debug(`${EDataPath.UPLOAD} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.SYNCROLES} err at exception ${new Date().toLocaleString()}`}});
    }
});
server.use(EDataPath.SYNCROLES, async (req, res)=>{
    try{
        let q = {...req.body, ...req.params, ...req.query};
        __debug(`${EDataPath.SYNCROLES} ${q.method}`);
        let users, roles;
        if (q.ip && q.username && q.password) {
            __db.configuration.mysql.host = q.ip;
            __db.configuration.mysql.user = q.username;
            __db.configuration.mysql.password = q.password;
            await __db.connect("mysql");
            users = await __db.find('', '', {}, {}, 'SELECT a.id as user_id, a.username as user_label, a.name as user_name, a.password, a.status as user_status, GROUP_CONCAT(  b.deptid) as department_id FROM yp.u_user a  left join yp.u_userdepartment b on a.id = b.userid  group by  a.id' );
            users = users.map(e=>({_id:e.user_id+'', id:e.user_id+'', name:e.user_name, label:e.user_label, status:e.user_status, roles:e.department_id}));
            //roles = await __db.find('yp', 'u_department', {}, {id: 1, name: 1, status: 1} );
            roles = await __db.find('', '', {}, {}, 'select a.id, concat(ifnull(a.name,""),if(b.name is null,"",concat("-",b.name)),if(c.name is null,"",concat("-",c.name))) as name FROM yp.u_department a left join yp.u_department b on a.parentid = b.id left join yp.u_department c on b.parentid = c.id' );
            roles = roles.map(e=>({_id:e.id+'', id:e.id+'', name:e.name}));
        }else {
            users = JSON.parse(readFileSync(resolve(process.cwd()+'/user.json'), 'utf8'));
            users = users.map(e=>({_id:e.user_id+'', id:e.user_id+'', name:e.user_name, label:e.user_label, status:e.user_status, roles:e.department_id}));
            roles = JSON.parse(readFileSync(resolve(process.cwd()+'/dept.json'), 'utf8'));
            roles = roles.map(e=>({_id:e.id+'', id:e.id+'', name:e.name}));
        }

        roles = [...roles, ...users.map(e=>({_id:(BASE+parseInt(e._id))+'',id:(BASE+parseInt(e._id))+'',name:e.name}))]

        await __db.connect("mongodb");
        let userRemovedCount = await __db.remove(__dbName.PLANS, __colName.USERS, {});
        let roleRemovedCount = await __db.remove(__dbName.PLANS, __colName.ROLES, {});
        let userInsertedCount = await __db.insert(__dbName.PLANS, __colName.USERS, users);
        let roleInsertedCount = await __db.insert(__dbName.PLANS, __colName.ROLES, roles);
        res.json({code: 'OK', data: {userCount: users.length, userRemovedCount: userRemovedCount, userInsertedIds: userInsertedCount, roleCount: roles.length, roleRemovedCount: roleRemovedCount, roleInsertedCount: roleInsertedCount}});
    }catch(e){
        __debug(`${EDataPath.SYNCROLES} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.SYNCROLES} err at exception ${new Date().toLocaleString()}`}});
    }
})

server.use(EDataPath.QUERY, async (req, res)=>{
    try{
        let q = {...req.body, ...req.params, ...req.query};
        __debug(`${EDataPath.QUERY} ${q.col} ${q.method}`);
        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.QUERY} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.QUERY} err at parameters`}});
        }else if(q && q.col) {
            await __db.connect("mongodb");
            if(q.method=='qry'){
                let objs = await __db.find(__dbName.PLANS, q.col, q.data? q.data: {}, q.project? q.project: {}, q.limit, q.skip, q.sort );
                res.json({code: 'OK', data: objs});
            }else if(q.method=='cnt'){
                let query = {};
                if(q.data){
                    query = dateConvert(q.data)
                }
                let objs = await __db.find(__dbName.PLANS, q.col, query, q.project? q.project: {}, null, null, null, true );
                res.json({code: 'OK', data: objs});
            }else if(q.method=='rm' && q.id.length > 0) {
                let deletedCount = await __db.remove(__dbName.PLANS, q.col, {_id :{$in: q.id}});
                res.json({code: 'OK', data: {deletedCount:deletedCount}});
            }else if(q.method=='add' && q.data.length > 0) {
                let insertedCount = await __db.insert(__dbName.PLANS, q.col, q.data);
                res.json({code: 'OK', data: {insertedCount:insertedCount}});
            }else if(q.method=='mod' && q.data.length > 0) {
                let modifiedCount = await __db.updates(__dbName.PLANS, q.col, q.data, {upsert:true});
                res.json({code: 'OK', data: {"nInserted":modifiedCount.nInserted,"nUpserted":modifiedCount.nUpserted,"nMatched":modifiedCount.nMatched,"nModified":modifiedCount.nModified,"nRemoved":modifiedCount.nRemoved}});
            }
        }
    }catch(e){
        __debug(`${EDataPath.QUERY} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.QUERY} err at exception ${new Date().toLocaleString()}`}});
    }
})

server.use(EDataPath.STARTSCHED, async (req, res)=>{
    try{
        __debug(`${EDataPath.STARTSCHED}`);
        let q = {...req.body, ...req.params, ...req.query};
        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.STARTSCHED} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.STARTSCHED} err at parameters`}});
        }else if(q && q.userid && q.solution && q.planid) {
            await __db.connect("mongodb");

            let sched = await __planner.createSchedule(q.planid, q.userid);

            __debug(`start schedule solution  ${JSON.stringify({schedid:sched.id, userid:q.userid, planid: sched.planid, curr: sched.curr})}`);
            let id = uuid();
            let solnInsertedCount = await __db.insert(__dbName.PLANS, __colName.SOLUTIONS, [{_id: id, id:id,
                schedid:sched.id,     userid:  q.userid, solution:q.solution, attachments:q.attachments, tags:q.tags, action:'', 
                planid: sched.planid, ownerid: q.userid, curr: sched.curr,datatime: new Date() }]);
            let action = __planner.getScheduleAction(sched.planid, sched.curr);
            if(action.length >= 1){
                let result = await __planner.moveSchedule(sched.id, {'action': action[0]});
                if(result['movedSchedCount'] < 1) {
                    __debug(`${EDataPath.MOVESCHED} moveSchedule`);
                    res.json({code: 'ERR', data:{msg: `${EDataPath.MOVESCHED} moveSchedule`}});
                    return;
                }
            }
            res.json({code: 'OK', data: {solnInsertedIds: solnInsertedCount, id: id}});
        }
    }catch(e){
        __debug(`${EDataPath.STARTSCHED} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.STARTSCHED} err at exception ${new Date().toLocaleString()}`}});
    }
});
server.use(EDataPath.STOPSCHED, async (req, res)=>{
    try{
        __debug(`${EDataPath.STOPSCHED}`);
        let q = {...req.body, ...req.params, ...req.query};
        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.STOPSCHED} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.STOPSCHED} err at parameters`}});
        }else if(q && q.userid && q.schedid) {
            let state = 'V';
            if(state){
                await __db.connect("mongodb");
                let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: q.schedid }, {planid:1, ownerid:1, curr:1, datatime:1} );
                if(soln.length) {
                    let id = uuid();
                    soln = soln.sort((a,b)=>a.datatime.getTime() - a.datatime.getTime());
                    let solnInsertedCount = await __db.insert(__dbName.PLANS, __colName.SOLUTIONS, [{_id: id, id: id,
                        schedid:q.schedid,       userid:  q.userid, solution:q.solution, attachments:q.attachments, action:q.action, rating:5, reject:q.reject, forward: q.forward, close:'force',
                        planid: soln[soln.length-1].planid, ownerid: soln[soln.length-1].ownerid, curr: soln[soln.length-1].curr, 
                        state: state, datatime: new Date() }]);
                    let result = await __planner.stopSchedule(q.schedid, {} );
                    if(result['movedSchedCount'] < 1) {
                        __debug(`${EDataPath.MOVESCHED} moveSchedule`);
                        res.json({code: 'ERR', data:{msg: `${EDataPath.MOVESCHED} moveSchedule`}});
                        return;
                    }
                    res.json({code: 'OK', data: {solnInsertedIds: solnInsertedCount}});
                }
                return;
            }
        }
    }catch(e){
        __debug(`${EDataPath.STOPSCHED} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.STOPSCHED} err at exception ${new Date().toLocaleString()}`}});
    }
});
const completedstate = {
    Verified: 'V',
    vSatisfied: 'SS',
    Satisfied: 'S',
    nSatisfied: 'D'
}
const completed = (action: any)=>{
    return {}.toString.call(action) == "[object String]" ? completedstate[action] : null;
}
export const accomplished = (state: any)=>{
    return {}.toString.call(state) == "[object String]" ? state == 'V' || state == 'SS' ||  state == 'S' || state == 'D' : false;
}
server.use(EDataPath.MOVESCHED, async (req, res)=>{
    try{
        __debug(`${EDataPath.MOVESCHED}`);
        let q = {...req.body, ...req.params, ...req.query};
        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.MOVESCHED} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.MOVESCHED} err at parameters`}});
        }else if(q && q.userid && q.schedid && q.solution && q.action) {
            let state = completed(q.action);
            if(state){
                await __db.connect("mongodb");
                let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: q.schedid }, {planid:1, ownerid:1, curr:1, datatime:1} );
                if(soln.length) {
                    let id = uuid();
                    soln = soln.sort((a,b)=>a.datatime.getTime() - a.datatime.getTime());
                    let solnInsertedCount = await __db.insert(__dbName.PLANS, __colName.SOLUTIONS, [{_id: id, id: id,
                        schedid:q.schedid,       userid:  q.userid, solution:q.solution, attachments:q.attachments, action:q.action, rating:q.rating, reject:q.reject, forward: q.forward,
                        planid: soln[soln.length-1].planid, ownerid: soln[soln.length-1].ownerid, curr: soln[soln.length-1].curr, 
                        state: state, datatime: new Date() }]);
                    res.json({code: 'OK', data: {solnInsertedIds: solnInsertedCount}});
                }
                return;
            }
            await __db.connect("mongodb");
            let result = await __planner.moveSchedule(q.schedid, {'action': q.action} );
            if(result['movedSchedCount'] < 1) {
                __debug(`${EDataPath.MOVESCHED} moveSchedule`);
                res.json({code: 'ERR', data:{msg: `${EDataPath.MOVESCHED} moveSchedule`}});
                return;
            }
            __debug(`move schedule solution  ${JSON.stringify({schedid:q.schedid, userid:q.userid})}`);
            let id = uuid();
            let solnInsertedCount = await __db.insert(__dbName.PLANS, __colName.SOLUTIONS, [{_id: id, id: id,
                schedid:q.schedid,       userid:  q.userid, solution:q.solution, attachments:q.attachments, action:q.action, reject:q.reject, forward: q.forward,
                planid: result.planid, ownerid: result.ownerid, curr: result.curr, datatime: new Date() }]);
            // await __db.ensureIndex(__dbName.PLANS, __colName.SOLUTIONS,  { id: 1, roleid: 1 }, { unique: true } )
            res.json({code: 'OK', data: {solnInsertedIds: solnInsertedCount}});
        }
    }catch(e){
        __debug(`${EDataPath.MOVESCHED} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.MOVESCHED} err at exception ${new Date().toLocaleString()}`}});
    }
})

const groupBy = (list: any [], by: string, campare: (item: any, subList: any[]) => boolean ) => {
    return list.reduce((result, item) => {
        let sublist = result[item[by]];
        if(sublist) {
            campare(item, sublist) ? sublist.unshift(item) :sublist.push(item)
        }else {
            result[item[by]] = [item];
        }
        return result;
    }, {});
}

const getExpired = (sched, schedid,) =>{
    if(sched){
        let r = sched.find(s=>s.id == schedid);
        if(r){
            let e = __planner.getModel(r.planid);
            return e ? e.expired : 2;
        }
    }
    return 2;
}
server.use(EDataPath.GETSCHED, async (req, res)=>{
    try{
        __debug(`${EDataPath.GETSCHED}`);
        let q = {...req.body, ...req.params, ...req.query};

        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.GETSCHED} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.GETSCHED} err at parameters`}});
        }else if(q && q.ownerid  && q.state=='cim') { // current is me
            await __db.connect("mongodb");
            let r = await __db.find(__dbName.PLANS, __colName.USERS, {_id: q.ownerid+''}, {roles: 1} );
            if(!r.length){
                __debug(`${EDataPath.GETSCHED} err at users`);
                res.json({code: 'ERR'});
                return;
            }
            let roles = r.reduce((p,e)=>{e.roles.join? p=[...p,...e.roles]: p.push(e.roles);return p}, []);
            roles.push((BASE+parseInt(q.ownerid))+'');
            let sched = await __planner.getScheduleByRole(roles)
            let sched2 = await __planner.getScheduleStart(q.ownerid);
            if(sched2.length > 0){
                sched = [...sched, ...sched2];
            }
            if(sched.length == 0) {
                res.json({code: 'OK', data: []});
                return;
            }
            let actions = sched.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
            let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: sched.map(e=>e.id), } }, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1, datatime:1} );
            if(soln.length) {
                let result = soln.map(e=>({...e, ...{actions:actions[e.schedid],expired:getExpired(sched, e.schedid),end:sched.find(s=>s.id == e.schedid) ? sched.find(s=>s.id == e.schedid).end : false}}));
                let accomplishments = result.filter(e=>accomplished(e.state)).map(e=>e.schedid);
                result = result.filter(e=>!accomplishments.includes(e.schedid))
                result = groupBy(result, 'schedid',  (item, sublist) => {
                    return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                });
                res.json({code: 'OK', data: result});
                return;
            }
        }else if(q && q.ownerid  && q.state=='oim') { // owner is me
            await __db.connect("mongodb");
            let sched = await __planner.getScheduleByOwner(q.ownerid)
            if(!sched.length) {
                res.json({code: 'OK', data: []});
                return;
            }
            let actions = sched.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
            let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: sched.map(e=>e.id), } }, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1,datatime:1} );
            if(soln.length) {
                let result = soln.map(e=>({...e, ...{actions:actions[e.schedid],expired: getExpired(sched, e.schedid),end:sched.find(s=>s.id == e.schedid) ? sched.find(s=>s.id == e.schedid).end : false}}));
                result = groupBy(result, 'schedid',  (item, sublist) => {
                    return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                });
                res.json({code: 'OK', data: result});
                return;
            }
        }else if(q && q.ownerid  && q.state=='uim') { // user is me
            await __db.connect("mongodb");
            let solns = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {userid: q.ownerid }, {planid:1, planame:1, ownerid:1, schedid:1, curr:1, userid:1} );
            if(!solns.length) {
                res.json({code: 'OK', data: []});
                return;
            }
            let sched = await __planner.getScheduleWithEndflag(solns.map(e=>e.schedid));
            if(!sched.length) {
                res.json({code: 'OK', data: []});
                return;
            }
            let actions = sched.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
            let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: sched.map(e=>e.id), } }, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1,rating:1,datatime:1} );
            if(soln.length) {
                let result = soln.map(e=>({...e, ...{actions:actions[e.schedid],expired:getExpired(sched, e.schedid),end:sched.find(s=>s.id == e.schedid) ? sched.find(s=>s.id == e.schedid).end : false}}));
                result = groupBy(result, 'schedid',  (item, sublist) => {
                    return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                });
                res.json({code: 'OK', data: result});
                return;
            }
        }else if(q && q.ownerid  && q.state=='all') { // 
            await __db.connect("mongodb");
            let solns = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {}, {planid:1, planame:1, ownerid:1, schedid:1, curr:1, userid:1},q.limit, q.skip );
            if(!solns.length) {
                res.json({code: 'OK', data: []});
                return;
            }
            let sched = await __planner.getScheduleWithEndflag(solns.map(e=>e.schedid));
            if(!sched.length) {
                res.json({code: 'OK', data: []});
                return;
            }
            let actions = sched.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
            let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: sched.map(e=>e.id), } }, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1,datatime:1} );
            if(soln.length) {
                let result = soln.map(e=>({...e, ...{actions:actions[e.schedid],expired:getExpired(sched, e.schedid),end:sched.find(s=>s.id == e.schedid) ? sched.find(s=>s.id == e.schedid).end : false}}));
                result = groupBy(result, 'schedid',  (item, sublist) => {
                    return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                });
                res.json({code: 'OK', data: result});
                return;
            }
        }
    }catch(e){
        __debug(`${EDataPath.GETSCHED} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.GETSCHED} err at exception ${new Date().toLocaleString()}`}});
    }
});
const isExpired = (datatime, expired)=>{
    let e = expired>=0 ? parseInt(expired) : 2;
    let start = new Date(datatime);
    let end = new Date();
    let diff = (end.getTime() - start.getTime());
    return diff > e * 86400000;
}
const needForwardFilter = (ownerid:string, solns: any[], forwardSchedFilters: any[])=>{
    if(forwardSchedFilters && forwardSchedFilters.length > 0 && solns && solns.length > 0 && solns[0].forward && solns[0].forward.id && forwardSchedFilters.find(e=>e._id == solns[0].schedid)) {
        return solns[0].forward ? parseInt(ownerid)+'' == solns[0].forward.id : false;
    }
    return true;
}
const filterState = (state: 'I'|'V'|'E'|'C'|'X'|'A', soln: any) => {// schedules: {end: boolean, id: string, ownerid: string, planid: string, planame: string, datatime: Date, expired: number, curr: string[]}[], ) =>{
    // if(state == 'I'){
    //     return {query: {schedid: {$in: schedules.filter(e=>!e.end).map(e=>e.id) }, }
    //     return schedules.filter(e=>!e.end);
    //     soln
    // }else if(state == 'V'){
    //     return schedules.filter(e=>e.end);
    // }else if(state == 'E'){
    // }else if(state == 'C'){
    // }else if(state == 'X'){
    // }else if(state == 'A'){
    // }

    // vals.forEach(e => {
    //     let exp = getExpired(merged, e[0].schedid);
    //     let t = merged.find(s=>s.id == e[0].schedid);
    //     let end = t ? t.end : false;
    //     let isExp = isExpired(e[0].datatime, exp)//isExpired(i.datatime, i.expired)
    //     e[0]['actions'] = actions[e[0].schedid]
    //     e[0]['isExpired'] = isExp;
    //     e[0]['end'] = end;
    // });
}
const dateConvert = (query)=>{
    if(query && query.datatime){
        let q = {datatime:{}};
        if(query.datatime.$gte){
            q.datatime['$gte'] = new Date(query.datatime.$gte);
        }
        if(query.datatime.$lte){
            q.datatime['$lte'] = new Date(query.datatime.$lte);
        }
        return q;
    }
    if(query && query.$and && query.$and.length > 0){
        let index = query.$and.findIndex(e=>e.datatime);
        if(index > -1){
            if(query.$and[index].datatime.$gte){
                query.$and[index].datatime.$gte = new Date(query.$and[index].datatime.$gte);
            }
            if(query.$and[index].datatime.$lte){
                query.$and[index].datatime.$lte = new Date(query.$and[index].datatime.$lte);
            }
        }
        return query;
    }
    return query;
}
server.use(EDataPath.GETSCHEDPAGE, async (req, res)=>{
    try{
        __debug(`${EDataPath.GETSCHEDPAGE}`);
        let q = {...req.body, ...req.params, ...req.query};
        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.GETSCHEDPAGE} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.GETSCHEDPAGE} err at parameters`}});
        }else {
            let merged = []; 
            let forwardSchedFilters = null;
            q.state = q.state ? q.state : [];
            if(q && q.ownerid  && q.state.includes('cim')) { // current is me
                await __db.connect("mongodb");
                let r = await __db.find(__dbName.PLANS, __colName.USERS, {_id: q.ownerid+''}, {roles: 1} );
                let roles = r.reduce((p,e)=>{e.roles.join? p=[...p,...e.roles]: p.push(e.roles);return p}, []);
                roles.push((BASE+parseInt(q.ownerid))+'');

                let sched = await __planner.getScheduleByRole(roles)
                let sched2 = await __planner.getScheduleStart(q.ownerid);
                if(sched2.length > 0){
                    sched = [...sched, ...sched2];
                }
                if(sched && sched.length > 0) {
                    merged = sched.reduce((p,c)=>{
                        if(merged.findIndex(o=>o.id == c.id)<0){
                            p.push(c);
                        }
                        return p;
                    }, merged);
                    forwardSchedFilters = sched;
                }
            }
            if(q && q.ownerid  && q.state.includes('oim')) { // owner is me
                await __db.connect("mongodb");
                let sched = await __planner.getScheduleByOwner(q.ownerid)
                if(sched && sched.length > 0) {
                    merged = sched.reduce((p,c)=>{
                        if(merged.findIndex(o=>o.id == c.id)<0){
                            p.push(c);
                        }
                        return p;
                    }, merged);
                }
            }
            if(q && q.ownerid  && q.state.includes('uim')) { // user is me
                await __db.connect("mongodb");
                let solns = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {userid: q.ownerid }, {planid:1, planame:1, ownerid:1, schedid:1, curr:1, userid:1} );
                let sched = await __planner.getScheduleWithEndflag(solns.map(e=>e.schedid));
                if(sched && sched.length > 0) {
                    merged = sched.reduce((p,c)=>{
                        if(merged.findIndex(o=>o.id == c.id)<0){
                            p.push(c);
                        }
                        return p;
                    }, merged);
                }
            }
            if(q && q.state.includes('all') && q.state.length == 1) { // 
                await __db.connect("mongodb");
                let query = [];
                if(merged.length){
                    query.push({schedid: {$in: merged.map(e=>e.id)}})
                }
                if(q.data){
                    query.push(dateConvert(q.data))
                }
                let qry =  query.length > 1 ? {$and: query}: query[0];
                let solns = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query.length == 0 ? {} : qry , {planid:1, planame:1, ownerid:1, schedid:1, curr:1, userid:1}/* ,q.limit, q.skip */ );
                let sched = await __planner.getScheduleWithEndflag(solns.map(e=>e.schedid));
                if(!sched.length) {
                    if(q.counter){
                        res.json({code: 'OK', data: {count:{total:0}, page:null}});
                    }else{
                        res.json({code: 'OK', data: []});
                    }
                    return;
                }
                merged = sched;
            }
            let output = null;
            //let objs = await __db.find(__dbName.PLANS, q.col, q.data? q.data: {}, q.project? q.project: {}, q.limit, q.skip, q.sort );
            if(q.limit && q.skip >=0){
                if(!q.filterState || q.filterState == 'A'){ //'I'|'V'|'E'|'C'|'X'|'A'
                    console.log(JSON.stringify(merged));
                    let actions = merged.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
                    let ars = merged.reduce((p,e) => { p[e.id] = __planner.getScheduleActionidRole(e.planid, e.curr); return p }, {});
                    let query =  q.data ? {$and:[{schedid: {$in: merged.map(e=>e.id)}},dateConvert(q.data) ]}: {schedid: {$in: merged.map(e=>e.id), }};
                    let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1, forward:1, close:1, datatime:1}, q.sort ? q.sort : null );
                    if(q.data){
                        query = {schedid: {$in: soln.map(e=>e.schedid) }};
                        soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1, forward:1, close:1, datatime:1}, q.sort ? q.sort : null );
                    }
                    if(soln.length) {
                        let result = soln;//.map(e=>({...e, ...{actions:actions[e.schedid],expired:getExpired(merged, e.schedid),end:merged.find(s=>s.id == e.schedid) ? merged.find(s=>s.id == e.schedid).end : false}}));
                        if(q.fitlerCompleted){
                            let accomplishments = result.filter(e=>accomplished(e.state)).map(e=>e.schedid);
                            result = result.filter(e=>!accomplishments.includes(e.schedid))
                        }
                        result = groupBy(result, 'schedid',  (item, sublist) => {
                            return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                        });
                        let vals = Object.values(result);
                        output = {};
                        if(!(q.state.includes('all') && q.state.length == 1) ) {
                            vals = vals.filter(e=> needForwardFilter(q.ownerid, e as any, forwardSchedFilters)) 
                        }
                        if(q.sort){
                            if(q.sort.datatime){
                                vals = vals.sort((a,b)=> q.sort.datatime*(a[0].datatime.getTime() - b[0].datatime.getTime()));
                            }else if(q.sort.updatetime){
                                vals = vals.sort((a:any,b:any)=> q.sort.updatetime*(a[a.length-1].datatime.getTime() - b[b.length-1].datatime.getTime()));
                            }
                        }
                        vals.forEach((e: any,i) => {
                            if(i >= q.skip && i < q.skip + q.limit){
                                let exp = getExpired(merged, e[0].schedid);
                                let t = merged.find(s=>s.id == e[0].schedid);
                                let end = t ? t.end : false;
                                let isExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, exp)//isExpired(i.datatime, i.expired)
                                let nodExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, t.expire || 1000)
                                e[0]['actions'] = actions[e[0].schedid]
                                e[0]['isExpired'] = isExp;
                                e[0]['expire'] = nodExp;
                                e[0]['privilege'] = t.privilege;
                                e[0]['end'] = end;
                                e[0]['roles'] = ars[e[0].schedid];
                                e[0]['schedRoles'] = __planner.getScheduleRoles(merged.filter(m=>m._id==e[0].schedid).map(e=>e.planid))/* .filter(e=>e.id != '0') */.map(e=> ({id:parseInt(e.id) > BASE ? (parseInt(e.id) - BASE)+'' : e.id, name: e.name, expire: e.expire}));
                                output[e[0].schedid] = e;
                            }
                        });
                    }
                }else{
                    let actions = merged.reduce((p,e) => { p[e.id] = __planner.getScheduleAction(e.planid, e.curr); return p }, {});
                    let ars = merged.reduce((p,e) => { p[e.id] = __planner.getScheduleActionidRole(e.planid, e.curr); return p }, {});
                    let query = q.data ? {$and:[{schedid: {$in: merged.map(e=>e.id)}},dateConvert(q.data) ]}: {schedid: {$in: merged.map(e=>e.id), }};
                    let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1, forward:1, close:1, datatime:1}, q.sort ? q.sort : null );
                    if(q.data){
                        query = {schedid: {$in: soln.map(e=>e.schedid) }};
                        soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query, {schedid:1, userid:1, ownerid:1, solution:1, attachments:1, action:1, tags:1, state:1, reject:1, rating:1, forward:1, close:1, datatime:1}, q.sort ? q.sort : null );
                    }
                    if(soln.length) {
                        let result = soln;//.map(e=>({...e, ...{actions:actions[e.schedid],expired:getExpired(merged, e.schedid),end:merged.find(s=>s.id == e.schedid) ? merged.find(s=>s.id == e.schedid).end : false}}));
                        if(q.fitlerCompleted){
                            let accomplishments = result.filter(e=>accomplished(e.state)).map(e=>e.schedid);
                            result = result.filter(e=>!accomplishments.includes(e.schedid))
                        }
                        result = groupBy(result, 'schedid',  (item, sublist) => {
                            return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                        });
                        let vals = Object.values(result) as any;
                        output = {};
                        if(!(q.state.includes('all') && q.state.length == 1) ) {
                            vals = vals.filter(e=> needForwardFilter(q.ownerid, e as any, forwardSchedFilters)) 
                        }
                        if(q.sort){
                            if(q.sort.datatime){
                                vals = vals.sort((a,b)=> q.sort.datatime*(a[0].datatime.getTime() - b[0].datatime.getTime()));
                            }else if(q.sort.updatetime){
                                vals = vals.sort((a:any,b:any)=> q.sort.updatetime*(a[a.length-1].datatime.getTime() - b[b.length-1].datatime.getTime()));
                            }
                        }
                        vals.filter(e=> needForwardFilter(q.ownerid, e as any, forwardSchedFilters)).filter((e,i) => {
                            //if(i >= q.skip && i < q.skip + q.limit){
                                let exp = getExpired(merged, e[0].schedid);
                                let t = merged.find(s=>s.id == e[0].schedid);
                                let end = t ? t.end : false;
                                let isExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, exp)//isExpired(i.datatime, i.expired)
                                let nodExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, t.expire || 1000)
                                e[0]['actions'] = actions[e[0].schedid];
                                e[0]['isExpired'] = isExp;
                                e[0]['expire'] = nodExp;
                                e[0]['privilege'] = t.privilege;
                                e[0]['end'] = end;
                                e[0]['roles'] = ars[e[0].schedid];
                                e[0]['schedRoles'] = __planner.getScheduleRoles(merged.filter(m=>m._id==e[0].schedid).map(e=>e.planid))/* .filter(e=>e.id != '0') */.map(e=> ({id:parseInt(e.id) > BASE ? (parseInt(e.id) - BASE)+'' : e.id, name: e.name, expire: e.expire}));
                                if(q.filterState == 'I' && !e[0].end){
                                    return true;
                                }else if(q.filterState == 'V' && e[0].end && e[0].state != 'V'){
                                    return true;
                                }else if(q.filterState == 'E' && e[0].reject){
                                    return true;
                                }else if(q.filterState == 'C' && e[0].end && accomplished(e[0].state)){
                                    return true;
                                }else if(q.filterState == 'X' && e[0]['isExpired']){
                                    return true;
                                }else if(q.filterState == 'O' && e[0]['expire']){
                                    output[e[0].schedid] = e;
                                }
                            //}
                        }).forEach((e,i) => {
                            if(i >= q.skip && i < q.skip + q.limit){
                                if(q.filterState == 'I' && !e[0].end){
                                    output[e[0].schedid] = e;
                                }else if(q.filterState == 'V' && e[0].end && e[0].state != 'V'){
                                    output[e[0].schedid] = e;
                                }else if(q.filterState == 'E' && e[0].reject){
                                    output[e[0].schedid] = e;
                                }else if(q.filterState == 'C' && e[0].end && accomplished(e[0].state)){
                                    output[e[0].schedid] = e;
                                }else if(q.filterState == 'X' && e[0]['isExpired']){
                                    output[e[0].schedid] = e;
                                }else if(q.filterState == 'O' && e[0]['expire']){
                                    output[e[0].schedid] = e;
                                }
                            }
                        });
                    }
                }
            }
            let total  = 0, subtotal = {I:0, V:0, R:0, C:0, X:0, O:0}, stats = {};
            if(q.counter){
                let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: merged.map(e=>e.id), } }, {schedid:1, forward:1} );
                if(soln.length) {
                    total = soln.filter((e,i)=>soln.findIndex(s=>s.schedid == e.schedid)==i).length;
                }
            }
            if(q.subtotal){
                let query =  q.data ? {$and:[{schedid: {$in: merged.map(e=>e.id)}},dateConvert(q.data) ]}: {schedid: {$in: merged.map(e=>e.id), }};
                let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, query, {schedid:1, state:1, reject:1, forward:1, datatime:1} );
                //let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: merged.map(e=>e.id), } }, {schedid:1, state:1, reject:1, forward:1, datatime:1});
                if(soln.length) {
                    let result = soln;
                    result = groupBy(result, 'schedid',  (item, sublist) => {
                        return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                    });
                    let vals = Object.values(result);
                    vals.filter(e=> needForwardFilter(q.ownerid, e as any, forwardSchedFilters)).forEach((e,i) => {
                        let exp = getExpired(merged, e[0].schedid);
                        let t = merged.find(s=>s.id == e[0].schedid);
                        let end = t ? t.end : false;
                        let isExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, exp)//isExpired(i.datatime, i.expired)
                        let nodExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, t.expire || 1000)
                        if(!end) {
                            subtotal.I ++;
                        }
                        if(end && e[0].state != 'V') {
                            subtotal.V ++;
                        }
                        if(e[0].reject) {
                            subtotal.R ++;
                        }
                        if(end && accomplished(e[0].state)) {
                            subtotal.C ++;
                        }
                        if(isExp) {
                            subtotal.X ++;
                        }
                        if(nodExp) {
                            subtotal.O ++;
                        }
                        total ++;
                    });
                }
            }
            if(q.stats){
                let soln = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {schedid: {$in: merged.map(e=>e.id), } }, {schedid:1, state:1, reject:1, forward:1, datatime:1});
                if(soln.length) {
                    let result = soln;
                    result = groupBy(result, 'schedid',  (item, sublist) => {
                        return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
                    });
                    let vals = Object.values(result);
                    
                    vals.forEach((e:any,i) => {
                        let t = merged.find(s=>s.id == e[0].schedid);
                        let end = t ? t.end : false;
                        let exp = getExpired(merged, e[0].schedid);
                        let isExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, exp);
                        let nodExp = !(end && accomplished(e[0].state)) && isExpired(e[0].datatime, t.expire || 1000)
                        stats[e[0].schedid] = {
                            time:(e[0].datatime - e[e.length-1].datatime), 
                            end: (end && accomplished(e[0].state)),
                            I: !end,
                            V: (end && e[0].state != 'V'),
                            E: (e[0].reject || false),
                            C: (end && accomplished(e[0].state)),
                            X: isExp,
                            O: nodExp
                        };
                    });
                }
            }
            res.json({code: 'OK', data: {count:{total:total, subtotal:subtotal, stats: stats}, page:output}});
        }
    }catch(e){
        __debug(`${EDataPath.GETSCHEDPAGE} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.GETSCHEDPAGE} err at exception ${new Date().toLocaleString()}`}});
    }
});

import FlexSearch from 'flexsearch'
import * as nodejieba from 'nodejieba';
import { taskEmail } from './msg';

class Search{
    index = null;
    count = 0;
    constructor(){
    }
    async init(){
        if(this.index) {
            return;
        }
        nodejieba.load({
            dict: path.relative(process.cwd(), path.resolve((nodejieba as any).DEFAULT_DICT)).replace(/\\/g,'/'),
            hmmDict: path.relative(process.cwd(), path.resolve((nodejieba as any).DEFAULT_HMM_DICT)).replace(/\\/g,'/'),
            userDict: path.relative(process.cwd(), path.resolve((nodejieba as any).DEFAULT_USER_DICT)).replace(/\\/g,'/'),
            idfDict: path.relative(process.cwd(), path.resolve((nodejieba as any).DEFAULT_IDF_DICT)).replace(/\\/g,'/'),
            stopWordDict: path.relative(process.cwd(), path.resolve((nodejieba as any).DEFAULT_STOP_WORD_DICT)).replace(/\\/g,'/')
        });
        this.index = FlexSearch.create({
            encode: false,
            tokenize: function(str){
                return nodejieba.cutForSearch(str);
            },
            doc: {
                id: "id",
                field: ["solution" , "tagStr", 'content'], 
            }
        })
        /* let solns = await __db.find(__dbName.PLANS, __colName.SOLUTIONS, {}, {id:1, schedid:1, planid:1, solution:1, curr:1, tags:1, datatime:1});
        if(solns.length) {
            solns = solns.map(e=>({...e, ...{end:__planner.isScheduleEnd(e.planid, e.curr)}}));
            solns = groupBy(solns, 'schedid',  (item, sublist) => {
                return item.datatime.getTime() - sublist[0].datatime.getTime() > 0;
            });
        }
        let postSolns = Object.values(solns).map((e:any)=>({id:e[e.length-1].schedid,solution:e[e.length-1].solution,tags:e[e.length-1].tags && e[e.length-1].tags.join ? e[e.length-1].tags.map(e=>e.name).join(',') : e[e.length-1].tags,datatime:e[e.length-1].datatime})); */
        let solns = await __db.find(__dbName.PLANS, __colName.ARTICLES, {flag:{$in:['show','top']}}, {id:1, userid:1, solution:1, content:1, planid:1, planname:1, tags:1, flag:1, datatime:1, attachments:1});
        let postSolns = solns.map(e=>({...e, ...{tagStr:e.tags?e.tags.map(t=>t.name).join(' '): ''}}))
        this.count = postSolns.length;
        this.index.add(postSolns);
    }
    search(keyword:string,  sort:number = 1){
        if(this.index){
            return this.index.search({
                field: [ "solution",  "tagStr", "content" ],
                query: keyword,
                bool: "or",
                sort: function(a, b){
                    return (new Date(a.datatime).getTime() - new Date(b.datatime).getTime() ? sort : -sort);
                }
            });
        }
    }
}
server.use(EDataPath.LOAD, async (req, res)=>{
    try{
        __debug(`${EDataPath.LOAD}`);
        let q = {...req.body, ...req.params, ...req.query};
        __search = new Search() ;
        await __search.init();
        res.json({code: 'OK'});
    }catch(e){
        __debug(`${EDataPath.SEARCH} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.SEARCH} err at exception ${new Date().toLocaleString()}`}});
    }
})

server.use(EDataPath.SEARCH, async (req, res)=>{
    try{
        __debug(`${EDataPath.SEARCH}`);
        let q = {...req.body, ...req.params, ...req.query};

        if (!q || Object.keys(q).length === 0) {
            __debug(`${EDataPath.SEARCH} err at parameters`);
            res.json({code: 'ERR', data:{msg: `${EDataPath.SEARCH} err at parameters`}});
        }else { 
            if(!q.keyword){
                if(q.limit) {
                    res.json({code: 'OK', data: Object.values(__search.index.i).sort((a:any,b:any)=>new Date(a.datatime).getTime() - new Date(b.datatime).getTime() ? q.sort||1 : -(q.sort||1)).filter((_,i)=>i>=(q.skip) && i<(q.skip +q.limit) ), count:__search.count});
                }else{
                    res.json({code: 'OK', data: Object.values(__search.index.i).sort((a:any,b:any)=>new Date(a.datatime).getTime() - new Date(b.datatime).getTime() ? q.sort||1 : -(q.sort||1)), count:__search.count});
                }
            }else {
                let count = __search.search(q.keyword,q.sort);
                let result = count.filter((_,i)=>i>=(q.skip) && i<(q.skip +q.limit) );
                res.json({code: 'OK', data: result, count:count ? count.length : __search.count});
            }
        }
    }catch(e){
        __debug(`${EDataPath.SEARCH} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.SEARCH} err at exception ${new Date().toLocaleString()}`}});
    }
})


/* const __wfm = new WorkflowManager({}); */
let __planner = new Planner()
let __search = new Search() ;
server.listen(6601,  async () => {
    console.log('server at：6601');
    __db.config(new Mysql(), new Mongodb());
    //await __search.init();
    await __db.connect('mongodb');
    /* await __wfm.restore(); */
    await __planner.fromPlanModel();
    await __search.init();

    //await taskEmail();
});

server.use(EDataPath.RESTART, async (req, res)=>{
    try{
        __debug(`${EDataPath.RESTART}`);
        __planner = new Planner();
        __search = new Search();
        await __planner.fromPlanModel();
        await __search.init();
        res.json({code: 'OK'});
    }catch(e){
        __debug(`${EDataPath.SEARCH} err at ${e.toString()} ${e.message}`);
        res.json({code: 'ERR', data:{msg: `${EDataPath.SEARCH} err at exception ${new Date().toLocaleString()}`}});
    }
})
