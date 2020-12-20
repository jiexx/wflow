import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { BusService, Bus } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { CDialog } from 'app/common/dialog/CPNT.dialog';
import { IDialogMessage } from 'app/common/dialog/ITF.dialog';
import { CInfo } from 'app/common/dialog/CPNT.info';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { DData } from 'app/common/dialog/CPNT.ddlg';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
@Component({
    selector: 'repo-open',
    templateUrl: './CPNT.open.repo.html',
    styleUrls: ['./CPNT.open.repo.css'],
})
export class CRepoOpen extends Bus implements AfterViewInit {
    name(): string {
        return 'CRepoOpen'
    }
    ngAfterViewInit(): void {
        
    }
    solution = new FormControl('',[solnValidator]);
    item;
    constructor(protected user: UserService, protected bus: BusService, private cdr:ChangeDetectorRef, public ddat: DData) {
        super(bus);
        this.item = ddat['item'];
        this.solution.valueChanges.subscribe(e=>{
            ddat['item']['content'] = e;
        })
        this.solution.setValue(ddat['item']['content'])
        this.item['flag'] = this.item['flag']? this.item['flag'] :'hidden'
    }
    toLocalString(datatime:string){
        try{
            return new Date(datatime).toLocaleString();
        }catch(e){
            return '';
        }
    }
}