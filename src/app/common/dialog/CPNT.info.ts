import { Component, OnInit } from '@angular/core';
import { IDialogMessage, IDialog } from './ITF.dialog';
import { UserService } from '../data/user';



@Component({
    templateUrl: './CPNT.info.html',
    styles: []
})
export class CInfo implements IDialog {
    open(msg: IDialogMessage): void {
        this.title = (this.msg.data && this.msg.data.title) || '';
        this.button = (this.msg.data && this.msg.data.button) || 'yes';
        !this.msg.data.action ? this.msg.data['action'] ='yes' : null;
    }
    close(): void {
    }
    constructor(){

    }
    title : string = '';
    action : 'yes' | 'no' = 'no';
    button : 'yes' | 'no' | 'yes|no' = 'yes';
    msg : IDialogMessage = {command: '', data: { returnto: null, info: 0}};

    stringify(o){
        let i = 0;
        //JSON.stringify(o);
    }
}