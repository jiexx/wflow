import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'config/index';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';

export interface IAction {
    which: {
        id: string;
        name: string;
    } | any;
    rating: number;
    reject: boolean;
    forward: {
        id: string;
        name: string;
    }
}

@Component({
    selector: 'actions',
    templateUrl: './CPNT.action.html',
    styleUrls: ['./CPNT.action.css'],
})
export class CActions extends Bus implements AfterViewInit  {
    name(): string {
        return  'CActions';
    }

    ngAfterViewInit(): void {
        this.forwardOptions = this.forward.valueChanges.pipe(
            startWith(''),
            map(value => this.forwardOptionsFilter(value, this.users))
        );
        if(this.id){
            this.user.getSchedulePage({data:{schedid:this.id},limit:10,skip:0,state:['cim']}).then(data=>{
                if(data && data.page){
                    let list = Object.values(data.page);
                    if(list.length > 0 && list[0].length > 0){
                        let d: any  = list[0][0];
                        this.actions = d.actions;
                        this.forwards = d.roles;
                    }
                }
            });
        }
        this.forward.valueChanges.subscribe(e=>{
            console.log(e);
            this.model.forward = e;
            if(this.modelChange){
                this.modelChange.emit(this.model);
            }
        })
    }
    @Input() actions: any [] = [];
    @Input() forwards: any [] = [];
    @Input() id: string = null;
    @Input() state: 'I' | 'V' | 'E' | 'C' | 'X' = 'I';
    @Input() model: IAction = {
        which: null,
        rating: 3,
        reject: false,
        forward: null
    };
    @Output() modelChange: EventEmitter<IAction> = new EventEmitter();
    @ViewChild('trigger') trigger: MatAutocompleteTrigger;
    forward = new FormControl('',[]);
    forwardOptions: Observable<{ id: string; name: string; }[]>;
    users: {id: string, name: string}[] = [];
    constructor(protected bus: BusService, protected user: UserService,) {
        super(bus);
        
    }
    ratingClick(e){
        this.model.rating = e.rating;
        this.modelChange.emit(this.model);
    }
    rejectChange(){
        this.model.reject = this.model.which != 'Verified';
        this.modelChange.emit(this.model);
    }
    whichChange(){
        this.modelChange.emit(this.model);
    }
    
    forwardFocus(){
        console.log(1)
        if(this.model.which && this.model.which.id && this.forwards){
            let fw = this.forwards[this.model.which.id];
            if(fw && this.users.length < 1){
                this.user.getUsers(null, null, fw.id+'').then(users=>{
                    this.users = users.map(e=>({id:e.id, name:e.name}));
                    this.trigger._onChange("");
                    this.trigger.openPanel();
                })
            }
        }
    }
    forwardOptionsFilter(value: string, options: { id: string; name: string; }[]): { id: string; name: string; }[] {
        const filterValue = value['name'] ? value['name'].toLowerCase() : value;
        return options.filter(option => option.name.toLowerCase().includes(filterValue));
    }
    displayWith(forward){
        if(forward){
            return forward.name;
        }
        return ''
    }
}