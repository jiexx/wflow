import { Component, OnInit, Injectable, Injector, ReflectiveInjector } from '@angular/core';
import { IDialogMessage, IDialog } from './ITF.dialog';
import { UserService } from '../data/user';

@Injectable()
export class DData {
}

@Component({
    templateUrl: './CPNT.ddlg.html',
    styles: [
`::ng-deep mat-dialog-container{
    position:relative;
}
.mat-dialog-content{
    overflow: hidden;
}
.close {
    position:absolute;
    top:0; right:0;
    cursor:pointer;
    color: #dfdfdf;
}`
]
})
export class CDDlg implements IDialog {
    open(msg: IDialogMessage): void {
        this.title = (this.msg.data && this.msg.data.title) || '';
        this.button = (this.msg.data && this.msg.data.button);
        !this.msg.data.action ? this.msg.data['action'] ='no' : null;
        this.inj = ReflectiveInjector.resolveAndCreate([{ provide: DData, useValue: this.msg.data }], this.injector);
    }
    close(): void {
        //console.log(this.msg.data.component)
    }
    inj: Injector;
    constructor(public injector: Injector){
        
    }
    title : string = '';
    action : 'yes' | 'no' = 'no';
    button : 'yes' | 'no' | 'yes|no' = 'yes';
    msg : IDialogMessage = {command: '', data: { returnto: null, info: 0}};

    async checkout(){
        //await this.user.next(params);
    }
}