import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'config/index';
import { DomSanitizer } from '@angular/platform-browser';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';


export interface IInstead {
    id:string; label:string; email:string; tel:string
}

@Component({
    selector: 'instead',
    templateUrl: './CPNT.instead.html',
    styleUrls: ['./CPNT.instead.css'],
})
export class CInstead extends Bus implements AfterViewInit  {
    name(): string {
        return  'CInstead';
    }
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    ngAfterViewInit(): void {
    }
    instead = new FormControl('',[]);
    insteads: Observable<{ id: string; name: string; }[]>;
    users = [];
    @Input() model: IInstead = <{id:string, label:string, email:string, tel:string}>{label:' ', email:' ', tel:' '};
    @Output() modelChange: EventEmitter<IInstead> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    insteadFocus(){
        if(this.users.length < 1){
            this.user.getUsers().then(users=>{
                this.users = users.map(e=>({id:e.id, name:e.name}));
                this.insteads = this.instead.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filter(value, this.users))
                );
            })
        }
    }
    insteadSelected($event){
        this.user.check({_id:$event.option.value.id}).then(user=>{
            this.model = user || <{id:string, label:string, email:string, tel:string}>{label:' ', email:' ', tel:' '};
            this.modelChange.emit(this.model);
        })
    }
    _filter(value: string, options: { id: string; name: string; }[]): { id: string; name: string; }[] {
        const filterValue = value['name'] ? value['name'].toLowerCase() : value;
        return options.filter(option => option.name.toLowerCase().includes(filterValue));
    }
    displayWith(instead){
        if(instead){
            return instead.name;
        }
        return ''
    }
}