import { Component, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'app/common/data/user';
import { trigger, transition, style, animate } from '@angular/animations';
import { IResult } from 'app/common/data/data';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';


const addrValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: 'email不能为空'};
    }
    else if(control.value.length < 6){
        return {invalid: true, msg: 'email字数太少'};
    }
}
const introValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: false, msg: '不能为空'};
    }
}

@Component({
    templateUrl: './CPNT.profile.html',
    styleUrls: ['./CPNT.profile.css'],
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
export class CProfile implements AfterViewInit {
    constructor(private user : UserService){

    }
    data;
    ngAfterViewInit(){
        this.user.getUser().then(u =>{
            this.data = u;
            this.addr.setValue(u.email);
            this.intro.setValue(u.tel);
            this.avatar = u.avatar;
        });
    }
    addr = new FormControl('', [
        addrValidator
    ]);
    intro = new FormControl('', [
        introValidator
    ]);
    form: FormGroup = new FormGroup({
        mobile: this.addr,
        code: this.intro
    });
    avatar: string = null;
    async submit(){
        if(this.addr.valid && this.intro.valid){
            /* await this.user.next({addr: this.addr.value, intro: this.intro.value, avatar: this.avatar}).catch(res=>{ 
                console.log(res)
                this.addr.setErrors({invalid: true, msg: res.data.msg}) 
            }); */
            this.data.email = this.addr.value;
            this.data.tel = this.intro.value;
            this.data.avatar = this.avatar;
            await this.user.saveUser(this.data);
        }else {
            this.form.markAllAsTouched();
        }
    }

    public onComplete( result : IUploaderResult[] ){
        if( !result || result.length < 1){
            return;
        }
        this.avatar = result[0]._base64imgs;
    }
}