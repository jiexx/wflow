import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { IBus, BusService, IBusMessage, Bus } from 'app/common/bus/bus';
import { enterTransition } from './router.animation';


@Component({
    templateUrl: './layout.user.html',
    styleUrls: ['./layout.user.css'],
    animations: [
        trigger(
            'enterAnimation', [
                transition(':enter', [
                    style({transform: 'translateX(100%)',/*  opacity: 0 */ }),
                    animate('200ms', style({ transform:'translateX(0)', /* opacity: 1  */}))
                ]),
                transition(':leave', [
                    style({transform: 'translateX(0)', /* opacity: 1 */ }),
                    animate('200ms', style({transform: 'translateX(100%)', /* opacity: 0  */}))
                ])
            ]
        )
    ],
})
export class LayoutLogin implements OnDestroy  {
    at = 0;
    constructor(public location: Location, private router: Router, protected bus: BusService) {
    }
    ngOnDestroy(): void {
    }
    logined(){
        return !!localStorage.getItem('logined1');
    }
    back(){
        this.location.back();
    }
}
