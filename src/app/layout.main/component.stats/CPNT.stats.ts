import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { UserService } from 'app/common/data/user';
import { arrayEqual } from 'app/common/workflow';
import { MatTableDataSource } from '@angular/material/table';
//import * as echarts from "echarts";
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Bus, BusService } from 'app/common/bus/bus';
import { CDialog } from 'app/common/dialog/CPNT.dialog';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CDDlg } from 'app/common/dialog/CPNT.ddlg';
//import { StatsDetail } from '../component.stats/statsDetail';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { __colName } from 'app/common/workflow';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
    templateUrl: './CPNT.stats.html',
    styleUrls: ['./CPNT.stats.css'],
})
export class CStats extends Bus implements AfterViewInit {
    name(): string {
        return  'CWorks';
    }
    convert(){

    }
    all: {_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string[], tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, datatime: string}[][] = [];
    users:{ [_id:string]:{_id:string,name:string, label:string, status:string, roles:string,roleid:string,rolename:string}};
    solutions: {_id: string, id: string, flows?: any, schedid:string, userid: string, solution: string, attachments: string, tags: {id:string, name:string}[], actions: any[], end: boolean, planid: string, ownerid: string, curr: [], state:string, datatime: string}[][] = [];
    tags = [{id:'-1',name:'全部'}];
    tagsInput = [];
    timeInputShow = false;
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    nextStates = {
        V: '已关闭',
        S: '已关闭',
        SS: '已关闭',
        NS: '已关闭'
    }
    nextState(soln){
        if(!soln.state){
            return !soln.end ? '处理中' : '待验证';
        }
        
        return this.nextStates[soln.state];
    }
    state = 'A';
    tobedo(){
        this.tableList[0].list = [];
        this.all.forEach(soln =>{
            let commitee = this.users[soln[0].ownerid] ? this.users[soln[0].ownerid].name : '';
            let owner = this.users[soln[soln.length-1].userid] ? this.users[soln[soln.length-1].userid].name: ''            
            this.tableList[0].list.push({state:this.nextState(soln[0]),title:soln[soln.length-1].solution, commitee:commitee,owner:owner,datetime:new Date(soln[soln.length-1].datatime).toLocaleString(),workDetail:soln})
        })
        
        this.tableList[0].list = new MatTableDataSource(this.tableList[0].list);
    }
    onPage(e){
    }
    @ViewChild(MatPaginator) paginators:  MatPaginator;
    pageLen = 0; 
    pageSize = 10;
    ngAfterViewInit(): void {
        this.user.getUsers().then(users=>{
            this.user.getRoles().then(roles=>{
                this.users = users.reduce((p,e)=>{
                    p[e.id] = {...e, ...{rolename: e.roles ? String(e.roles).split(',').map(r=>roles.find(s=>s.id == r).name).join(','): ''}}
                    return p;
                },  {});
                this.find('A','');
            });
        });
        this.user.getSchedulePage({counter:true,state:['all']}).then((cnt: any) =>{
            
            this.pageLen = cnt && cnt.count ? cnt.count.total : 0;
            if (this.paginators) {
                
                this.paginators.firstPage();
                
            }
        })
        // this.user.getCount(__colName.SCHEDULES,{}).then(cnt =>{
            
        //     this.pageLen = cnt;
        //     if (this.paginators) {
        //         this.paginators.firstPage();
                
        //     }
        // })
        this.user.getTags().then(wf=>{
            this.tags = [...this.tags, ...wf.map(e=>({id:e._id, name:e.name}))];
        })
        
    }
    _param = {};
    _statisticsType;
    _findType;
    find(statisticsType,findType){
        this._statisticsType = statisticsType;
        this._param = {};
        if(statisticsType == 'timeStatistics'){
            let arr = [];
            let paramStr = {};
            this.timeTitleName.forEach(function(item,index){
                if(item.name == findType){
                    paramStr = {schedid:{$in:item.time.id}};
                }                
                arr = arr.concat(item.time.id)
            });
            if(arr.length > 0 && findType == ''){
                paramStr = {schedid:{$in:arr}};
            } 
            let q = [];
            if(this.keyword.value) {
                q.push({'solution':{$regex : ".*"+this.keyword.value+".*"}});
            }
            if(this.range.controls.start.value || this.range.controls.end.value) {
                let q1 = this.range.controls.start.value ? {$gte: new Date(this.range.controls.start.value)} : {};
                let q2 = this.range.controls.end.value ? {$lte: new Date(this.range.controls.end.value)} : {};
                q.push({'datatime':{...q1,...q2}});
            } 
            if(this.tagsInput.length > 0){
                q.push({'tags.id':{'$in':this.tagsInput.map(e=>e.id)}});
            }
            if(JSON.stringify(paramStr) != '{}'){
                q.push(paramStr);
            }
            this._param = q.length == 1 ? q[0] : (q.length > 1 ? {$and:q} : null);
            this.findCount(this._param,statisticsType,findType,undefined) 
        }else if(statisticsType == 'A'){
            this.findPage(this._param,statisticsType,findType);
        }    
    }
    _query = {};
    findPage(param,statisticsType,findType){
        this._param = param;
        this._statisticsType = statisticsType;
        this._findType = findType;
        if(this._statisticsType == 'A'){
            this._param = {};
            let _this = this;
            this.countList.forEach(function(item,index){
                if(item.name == _this._findType){
                    _this._param = {schedid:{$in:item.id}};
                }
            });
        }
        let q = [];
        if(this.keyword.value) {
            q.push({'solution':{$regex : ".*"+this.keyword.value+".*"}});
        }
        if(this.range.controls.start.value || this.range.controls.end.value) {
            let q1 = this.range.controls.start.value ? {$gte: new Date(this.range.controls.start.value)} : {};
            let q2 = this.range.controls.end.value ? {$lte: new Date(this.range.controls.end.value)} : {};
            q.push({'datatime':{...q1,...q2}});
        } 
        if(this.tagsInput.length > 0){
            q.push({'tags.id':{'$in':this.tagsInput.map(e=>e.id)}});
        }
        let timpQ = [];
        Object.assign(timpQ,q);
        q.push(this._param);
        this._query = q.length == 1 ? q[0] : (q.length > 1 ? {$and:q} : null);
        this.user.getSchedulePage({counter:true,state:['all'],data:this._query}).then((cnt: any) =>{
            this.pageLen = cnt && cnt.count ? cnt.count.total : 0;
            if (this.paginators) {
                
                this.paginators.firstPage();
            }
        })
        // this.user.getCount(__colName.SCHEDULES, ids).then(cnt =>{
        //     this.pageLen = cnt;
        // })
        if(this.paginators.page.observers.length <= 1) {
            this.paginators.page.subscribe(page=>{
                
                this.user.getSchedulePage({state:['all'], data:this._query, limit:this.paginators.pageSize, skip:this.paginators.pageIndex*this.paginators.pageSize}).then(e=>{
                    let data = e.page;
                    this.all = [];
                    if(data){
                        let list = Object.values(data);
                        let userids = list.reduce((p:any,c)=>{
                            p = [...p, ...c.map(e=>e.userid)];
                            return p.filter((e,i)=>p.indexOf(e) == i);
                        }, []);
                        this.user.getUser(userids).then((u:any) =>{
                            list.forEach(e =>{
                                e.forEach( i => {
                                    let o = u.find(a=>a.id == i.userid);
                                    i['username'] = o.name;
                                    i['avatar'] = o.avatar;
                                    if(i['attachments']) {
                                        i['attachments'] = i['attachments'].map(a=>_storageurl(a));
                                    }
                                    if(i['solution']){
                                        i['solution'] = this.dispalyImage(i['solution']) as any;
                                    }
                                })
                            })
                        }); 
                        this.all = [...this.all, ...Object.values(data)];
                    }
                    this.tobedo();
                    if(this._statisticsType == 'A'){
                        this.findCount(this._query,this._statisticsType,findType,page);
                    }
                })
                
            }) 
        }
        this.paginators.page.emit();
    }
    findCount(param,statisticsType,findType,page){
        this.user.getSchedulePage({state:['all'], data:param, stats:true}).then((data:any)=>{
            this.being.count = 0;
            this.verification.count = 0;
            this.sendBack.count = 0;
            this.overdue.count = 0;
            this.closeInfo.count = 0;
            this.timeTitleName = [];
            if(data.length != 0){
                Object.keys(data.count.stats).forEach(id => {
                    let time = data.count.stats[id].time
                    if(data.count.stats[id].end){
                        let day = Number(time/1000/60/60/24).toFixed();
                        var resource = this.timeTitleName.filter(function (item, index, array) { 
                            return (item.name == day+'天'); 
                        } );
                        if(resource.length > 0){
                            resource[0].time.count = resource[0].time.count + 1;
                            resource[0].time.id.push(id);
                        }else{
                            this.timeTitleName.push({name:day+'天',time:{count:1,id:[id]}})
                        }
                        this.closeInfo.count = this.closeInfo.count + 1;
                        this.closeInfo.id.push(id);
                    }
                     if(data.count.stats[id].I){
                        this.being.count = this.being.count + 1;
                        this.being.id.push(id);
                    }
                     if(data.count.stats[id].V){
                        this.verification.count = this.verification.count + 1;
                        this.verification.id.push(id);
                    }
                     if(data.count.stats[id].E){
                        this.sendBack.count = this.sendBack.count + 1;
                        this.sendBack.id.push(id);
                    }
                     if(data.count.stats[id].X){
                        this.overdue.count = this.overdue.count + 1;
                        this.overdue.id.push(id);
                    }
                })
            }
            //排序
            this.timeTitleName.sort(function (x, y) {
                if (x.name < y.name) {
                    return -1;
                } else if (x.name > y.name) {
                    return 1;
                } else {
                    return 0;
                }
            });
            
            this.countList = [this.being, this.verification, this.sendBack, this.overdue, this.closeInfo]
            let arr = [];
            let _this = this;
            this.timeTitleName.forEach(function(item,index){
                if(item.name == findType){
                    _this._param = {schedid:{$in:item.time.id}};
                }                
                arr = arr.concat(item.time.id)
            });
            if(arr.length > 0 && findType == ''){
                _this._param = {schedid:{$in:arr}};
            }    

            if(statisticsType == 'timeStatistics'){
                this.findPage(_this._param,statisticsType,findType);
            }
           
            this.echartsInit(this._statisticsType);
        });
    }
   
    colTitles: string[] = ['state', 'commitee','datetime', 'detail'];
    items: Array<any> = [
        { name: '处理中'},
        { name: '待验证'},
        { name: '已退回'},
        { name: '已逾期'},
        { name: '已关闭'},
    ];
    countList: Array<any> = [];
    being: any = {name: '处理中', id:[], count:0};
    verification: any = {name: '待验证', id:[], count:0};
    sendBack: any = {name: '已退回', id:[], count:0};
    overdue: any = {name: '已逾期', id:[], count:0};
    closeInfo: any = {name: '已关闭', id:[], count:0};

    timeTitleName: Array<any> = []
    time5 = {count:0,id:[]};//小于5分钟
    time10 = {count:0,id:[]};//大于5分钟，小于10分钟
    time30 = {count:0,id:[]};//大于10分钟，小于30分钟
    day1 = {count:0,id:[]};//大于30分中，小于1天
    day3 = {count:0,id:[]};//大于1天，小于3天
    greaterDay3 = {count:0,id:[]};//大于3天

    tableList: Array<any> = [{list:[]}];
    _total: number = 0;
    _histogram_max :number = 1;
    _histogram_w : number = 300;
    _histogram_gap : number = 8;
    constructor(protected bus: BusService,public user: UserService, private cdr:ChangeDetectorRef,private sanitizer:DomSanitizer) {
        super(bus);
    }

    getPerimeter(radius: number, i: number): number {
        return Math.PI * 2 * radius;
    }

    getColor(index: number): string {
        return this.items[index].color;
    }

    getOffset(radius: number, index: number): number {
        var percent = 0;

        for (var i = 0; i < index; i++) {
            percent += ((this.items[i].count) / this._total);
        }
        var perimeter = Math.PI * 2 * radius;
        if(this.items[index].color=='yellow'){
            var i  = 0;
        }
        return perimeter* percent;
    }
    dispalyImage(a) {
        if(a.replace){
            let b = a.replace(/<img.+?src="(.+?)".+?>/g, '<a href="$1" target="_blank" ><img style="width:auto;max-height:10rem" src="$1"></a>');
            return this.sanitizer.bypassSecurityTrustHtml(b);
        }else {
            return a;
        }
    }
    echartsInit(statisticsType){
        var colorList = ['#FA514C','#00C5F7','#d7d98b','#dd8369','#9fe6b8','#e0645d','#4f81bc','#00b24f','#8064a1','#4badc4','#ffc000','#0f495f'];
        var nameList = [];
        var columnarDataList = [];
        var pidDataList = [];
        var ther = this;
        //工单一览
        if(statisticsType == 'A'){
            this.items.forEach(function(item,index){
                nameList.push(item.name);
                columnarDataList.push(ther.countList[index].count);
                if(ther.countList[index].count > 0){
                    pidDataList.push({name:item.name, value:ther.countList[index].count});
                }else{
                    pidDataList.push({})
                }
            });
            //时间统计
        }else if(statisticsType == 'timeStatistics'){
            ther.timeTitleName.forEach(function(item,index){
                nameList.push(item.name);
                columnarDataList.push(item.time.count);
                if(item.time.count > 0){
                    pidDataList.push({name:item.name, value:item.time.count})
                }else{
                    pidDataList.push({})
                }
                
            });
        }
        //柱状统计图
        // var myColumnarChart = echarts.init((<HTMLDivElement>document.getElementById("columnar")));
        // var optionColumnar:any = {
        //     tooltip: {
        //         trigger: 'axis',
        //         axisPointer: {            // 坐标轴指示器，坐标轴触发有效
        //             type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        //         }
        //     },
        //     grid: {
        //         left: '3%',
        //         right: '4%',
        //         bottom: '3%',
        //         containLabel: true
        //     },
        //     xAxis: [
        //         {
        //             type: 'category',
        //             data: nameList,
        //             axisTick: {
        //                 alignWithLabel: true
        //             },
        //             axisLabel: {
        //                 interval:0,
        //                 rotate:70
        //             }
        //         }
        //     ],
        //     yAxis: [
        //         {
        //             type: 'value'
        //         }
        //     ],
        //     series: [
        //         {
        //             name: '数量',
        //             type: 'bar',
        //             barWidth: '60%',
        //             data: columnarDataList,
        //             itemStyle: {
        //                 normal: {
        //                     color: function(params) {
        //                         return colorList[params.dataIndex]
        //                     },
        //                 }
        //             }
        //         }
        //     ],
        // };
        
        
        // if(myColumnarChart && myColumnarChart['_$handlers']){
        //     //防止重复触发点击事件
        //     if(myColumnarChart['_$handlers']['click']){
        //         myColumnarChart['_$handlers']['click']['length'] = 0;
        //     }
        // }
        // myColumnarChart.on('click', function (params) {
        //     ther.find(statisticsType,params.name);
        // });
        // myColumnarChart.clear();
        // myColumnarChart.setOption(optionColumnar);

        // //饼状统计图
        // const myPieChart = echarts.init((<HTMLDivElement>document.getElementById("pie")));
        // var optionPie:any = {
        //     tooltip: {
        //         trigger: 'item',
        //         formatter: '{b} <br> 数量：{c}<br>比率：{d}%'
        //     },
        //     legend: {
        //         orient: 'vertical',
        //         left: 'left',
        //         data: nameList
        //     },
        //     series: [
        //         {
        //             name: '访问来源',
        //             type: 'pie',
        //             radius: '55%',
        //             center: ['50%', '60%'],
        //             data: pidDataList,
        //             itemStyle: {
        //                 normal: {
        //                     color: function(params) {
        //                         return colorList[params.dataIndex]
        //                     }
        //                 }
        //             },
        //             emphasis: {
        //                 itemStyle: {
        //                     shadowBlur: 0,
        //                     shadowOffsetX: 0,
        //                     shadowColor: 'rgba(0, 0, 0, 0.5)',
        //                 }
        //             },
        //             label: {
        //                 normal: {
        //                     position: 'inner',
        //                     show : false
        //                 }
        //             }
        //         }
        //     ]
        // };
        // if(myPieChart && myPieChart['_$handlers']){
        //     //防止重复触发点击事件
        //     if(myPieChart['_$handlers']['click']){
        //        // myPieChart._$handlers.click.length = 0;
        //         myPieChart['_$handlers']['click']['length'] = 0;
        //     }
        // }
        // myPieChart.on('click', function (params) {
        //     ther.find(statisticsType,params.name);
        // });
        // myPieChart.clear();
        // myPieChart.setOption(optionPie);
    }
    rmTag(tagid){
        const index = this.tagsInput.findIndex(e => e.id == tagid);

        if (index >= 0) {
            this.tagsInput.splice(index, 1);
        }
        if(this.tagsInput.length==0){
            this.solutions = this.all as any;
        }else{
            this.solutions = this.all.filter(soln => soln.findIndex(e=> e.tags.find && e.tags.findIndex(tag=> this.tagsInput.findIndex(ti=>ti.id==tag.id)>-1) > -1) > -1)as any;
        }
    }
    filterTag(event: any): void {
        if (event && event.option && event.option.value) {
            this.tagsInput.push(event.option.value);
            if(event.option.value.id == -1){
                //this.solutions = this.all;
                this.tagsInput = [];
            }
        }
    }
	keyword = new FormControl();
	range = new FormGroup({
        start: new FormControl(),
        end: new FormControl()
    });
    search(){
        this.find(this._statisticsType,this._findType);
    }
    displayWith(opt){
        if(opt){
            return opt.name;
        }
        return ''
    }
    openDetail(item){
        //this.bus.send('CDialog', <IDialogMessage>{command: 'open', data: {CPNT: CDDlg, button: '',users:this.users, item:item, component: StatsDetail, returnto: this,title:' ',info: ' ',  } } )
    }
    selectDate(status){ 
        this.timeInputShow = false;
        this.range.controls.end.setValue(new Date());
        let _date = new Date();
        if(status == '近三天'){
            _date.setDate(_date.getDate()-3)
            this.range.controls.start.setValue(_date);
        }else if(status == '近一周'){
            _date.setDate(_date.getDate()-7)
            this.range.controls.start.setValue(_date);
        }else if(status == '近一月'){
            _date.setMonth(_date.getMonth()-1)
            this.range.controls.start.setValue(_date);
        }else if(status == '近三月'){
            _date.setMonth(_date.getMonth()-3)
            this.range.controls.start.setValue(_date);
        }else if(status == '自定义'){
            this.range.controls.start.setValue('');
            this.range.controls.end.setValue('');
            this.timeInputShow = true
        }
        this.search();
        // let fmt = 'yyyy-MM-dd hh:mm:ss'
        // let o:any = {
        //     "M+" : _date.getMonth()+1,                 //月份
        //     "d+" : _date.getDate(),                    //日
        //     "h+" : _date.getHours(),                   //小时
        //     "m+" : _date.getMinutes(),                 //分
        //     "s+" : _date.getSeconds(),                 //秒
        //     "q+" : Math.floor((_date.getMonth()+3)/3), //季度
        //     "S"  : _date.getMilliseconds()             //毫秒
        //   };
 
        // if(/(y+)/.test(fmt)) {
        //     fmt=fmt.replace(RegExp.$1, (_date.getFullYear()+"").substr(4 - RegExp.$1.length));
        // }
        // for(let k in o) {
        //     if(new RegExp("("+ k +")").test(fmt)){
        //         fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        //     }
        // }
        // console.log(fmt);
    }
    enterSearch() {
        var event = window.event || arguments.callee.caller.arguments[0];
        if (event.keyCode == 13) {
            this.search();
        }
    }
}
