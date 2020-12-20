import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/data/path';
import { DomSanitizer } from '@angular/platform-browser';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocomplete } from '@angular/material/autocomplete';


export interface ITag {
    id: string;
    name: string;
}

@Component({
    selector: 'tags',
    templateUrl: './CPNT.tag.html',
    styleUrls: ['./CPNT.tag.css'],
})
export class CTags extends Bus implements AfterViewInit  {
    name(): string {
        return  'CTags';
    }
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    ngAfterViewInit(): void {
        this.user.getTags().then(wf=>{
            this.tags = wf.map(e=>({id:e._id, name:e.name}));
            this.model = this.tags.filter((e,i)=>i<2);
            if(this.modelChange){
                this.modelChange.emit(this.model);
            }
        })
    }
    tags: ITag[] = [];
    tagctrl = new FormControl('',[]);
    @Input() model: ITag[] = [];
    @Output() modelChange: EventEmitter<ITag[]> = new EventEmitter();
    @ViewChild('auto') matAutocomplete: MatAutocomplete;
    constructor(protected bus: BusService, protected user: UserService, private route: ActivatedRoute, private sanitizer:DomSanitizer) {
        super(bus);
    }
    addTag(event: any): void {
        if (event && event.option && event.option.value) {
            this.model.push(event.option.value);
            if(this.modelChange){
                this.modelChange.emit(this.model);
            }
        }
    }
    rmTag(tagid): void {
        const index = this.model.findIndex(e => e.id == tagid);
        if (index >= 0) {
            this.model.splice(index, 1);
            if(this.modelChange){
                this.modelChange.emit(this.model);
            }
        }
    }

    displayWith(tag){
        if(tag){
            return tag.name;
        }
        return ''
    }
}