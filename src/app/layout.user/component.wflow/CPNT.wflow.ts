import { Component, AfterViewInit, AfterViewChecked, ChangeDetectorRef, ViewChild, ElementRef, ApplicationRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { enterTransition } from '../router.animation';
import { Bus, BusService, IBusMessage } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { startWith, map } from 'rxjs/operators';
import { CDialog } from 'app/common/dialog/CPNT.dialog';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CInfo } from 'app/common/dialog/CPNT.info';
import { ViewerMgr, Viewer } from 'app/common/workflow';
import { CDDlg } from 'app/common/dialog/CPNT.ddlg';
import { CChangeWflow } from './CPNT.change.wflow';


@Component({
    templateUrl: './CPNT.wflow.html',
    styleUrls: ['./CPNT.wflow.css'],
    animations: [enterTransition],
})
export class CWFlow extends Bus implements AfterViewInit {
    @ViewChild('viewerContainer') viewerContainer: ElementRef<HTMLDivElement>;
    viewerMgr: ViewerMgr = null;
    roleData;
    ngAfterViewInit(): void {
        Viewer.config(this.viewerContainer.nativeElement);
        
        this.user.geRoles().then(d => {
            this.roleData = [{id:0, name:'发起人'},...d];
            this.cdr.detectChanges();
        });
        this.user.restoreModel().then(models => {
            this.cdr.detectChanges();
            this.viewerMgr.fromModel(models);
            this.views = this.viewerMgr.getViewers();
            this.cdr.detectChanges();
        });
        this.cdr.detectChanges();
        
    }
    name(): string {
        return 'CWFlow'
    }
    views = [];
    that = null;
    constructor(private user: UserService, private cdr:ChangeDetectorRef, protected bus: BusService) {
        super(bus);
        this.viewerMgr = new ViewerMgr();
        this.that = this;
    }
    async finish() {
        let r = await this.user.storeModel( this.viewerMgr.getViewers().map(v => v.toModel()) as any);
        let r2 = await this.user.restart();
        this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提交', info: JSON.stringify([r,r2])} })
    }
    changeViewer({data}){
        let obj = data.obj;
        if(!obj.name){
            this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提示', info: JSON.stringify('名字为空,无效')} })
            return;
        }
        this.viewerMgr.getViewer().setName(obj.name);
        this.viewerMgr.getViewer().setValid(obj.valid);
        this.views = this.viewerMgr.getViewers();
        this.cdr.detectChanges();
    }
    createViewer({data}){
        let obj = data.obj;
        if(!obj.name){
            this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提示', info: JSON.stringify('名字为空,无效')} })
            return;
        }
        this.viewerMgr.createViewer(obj.name);
        this.viewerMgr.getViewer().setValid(obj.valid);
        this.viewerMgr.getViewer().onSelectedDblick(this.viewerMgr.getViewer().first.getId());
        this.viewerMgr.getViewer().setRole(this.roleData[0].id, this.roleData[0].name);

        let gw = this.viewerMgr.getViewer().createOrGateway(150, 50);
        this.viewerMgr.getViewer().createFlow('', this.viewerMgr.getViewer().first, gw, '');
        this.viewerMgr.getViewer().refresh();
         
        this.views = this.viewerMgr.getViewers();
        //this.tasks = this.viewerMgr.getViewer().getTasks().map(e=>({...e.role,taskid:e.id,expire:e.expire || 1000,privilege:e.privilege || ''}));
    }
    selectViewer(data){
        let obj = data;
        this.viewerMgr.show(obj.id);
        this.alert(this.viewerMgr.getViewer().id)
        //e.target.focus();
        this.tasks = this.viewerMgr.getViewer().getTasks().map(e=>({...e.role,taskid:e.id,expire:e.expire || 1000,privilege:e.privilege || ''}));
        this.viewTitle = this.viewerMgr.getViewer() ? this.viewerMgr.getViewer().name.slice(0) : '流程节点';
        this.cdr.detectChanges();
    }
    removeViewer(i){

    }
    titleChange(e){
        if(this.viewerMgr.getViewer()){
            this.viewerMgr.getViewer().setName(e);
            this.views = this.viewerMgr.getViewers();
        }
    }
    tasks;
    viewTitle = '流程节点'
    getXY(){
        const num = 3;
        if(this.tasks && this.tasks.length>0){
            let row = Math.ceil(this.tasks.length / num);
            let col = this.tasks.length % num;
            let width =  this.viewerContainer.nativeElement.clientWidth / num;
            let height = this.viewerContainer.nativeElement.clientHeight / num;
            return {x: width * (col - 0.5), y: height * (row - 0.5)};
        }
        return {x:0, y:0}
    }
    changeTask({data}){
        let obj = data.obj;
        let idx = data.idx;
        if(!this.tasks[idx]){
            return;
        }
        if(!obj.name){
            this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提示', info: JSON.stringify('名字为空,无效')} })
            return;
        }
        this.viewerMgr.getViewer().onSelectedDblick(this.tasks[idx].taskid);
        if(obj.id && obj.name){
            this.viewerMgr.getViewer().setRole(obj.id, obj.name);
        }
        if(data.exp){
            this.viewerMgr.getViewer().setExpire(data.exp);
        }
        if(data.obj){
            this.viewerMgr.getViewer().setPrivilege(data.obj.privilege);
        }
        this.tasks[idx].id = obj.id;
        this.tasks[idx].name = obj.name;
        this.tasks = this.viewerMgr.getViewer().getTasks().map(e=>({...e.role,taskid:e.id,expire:e.expire || 1000, privilege:e.privilege || ''}));
        this.cdr.detectChanges();
    }
    createTask({data}){
        let obj = data.obj;
        let idx = data.idx;
        let {x, y} = this.getXY();
        if(!obj.name){
            this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提示', info: JSON.stringify('名字为空,无效')} })
            return;
        }
        let task = this.viewerMgr.getViewer().createTask(obj.name, x, y, data.exp);
        this.viewerMgr.getViewer().onSelectedDblick(task.getId());
        this.viewerMgr.getViewer().setRole(obj.id, obj.name);

        let gw = this.viewerMgr.getViewer().createOrGateway(x+50, y);
        this.viewerMgr.getViewer().createFlow('', task, gw, '');
        this.viewerMgr.getViewer().refresh();
        this.tasks.push({...obj, taskid:task.getId()});
        this.tasks = this.tasks.slice(0)
        this.cdr.detectChanges();
    }
    taskid;
    selectTask({taskid}){
        this.taskid = taskid;
        this.source = this.viewerMgr.getViewer().getGw(taskid);
        this.flows = this.viewerMgr.getViewer().getFlows(taskid) ? this.viewerMgr.getViewer().getFlows(taskid).map(e=>({...e.action,target:{...e.target.role, taskid:e.target.id},flowid:e.id})) :[];
        let t = this.viewerMgr.getViewer().getTask(taskid);
        this.taskTitle = t.length==1 ? t[0].role.name +'处理动作': '节点动作';
    }
    removeTask({data}){
        let obj = data.obj;
        let idx = data.idx;
        if(!obj || !obj.taskid){
            return;
        }
        let gw = this.viewerMgr.getViewer().getGw(obj.taskid);
        if(gw){
            this.viewerMgr.getViewer().remove(gw.getId());
        }
        this.viewerMgr.getViewer().onSelectedDblick(obj.taskid);
        this.viewerMgr.getViewer().remove();
        //this.tasks.splice(idx,1)
        this.cdr.detectChanges();
    }
    taskTitle = '节点动作'
    flows;
    source;
    changeFlow({data}){
        let obj = data.obj;
        let idx = data.idx;
        let target = data.target;
        if(!this.flows[idx]){
            return;
        }
        this.viewerMgr.getViewer().setAction(this.flows[idx].flowid, obj);
        this.flows[idx].name = obj;

        if(target.taskid != this.flows[idx].target.taskid){
            this.viewerMgr.getViewer().setTarget(this.flows[idx].flowid, target.taskid);
            if(this.taskid){
                this.selectTask({taskid:this.taskid});
            }
        }
        this.cdr.detectChanges();
    }
    createFlow({data}){
        let obj = data.obj;
        let idx = data.idx;
        let target = data.target;
        if(!this.source){
            return;
        }
        let task = this.viewerMgr.getViewer().getTask(target.taskid);
        if(task.length != 1){
            return;
        }
        let f = this.viewerMgr.getViewer().createFlow(obj || '动作名称', this.source, task[0].cell, '');
        this.viewerMgr.getViewer().refresh();
        this.flows.push({name: f.getAttribute('label'),target:{id: f.target.getAttribute('roleid'), name: f.target.getAttribute('rolename'), taskid:target.taskid},flowid:f.getId()})
        this.flows = this.flows.slice(0)
        this.cdr.detectChanges();
    }
    removeFlow({data}){
        let obj = data.obj;
        let idx = data.idx;
        let target = data.target;
        if(!obj || !obj.flowid){
            return;
        }
        this.viewerMgr.getViewer().remove(obj.flowid);
        //this.flows.splice(idx,1)
        this.cdr.detectChanges();
    }
    alert(planid){
        /* this.user.getSolutions({planid:planid}, {userid:1}).then(data =>{
            if(data.length > 0){
                this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CInfo, button: '', returnto: this, title: '提示', info: '已有工单和流程关联,请谨慎修改'} })
            }
        }) */
    }
}