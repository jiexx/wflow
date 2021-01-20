import { ChangeDetectorRef, Component, OnDestroy, AfterViewChecked, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'app/common/data/user';
import { BusService, IBusMessage, Bus } from 'app/common/bus/bus';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { IPost } from 'app/common/post/CPNT.post';

@Component({
    templateUrl: './CPNT.home.html',
    styleUrls: ['./CPNT.home.css'],
})
export class CHome extends Bus implements AfterViewInit {
    name(): string {
        return 'CHome'
    }
    users :{ [id:string]: {_id:string,name:string, label:string, status:string, roles:string, rolename:string}} ={};

    displayWith(opt){
        //console.log(opt)
        return opt ? opt.name : '';
    }
    posts: IPost[] = [];
    ngAfterViewInit(): void {
        this.user.getSchedulePage({stats:true, state:['all']}).then(e=>{
            //console.log(e)
        })
        this.user.getCounter().subscribe(data=>{
            this.bus.send('LayoutMain', <IBusMessage>{ command: 'onUpdate', data: { counter: [`已逾期 ${data.subtotal.X}`,`待处理 ${data.subtotal.I}`], num: data.subtotal.X+data.subtotal.I } })
            this.counter[0] = data.subtotal.I;
            this.counter[1] = data.subtotal.X
            this.counter[2] = data.subtotal.V;
            this.counter[3] = data.subtotal.R; 
            this.counter[5] = data.total;
        })
        this.user.getSchedulePage({limit:10000,skip:0, state:['cim'], fitlerCompleted:true}).then(data=>{
            if(data && data.page){
                let list = Object.values(data.page);
                let userids = list.reduce((p,c)=>[...p, ...c.map(e=>e.userid)], []) as any;
                userids = userids.filter((e,i)=>userids.indexOf(e) == i);
                this.user.getUserMap(userids).then((userMap) =>{
                    this.posts = list.map(e=>({
                        avatar: userMap[e[0].userid].avatar,
                        title: this.displayText(e[0]['solution']),
                        username: userMap[e[0].userid].name,
                        rolename: userMap[e[0].userid].rolex ? userMap[e[0].userid].rolex.map(r=>r.name).join('|') : '',
                        datatime: e[0]['datatime'],
                        cover: '',
                        content: '',
                        attachments: e[0]['attachments'] ?  e[0]['attachments'].map(e => ({ a: e,  url : _storageurl(e), filename: e.substr(e.lastIndexOf('\/')) })) : null as any,
                        id: e[0].schedid,
                        actions: e[0].actions,
                        forwards: (e[0] as any).roles,
                        state: this.state(e[0]),
                        replies: e.filter((_,i)=>i!=0).map(r=>({
                            avatar: userMap[r.userid].avatar,
                            title: this.displayText(r['solution']),
                            username: userMap[r.userid].name,
                            rolename: userMap[r.userid].rolex ? userMap[r.userid].rolex.map(r=>r.name).join('|') : '',
                            datatime: r['datatime'],
                            cover: '',
                            content: this.displayText(r['solution']),
                            attachments: r['attachments'] ? r['attachments'].map(e => ({ a: e,  url : _storageurl(e), filename: e.substr(e.lastIndexOf('\/')) })) : null as any,
                        })) as any
                    }));
                });
            }
        });
        this.user.geTops().then(tops=>{
            this.tops = tops;
        });
        
    }
    state(e){
        if(!e) {
            return null;
        }
        let r = null;
        if(!e.end){
            r = 'I'
        }else if(e.end && e.state != 'V'){
            r = 'V'
        }else if(e.reject){
            r = 'E'
        }else if(e.end && e.state == 'V'){
            r = 'C'
        }else if(e['isExpired'] && !e.end){
            r = 'X'
        }
        return r;
    }
    displayText(txt){
        return new DOMParser().parseFromString(txt.changingThisBreaksApplicationSecurity || txt || ' ', "text/html").body.textContent
    }
    tops;
    counter = [0,0,0,0,0,0];
    dispalyImage(a) {
        if(a.replace){
            let b = a.replace(/<img.+?src="(.+?)".+?>/g, '<a href="$1" target="_blank"><img style="width:auto;max-height:10rem" src="$1"></a>');
            return this.sanitizer.bypassSecurityTrustHtml(b);
        }else {
            return a;
        }
    }
    constructor(private router: Router, private user: UserService, public bus: BusService, private sanitizer:DomSanitizer) {
        super(bus);
    }
    search($src){
        this.router.navigate(['/main/search'], {queryParams: {kw: $src.value}});
    }
    work($src){
        this.router.navigate(['/main/work'], {queryParams: {state: $src}});
    }
}
