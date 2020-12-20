import { Component, ContentChildren, Input, QueryList, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AnimationBuilder, style, animate, AnimationMetadata, AnimationFactory, group } from '@angular/animations';
import { DCarousel } from './DIR.carousel';
import { merge, combineLatest } from 'rxjs';


@Component({
    selector: 'carousel',
    template:
        `<div #container (swipeleft)="swiperight()" (swiperight)="swipeleft()">
            <ng-content select="[carousel-item]" ></ng-content>   
        </div>`,
    styles: [
        `div {
            position: absolute !important; 
            top:0; bottom:0; left:0; right:0;
            overflow: hidden;
        }`
    ]
})
export class CCarousel implements AfterViewInit {
    @Input() num = 1;
    @Input() marginLeft = 8;
    @Input() height = '0';
    @ViewChild('container') slidesContainer: ElementRef<HTMLDivElement>;
    @ContentChildren(DCarousel) items : QueryList<DCarousel>;
    
    constructor(private renderer:Renderer2, private builder: AnimationBuilder ) {
        
    }
    ngAfterViewInit(){
        this.align();
        //this.slidesIndex = this.slidesContainer.nativeElement.childElementCount-1;
        this.items.changes.subscribe(e=>{
            this.align();
        })
    }
    align(){
        if(this.height != '0'){
            this.slidesContainer.nativeElement.style.height = this.height+'vh';
        }
        let width = 0;
        this.itemWidth = Math.ceil((this.slidesContainer.nativeElement.clientWidth-this.marginLeft)/this.num)
        this.head = 0;
        this.tail = this.items.length > 1 ? this.num : this.items.length - 1;
        this.lastPoistion = this.itemWidth * (this.items.length - 1);
        this.gap = Math.ceil(300*this.marginLeft/this.itemWidth);
        //console.log('--- itemWidth', this.itemWidth)
        this.items.forEach((e,i)=>{
            e.setPosition(width);
            e.setWidth(this.itemWidth);
            width += this.itemWidth;
        });
    }
    private fadeIn(): AnimationFactory {
        return this.builder.build([
            style({ transform: `translateX(0)`}),
            animate('300ms ease-in', 
                style({ transform: 'translateX(0)' })
            ),
        ]);
    }
    private head: number = 0;
    private tail: number = 0;
    private itemWidth: number = 0;
    private lastPoistion: number = 0;
    private gap: number = 0;
    swiperight() {
        //this.items.toArray()[this.tail].setHead();
        combineLatest(this.items.map(e=>e.swiperight(this.itemWidth)))
        .subscribe(e => {
            //console.log('<--- swiperight', this.head, this.tail, this.gap)
            this.items.toArray()[this.head].translate(this.lastPoistion+this.marginLeft, this.lastPoistion, this.gap)
            this.items.toArray()[this.head].setPosition(this.lastPoistion)
            this.head ++;
            this.tail ++;
            if(this.head > this.items.length - 1){
                this.head = 0;
            }
            if(this.tail > this.items.length - 1){
                this.tail = 0;
            }
            //console.log('<--- swiperight', this.head, this.tail)
        })    
    }
    swipeleft() {
        this.items.toArray()[this.tail].setHead()
        combineLatest (this.items.map(e=>e.swipeleft(this.itemWidth)))
        .subscribe(e => {
            //console.log('---> swipeleft', this.head, this.tail)
            this.head --;
            this.tail --;
            if(this.head < 0){
                this.head = this.items.length - 1;
            }
            if(this.tail < 0){
                this.tail = this.items.length - 1;
            }
            //console.log('---> swipeleft', this.head, this.tail)
        }) 
    }



}