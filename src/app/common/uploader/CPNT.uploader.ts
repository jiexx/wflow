import { Component, ContentChildren, Input, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, AfterViewInit, Output, HostListener } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Projection } from '../projection';

export interface IUploaderResult {
    _base64imgs : string;
    index ?: number;
    name ?: string;
};
interface ICallbackData {
    once ?: IUploaderResult;
    helper ?: { _num : number, _total : number, _this : CUploader};
    result ?: IUploaderResult[];
};
interface ICallback {
    ( data: ICallbackData );
};
@Component({
    selector: 'uploader',
    template:
        `<canvas #drawer  class="absolute" [ngStyle]="{'width':width,'height':height,'border-radius':radius,'visibility':visibility}"></canvas>
        <input *ngIf="multiple" class="absolute" type="file"  multiple #uploader (change)="onChange(uploader.files)" accept="{{type}}" />
        <input *ngIf="!multiple" class="absolute" type="file" #uploader (change)="onChange(uploader.files)" accept="{{type}}" />`,
    styles: [
        `input {
            opacity:0;
            cursor:pointer;
        }`
    ]
})
export class CUploader implements AfterViewInit {
    @Input() visibility = 'visible';
    @Input() radius = 0;
    @Input() height = 300;
    @Input() width = 300;
    @Input() autoSize = false;
    @Input() multiple = true;
    @Input() max = 5;
    @Input() type = '.png,.jpeg,.jpg,.gif,.bmp';
    @Output() onComplete: EventEmitter<IUploaderResult[]> = new EventEmitter();
    @ViewChild('uploader') uploader: ElementRef<HTMLInputElement>;
    @ViewChild('drawer') drawer: ElementRef<HTMLCanvasElement>;
    constructor() {
        
    }
    @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
      
        this.onChange(evt.dataTransfer.files)
    }
    ngAfterViewInit(){
        this.drawer.nativeElement.width = this.width != 300 ? this.width : this.drawer.nativeElement.offsetWidth;
        this.drawer.nativeElement.height = this.height != 300 ? this.height : this.drawer.nativeElement.offsetHeight;
    }

    draw(image : HTMLImageElement, canvas: HTMLCanvasElement) {
        if(this.autoSize){
            canvas.width = image.width;
            canvas.height = image.height;
        }
        let context2d = canvas.getContext('2d');
        let tf = new Projection(
            { x : image.width, y : image.height },
            { x : canvas.width, y : canvas.height },
            this.autoSize ? 'auto' : 'contain', 
            { x : 0, y : 0}
        ).transform();
        let w = (tf.o2.x - tf.o1.x);
        let h = (tf.o2.y - tf.o1.y);

        context2d.fillStyle="#ffffff";
        context2d.clearRect(0, 0, canvas.width, canvas.height);
        context2d.fillRect(0, 0, canvas.width, canvas.height);
        context2d.drawImage(image, (canvas.width - w) / 2.0, (canvas.height - w) / 2.0, w, h);
    }
    

    save(hex: string, callback: ICallback, data : ICallbackData){
        let img = new Image();
        img.src = hex;
        img.onload = () => {
            this.draw(img, this.drawer.nativeElement);
            if(callback) {
                data.once._base64imgs = this.drawer.nativeElement.toDataURL("image/jpeg");
                callback( data );
            }
        }
    }

    readImage(file : File, callback : ICallback, data : ICallbackData){
        let reader = new FileReader();
            
        reader.onloadend = (ev : any) =>{
            this.save(ev.target.result, callback, data);
        }
        reader.readAsDataURL(file);
    }
    readText(file : File, callback : ICallback, data : ICallbackData){
        let reader = new FileReader();
            
        reader.onloadend = (ev : any) =>{
            data.once._base64imgs = ev.target.result
            callback( data );
        }
        reader.readAsText(file);
    }
    readBinary(file : File, callback : ICallback, data : ICallbackData){
        let reader = new FileReader();
            
        reader.onloadend = (ev : any) =>{
            data.once._base64imgs = ev.target.result
            callback( data );
        }
        reader.readAsDataURL(file);
    }
    readRaw(file : File, callback : ICallback, data : ICallbackData){
        let reader = new FileReader();
            
        reader.onloadend = (ev : any) =>{
            data.once._base64imgs = ev.target.result
            callback( data );
        }
        reader.readAsBinaryString(file);
    }
    _assert( f : File){
        return !f || !f.type
    }
    isImage( f : File){
        return '.png,.jpeg,.jpg,.gif,.bmp'.includes(f.name) || f.type.includes('image')
    }
    isText( f : File){
        return '.txt,.csv,.json'.includes(f.name.substr(f.name.lastIndexOf('.')))
    }
    isBinary( f : File){
        return '.pdf,.doc,.docx,.zip,.rar'.includes(f.name.substr(f.name.lastIndexOf('.')))
    }
    isRaw( f : File){
        return '.xlsx'.includes(f.name.substr(f.name.lastIndexOf('.')))
    }
    onChange( files : FileList ){
        if(files.length > this.max) {
            return false;
        }
        let helper = { _num : 0, _total : files.length, _this : this };
        let res = [];
        for(let i = 0; i < files.length && !this._assert(files[i]); i ++) {
            if(this.isImage(files[i])){
                this.readImage(files[i], this.onFinish, { helper : helper, result : res, once : {_base64imgs: null, index:i, name:files[i].name} });
            }else if(this.isText(files[i])){
                this.readText(files[i], this.onFinish, { helper : helper, result : res, once : {_base64imgs: null, index:i, name:files[i].name} });
            }else if(this.isBinary(files[i])){
                this.readBinary(files[i], this.onFinish, { helper : helper, result : res, once : {_base64imgs: null, index:i, name:files[i].name} });
            }else if(this.isRaw(files[i])){
                this.readRaw(files[i], this.onFinish, { helper : helper, result : res, once : {_base64imgs: null, index:i, name:files[i].name} });
            }
        }
    }
    onFinish( data : ICallbackData ){
        data.helper._num ++;
        data.result.push(data.once);
        //console.log('base64img', data.once._base64imgs.length, data.once.index, data.helper._num);
        if( data.helper._this.onComplete && data.helper._num >= data.helper._total) {
            data.helper._this.onComplete.emit( data.result );
        }
    }
}