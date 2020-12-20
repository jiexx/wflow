import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CStar } from './CPNT.star';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        CStar,
    ],
    exports: [
        CStar,
    ],
    providers:[
        //AuthGuard,
    ],
    
})
export class StarModule { }