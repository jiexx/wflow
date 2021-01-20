import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'app/common/data/user';
import { trigger, transition, style, animate } from '@angular/animations';
import { IResult } from 'config/index';
import { Router } from '@angular/router';
import { enterTransition } from '../router.animation';


const mobileValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
    /* else if(!/^((13[0-9])|(15[^4])|(18[0-9])|(17[0-1|3|5-8])|(14[5|7|9]))\d{8}$/g.test(control.value)){
        return {invalid: true, msg: '手机号不正确'};
    } */
}
const codeValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '密码不能为空'};
    }
    else if(control.value.length !== 4){
        return {invalid: true, msg: '密码4位'};
    }
}

@Component({
    templateUrl: './CPNT.login.html',
    styleUrls: ['./CPNT.login.css'],
    animations: [trigger(
        'enterAnimation', [
            transition(':enter', [
                style({transform: 'scale(0)', opacity: 0 }),
                animate('300ms', style({ transform:'scale(1.0)', opacity: 1 }))
            ]),
            transition(':leave', [
                style({transform: 'scale(1.0)', opacity: 1 }),
                animate('300ms', style({transform: 'scale(0)', opacity: 0 }))
            ])
        ]
    )],
})
export class CLogin implements AfterViewInit {
    constructor(private user : UserService, private router: Router, private cdr: ChangeDetectorRef){
        // this.user.download('https://peapix.com/bing/feed?country=us').then((res: string)=>{
        //     let a = res.match(/<url>(.+?)<\/url>/g)
        // })
    }
    bg: string = './assets/img/bg.jpg';
    async ngAfterViewInit(){
        this.step = 2;
        if(localStorage.getItem('logined1')){
            this.router.navigate(['/main/home'])
        }
    }
    mobile = new FormControl('', [
        mobileValidator
    ]);
    code = new FormControl('', [
        codeValidator
    ]);
    form: FormGroup = new FormGroup({
        mobile: this.mobile,
        code: this.code
    });
    step: number = 2;
    submit(){
        if(this.mobile.valid && this.step == 1){
            /* await this.user.next({mobile: this.mobile.value}).catch(res=>{ 
                console.log(res)
                this.mobile.setErrors(res.data.msg) 
            }); */
            this.step = 2;
        }else if(this.code.valid && this.step == 2) {
            /* await this.user.next({mobile: this.mobile.value, captcha: this.code.value}).catch(res=>{ 
                console.log(res)
                this.code. setErrors({invalid: true, msg: res.data.msg}) 
            }); */
            let res =  this.user.check({label: this.mobile.value}).then(res =>{
                if(res){
                    localStorage.setItem('logined1',res.id);
                    this.router.navigate(['/main'])
                }
            });
           
            //this.cdr.detectChanges();
        }else {
            this.form.markAllAsTouched();
        }
    }
}