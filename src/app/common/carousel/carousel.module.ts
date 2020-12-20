import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CCarousel } from './CPNT.carousel';
import { DCarousel } from './DIR.carousel';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        DCarousel,
        CCarousel,
    ],
    exports: [
        DCarousel, 
        CCarousel,
    ],
    providers:[
        //AuthGuard,
    ],
    
})
export class CarouselModule { }