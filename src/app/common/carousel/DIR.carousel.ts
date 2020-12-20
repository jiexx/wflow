import { Directive, Renderer2, ElementRef, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Directive({
    selector: '[carousel-item]'
})
export class DCarousel {
    constructor(private renderer: Renderer2, private hostElement: ElementRef) {
        //renderer.addClass(hostElement.nativeElement, 'absolute');
        renderer.setStyle(hostElement.nativeElement, 'position', 'absolute')
        renderer.setStyle(hostElement.nativeElement, 'width', 'auto')
        renderer.setStyle(hostElement.nativeElement, 'height', 'auto')
    }
    width(){
        return this.hostElement.nativeElement.clientWidth;
    }
    setWidth(width){
        this.renderer.setStyle(this.hostElement.nativeElement, 'width', width+'px');
        this.duration = Math.ceil(width / 2); 
    }
    duration = 300;
    position = 0;
    setHead(){
        this.position = -this.width();
    }
    setPosition(position){
        //console.log('setPosition', position)
        this.position = position;
        this.renderer.setStyle(this.hostElement.nativeElement, 'transform', `translateX(${this.position}px)`);
        
    }
    animate(a, b){
        return this.hostElement.nativeElement.animate(a, b);
    }
    translate(start, end, gap = 300){
        this.hostElement.nativeElement.animate(
            [
                {transform: `translateX(${start}px)`,zIndex:100},
                {transform: `translateX(${end}px)`,zIndex:100},
            ], 
            /* gap+' 10 cubic-bezier(.17,.67,.83,.67)' */
            {
                duration: gap,
                delay: 0,
                fill: "both",
                easing :'cubic-bezier(.17,.67,.83,.67)'//'ease-in-out'
            }
        ).play();
    }
    swiperight(distance){
        
        let a = this.hostElement.nativeElement.animate(
            [
                {transform: `translateX(${this.position}px)`,zIndex:100},
                {transform: `translateX(${this.position-distance}px)`,zIndex:100},
            ], 
            /* '300 10 cubic-bezier(.17,.67,.83,.67)' */
            {
                duration: this.duration,
                delay: 0,
                fill: "both",
                easing :'cubic-bezier(.17,.67,.83,.67)'//'ease-in-out'
            }
        );
        Observable.create(o=>o.next('done'))
        a.play();
        return Observable.create(o => {
            a.onfinish = ()=>{
                //console.log('<--- position', this.position, this.position - distance)
                this.position -= distance;
                o.next('done');
            }
        });
    }
    swipeleft(distance){
        let a = this.hostElement.nativeElement.animate(
            [
                {transform: `translateX(${this.position}px)`,zIndex:100},
                {transform: `translateX(${this.position+distance}px)`,zIndex:100},
            ], 
            /* '300 10 cubic-bezier(.17,.67,.83,.67)' */
            {
                duration: this.duration,
                delay: 0,
                fill: "both",
                easing :'cubic-bezier(.17,.67,.83,.67)'//'ease-in-out'
            }
        );
        a.play();
        return Observable.create(o => {
            a.onfinish = ()=>{
                //console.log('---> position', this.position, this.position + distance)
                this.position += distance;
                o.next('done');
            }
        });
    }

}