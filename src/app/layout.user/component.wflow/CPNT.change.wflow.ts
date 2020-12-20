import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BusService, Bus } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { DData } from 'app/common/dialog/CPNT.ddlg';
import { startWith, map } from 'rxjs/operators';

const solnValidator = (control: FormControl):{[key:string]: boolean | string} =>{
    if(!control.value) {
        return {invalid: true, msg: '不能为空'};
    }
}
@Component({
    selector: 'change-wflow',
    templateUrl: './CPNT.change.wflow.html',
    styleUrls: ['./CPNT.change.wflow.css'],
})
export class CChangeWflow extends Bus implements AfterViewInit {
    name(): string {
        return 'CChangeWflow'
    } 
    ngAfterViewInit(): void {
    }
    checkedChange(){
        if(this.ddat['appendix']){
            this.ddat['appendix']['valid'] = this.checked;
        }
    }
    privChange(){
        if(this.ddat['appendix']){
            this.ddat['appendix']['obj']['privilege'] = this.priv ? 'stop' : '';
        }
    }
    opts;
    options;
    checked = true;
    disabled = false;
    priv = false;
    exp = new FormControl('2',[]);
    obj = new FormControl('',[solnValidator]);
    target = new FormControl('',[solnValidator]);
    whatChanged : 'node' | 'tmpl' | 'action';
    constructor(protected user: UserService, protected bus: BusService, private cdr:ChangeDetectorRef, public ddat: DData) {
        super(bus);
        if(ddat['appendix']){
            this.checked = ddat['appendix']['valid'];
            this.obj.setValue(ddat['appendix']['obj']);
            this.obj.valueChanges.subscribe(e=>{
                ddat['appendix']['obj'] = e;
            })
            this.exp.setValue(ddat['appendix']['obj']['expire']+'');
            this.exp.valueChanges.subscribe(e=>{
                ddat['appendix']['obj']['expire'] = e+'';
            })
            this.priv = (ddat['appendix']['obj']['privilege'] == 'stop' ? true : false);
            
            this.opts = this.obj.valueChanges.pipe(
                startWith(''),
                map(value => this._filter(value, this.ddat['appendix']['opts']))
            );
            
            this.target.setValue(ddat['appendix']['target']);
            this.target.valueChanges.subscribe(e=>{
                ddat['appendix']['target'] = e
            })
            this.options = this.target.valueChanges.pipe(
                startWith(''),
                map(value => this._filter(value, this.ddat['appendix']['options']))
            );
            if(!!ddat['appendix']['target']){
                this.whatChanged = 'action';
            }else if(!!ddat['appendix']['opts']){
                this.whatChanged = 'node';
            }else{
                this.whatChanged = 'tmpl';
            }
        }
    }
    nodeSelect(e){
        this.obj.setValue(e)
    }
    displayWith(opt){
        return opt ? opt.name : '';
    }
    compareWith(o1, o2){
        return o1.id == o2.id;
    }
    private _filter(value: string, options: { id: string; name: string; }[]): { id: string; name: string; }[] {
        const filterValue = {}.toString.call(value) === "[object String]" ? value.toLowerCase() : '';
        return options && options.filter(option => option.name.toLowerCase().includes(filterValue));
    }
    actions = [
        '提交',
        '转交',
        '解决',
        '通过',
        '拒绝',
        '退回'
    ]
}