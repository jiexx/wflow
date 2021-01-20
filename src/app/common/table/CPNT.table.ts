import { ChangeDetectorRef, Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChildren, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Bus, BusService } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { _storageurl } from 'app/common/config';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { merge, of as observableOf } from 'rxjs';
import { startWith, switchMap, map, catchError } from 'rxjs/operators';


export interface IColumn {
    position: string;
    title: string;
    text ?: boolean;
    html ?: string;
    input ?: {
        type:'txt' | 'password' | 'number';
        appearance:'standard' | 'outline' | 'fill'
    };
    select ?: {
        options:{id:string, name:string}[];
        appearance:'standard' | 'outline' | 'fill'
    };
    sort ?: boolean;
    change ?: boolean;
    remove ?: boolean;
    style ?: (i:number,j:number)=>{[key:string]: string;}
}

@Component({
    selector: 'tabler',
    templateUrl: './CPNT.table.html',
    styleUrls: ['./CPNT.table.css'],
})
export class CTable extends Bus implements AfterViewInit  {
    name(): string {
        return  'CTable';
    }

    ngAfterViewInit(): void {
        if(this.paginators && this.sorts)
        merge(this.paginators.page, this.sorts.sortChange).pipe( 
            switchMap( async () => {
                this.onClick.emit({sort: this.sorts, page: this.paginators})
            }),
            catchError((e) => {
                return observableOf([]);
            })
        )
        console.log('columns i:', JSON.stringify(this.columns));
        
    }
    ngOnChanges(): void {
        if(this.layout == 'horizontal'){
            this.dataSource.data = this.model;
        }else if(this.columns && this.columns.length > 0 && this.model && this.model.length > 0){
            this.dataSource.data = this.columns.map(col => this.formatInRow(col.position, col.title));
            this.rows = ['0'].concat(this.model.map((_,i) => (i+1).toString()));
        }
        this.cdr.detectChanges();
    } 
    formatInRow(row, tilte) {
        const output = {};
    
        output[0] = tilte;
        for (let i = 0; i < this.model.length; ++i) {
            output[i+1] = this.model[i][row];
        }
    
        return output;
    }
    debug(r){
        return JSON.stringify(r);
    }
    rows;
    @Input() columns: IColumn[];
    @Input() layout: 'vertical' | 'horizontal' = 'horizontal';
    @Input() pageLen: number;
    @Input() pageSize: number;
    @Input() model: any[] = [];
    @Output() modelChange: EventEmitter<any[]> = new EventEmitter();
    @Output() onChange: EventEmitter<any> = new EventEmitter();
    @Output() onRemove: EventEmitter<any> = new EventEmitter();
    @Output() onClick: EventEmitter<any> = new EventEmitter();
    @ViewChild(MatSort) sorts: MatSort;
    @ViewChild(MatPaginator) paginators: MatPaginator;
    dataSource = new MatTableDataSource();
    constructor(protected bus: BusService, protected user: UserService, private cdr:ChangeDetectorRef) {
        super(bus);
    }

    colType(col: IColumn, type, row: number){
    }
    displayWith(opt){
        if(opt){
            return opt.name || '';
        }
        return ''
    }
    displayBy(id, options){
        if(id && options){
            let r = options.find(e=>e.id == id);
            if(r){
                return r.name || '';
            }
        }
        return ''
    }
    change(row, i){
        this.modelChange.emit(this.model);
        this.onChange.emit({i:i});
        
    }
    remove(row, i){
        this.model.splice(i,1)
        this.modelChange.emit(this.model);
        this.onRemove.emit(row);
    }
    edit(cell, position, i, j){
        console.log('edit',cell, this.model)
        if(this.layout == 'vertical'){
            this.model[j-1][position] = cell;
        }else if(this.layout == 'horizontal'){
            this.model[i][position] = cell;
        }
        this.modelChange.emit(this.model);
        this.onChange.emit({i:i,j:j});
    }
}