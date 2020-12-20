import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, AfterViewInit, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BusService, Bus, IBusMessage } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { DData } from 'app/common/dialog/CPNT.ddlg';
import { FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';

interface RoleNode {
    id: string;
    name: string;
    fullname?: string;
    children?: RoleNode[];
}

const findRoot = (root, name) => {
    if(root.length > 0) {
        let r = root.find(e=>e.name == name);
        if(!r) {
            for(let i = 0 ; i < root.length ; i ++) {
                r = findRoot(root[i].children, name);
                if(r){
                    break;
                }
            }
            return r;
        }
        return r;
    }
    return null
}
const findRootById = (root, id) => {
    if(root.length > 0) {
        let r = root.find(e=>e.id == id);
        if(!r) {
            for(let i = 0 ; i < root.length ; i ++) {
                r = findRootById(root[i].children, id);
                if(r){
                    break;
                }
            }
            return r;
        }
        return r;
    }
    return null
}
const getLeaf = (root, names) => {
    if(root.length > 0) {
        let r = null;
        for(let i = names.length - 1 ; i >= 0 ; i --){
            r = root.find(e=>e.name == names[i]);
            if(r) {
                root = r.children;
            }else {
                return null;
            }
        }
        return r;
    }
    return null;
}
const encId = (id)=>{
    return (BASE + parseInt(id))+''
}
const decId = (id)=>{
    return parseInt(id) > BASE ? (parseInt(id) - BASE)+'': id;
}
interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
}
export const BASE = 10000000;
/**
 * @title Tree with flat nodes
 */
@Component({
    selector: 'treer',
    templateUrl: 'CPNT.tree.html',
    styleUrls: ['CPNT.tree.css'],
})
export class CTree extends Bus implements AfterViewInit{
    name(): string {
        return 'CTree';
    }
    private _transformer = (node: RoleNode, level: number) => {
        return {
            expandable: !!node.children && node.children.length > 0,
            name: node.name,
            level: level,
            id: node.id,
            canSelect: this.onlySelectLeaf ?  node.children.length == 0 : node.children.length == 0 || node.children.every(e=>e.children.length==0),
            fullname: node.fullname
        };
    }

    treeControl = new FlatTreeControl<FlatNode>(
        node => node.level, node => node.expandable);

    treeFlattener = new MatTreeFlattener(
        this._transformer, node => node.level, node => node.expandable, node => node.children);

    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    selected = null;
    @Input() onlySelectLeaf = true;
    @Output() modelChange: EventEmitter<any> = new EventEmitter();
    constructor(protected bus: BusService, protected user: UserService, private cdr:ChangeDetectorRef, public ddat : DData) {
        super(bus);
        console.log('create')
        
        this.user.getRoles().then(roles=>{
            let root = this.buildDeptTree(roles);
            this.user.getUsers().then(users =>{
                this.users = users;
                this.userOpts = this.usr.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filter(value, this.users))
                );
                
                users.forEach(e=>{
                    if(e.roles){
                        (e.roles+'').split(',').forEach(role =>{
                            let r = findRootById(root, role)
                            if(r){
                                r.children.push({id:encId(e.id), name:e.name, children:[]});
                            }else {
                                console.log('root id not found', e.id);
                            }
                        })
                    }else {
                        console.log('roles   not found', e.id);
                    }
                })
                this.dataSource.data = root;
                this.root = root[0].children;
                this.rootOpts = this.rt.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filter(value, this.root))
                );
                this.rt.valueChanges.subscribe(e=>{
                    if(e && e.children){
                        this.roles = e.children;
                        this.roleOpts = this.role.valueChanges.pipe(
                            startWith(''),
                            map(value => this._filter(value, this.roles))
                        );
                    }else{
                        this.roleOpts = null;
                    }
                })
                this.role.valueChanges.subscribe(e=>{
                    if(e && e.children){
                        this.userOpts = this.usr.valueChanges.pipe(
                            startWith(''),
                            map(value => this._filter(value, e.children))
                        );
                    }else {
                        this.userOpts = this.usr.valueChanges.pipe(
                            startWith(''),
                            map(value => this._filter(value, this.users))
                        );
                    }
                })
                
            })
        })
    }

    buildDeptTree(roles){
        let dept = roles.filter(e => parseInt(e.id)<BASE);
        let root = [];
        dept = dept.sort((a, b) => a.name.split('-').length - b.name.split('-').length);
        dept.forEach(e => {
            let loc = e.name.split('-');
            if(loc.length == 1) {
                root.push({...e, ...{children:[]}});
            }else {
                let r = findRoot(root, loc[loc.length-1])
                if(r){
                    if(loc.length == 2) {
                        r.children.push({...e, ...{name: loc[0], fullname:e.name }, ...{children:[]}});
                    }else {
                        let leaf = getLeaf(r.children, loc.filter((_,i)=>i!=0 && i!=loc.length-1))
                        if(leaf){
                            leaf.children.push({...e, ...{name: loc[0], fullname:e.name}, ...{children:[]}});
                        }else{
                            console.log('leaf not found', e.name);
                        }
                    }
                }else{
                    console.log('root not found', e.name);
                }
            }
        });
        return root;
    }
    onSelect(node){
        this.selected = node;
        if(node.canSelect){
            if(this.ddat['component']) {
                this.bus.send(this.ddat['component'], <IBusMessage>{command: 'onSelect', data:{id:decId(node.id), name:node.fullname || node.name}})
            }
            if(this.onlySelectLeaf){
                let id = decId(node.id);
                this.modelChange.emit({id:id, name:node.fullname || node.name});
                if(this.ddat && this.ddat['appendix']){
                    this.ddat['appendix'] = {id:id, name:node.fullname || node.name};
                }
            }else{
                this.modelChange.emit({id:node.id, name:node.fullname || node.name});
            }
        }
    }
    hasChild = (_: number, node: FlatNode) => node.expandable;
    
    ngAfterViewInit(): void {
    }
    root;
    rootOpts;
    rt = new FormControl('', []);
    userOpts;
    users;
    usr = new FormControl('', []);
    roleOpts;
    roles;
    role = new FormControl('', [this.roleValidator]);
    roleValidator(control: FormControl):{[key:string]: boolean | string}{
        if(!control.value ) {
            return {invalid: true, msg: '请先选分公司'};
        }
    }
    
    _filter(value: string, options: { id: string; name: string; }[]): { id: string; name: string; }[] {
        const filterValue = value['name'] ? value['name'].toLowerCase() : value;
        return options && options.length > 0 ? options.filter(option => option.name.toLowerCase().includes(filterValue)) : [];
    }
    displayWith(opt){
        return opt ? opt.name : '';
    }
    optionSelect(e){
        let node = this.users.filter(user => user.id == decId(e.option.value.id));
        if(!node || node.length != 1){
            return null;
        }
        node = node[0];
        if(this.ddat['component']) {
            this.bus.send(this.ddat['component'], <IBusMessage>{command: 'onSelect', data:{id:node.id, name:node.fullname || node.name}})
        }
        if(this.onlySelectLeaf){
            let id = (node.id);
            this.modelChange.emit({id:id, name:node.fullname || node.name});
            if(this.ddat && this.ddat['appendix']){
                this.ddat['appendix'] = {id:id, name:node.fullname || node.name};
            }
        }else{
            this.modelChange.emit({id:node.id, name:node.fullname || node.name});
        }
    }
}