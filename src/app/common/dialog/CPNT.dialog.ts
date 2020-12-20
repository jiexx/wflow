import { Component, OnInit, OnDestroy, ViewContainerRef, ViewChild, ComponentFactoryResolver, ComponentRef } from '@angular/core';
import { IDialogMessage, IDialog } from './ITF.dialog';
import { Bus, BusService } from '../bus/bus';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';



@Component({
    selector: 'dlg',
    template: '',
})
export class CDialog extends Bus implements IDialog,  OnInit, OnDestroy  {
    name(): string {
        return 'CDialog';
    }
    ngOnDestroy(): void {
        if (this.contentref) {
            this.contentref.destroy();
        }
    }
    ngOnInit(): void {
        
    }
    contentref: ComponentRef<any>;
    @ViewChild('content', { read: ViewContainerRef }) content: ViewContainerRef;
    constructor(protected bus: BusService, public dialog: MatDialog, private resolver: ComponentFactoryResolver){
        super(bus)
    }
    ref: MatDialogRef<IDialog, any> = null;
    msg: IDialogMessage;
    open(msg: IDialogMessage) {
        if(msg.data.CPNT){
            this.msg = msg;
            this.ref = this.dialog.open(msg.data.CPNT, {width: (msg.data && msg.data.width) ||'auto', height: (msg.data && msg.data.height) || 'auto'});
            this.ref.componentInstance.msg = this.msg;
            this.ref.componentInstance.open(msg);
            const _this = this;
            this.ref.afterClosed().subscribe(result => {
                _this.ref.componentInstance && _this.ref.componentInstance.close();
                _this.dialog.closeAll();
                if(msg.data && msg.data.returnto){
                    _this.bus.send(Object.prototype.toString.call(msg.data.returnto) === "[object String]" ? msg.data.returnto as any : this.msg.data.returnto.name(), { command : _this.msg.data.cb || 'onDlgClose',  data:{action: _this.msg.data.action, appendix: _this.msg.data.appendix}});
                }
                if(msg.data && msg.data.alias){
                    _this.bus.send(msg.data.alias, { command : _this.msg.data.cb || 'onDlgClose',  data:{action: _this.msg.data.action, appendix: _this.msg.data.appendix}});
                }
            });
        }
        // 
        // if(msg.data.CPNT){
        //     const factory = this.resolver.resolveComponentFactory(this.msg.data.CPNT);
        //     this.contentref = this.content.createComponent(factory);
        //     this.contentref.instance.msg = this.msg;
        // }
    }
    close(){
        this.dialog.closeAll();
    }
    
}
