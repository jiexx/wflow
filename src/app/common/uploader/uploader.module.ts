import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUploader } from './CPNT.uploader';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        CUploader,
    ],
    exports: [
        CUploader,
    ],
    providers:[
        //AuthGuard,
    ],
    
})
export class UploaderModule { }