import { Component, OnInit } from '@angular/core';
import { IDialogMessage, IDialog } from './ITF.dialog';
import { UserService } from '../data/user';



@Component({
    templateUrl: './CPNT.category.html',
    styles: []
})
export class CCategory implements IDialog {
    open(msg: IDialogMessage): void {
        this.title = (this.msg.data && this.msg.data.title) || '';
        this.button = (this.msg.data && this.msg.data.button) || 'yes';
        !this.msg.data.action ? this.msg.data['action'] ='yes' : null;
    }
    close(): void {
    }
    constructor(private user : UserService){
        
    }
    title : string = '';
    action : 'yes' | 'no' = 'no';
    button : 'yes' | 'no' | 'yes|no' = 'yes';
    msg : IDialogMessage = {command: '', data: { conf: [], returnto: null, index: 0}};
    classify(i: number){
        this.msg.data['index'] = i;
    }

    async checkout(){
        //await this.user.next(params);
    }
}