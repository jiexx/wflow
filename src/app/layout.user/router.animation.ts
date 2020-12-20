import { trigger, animate, style, group, query, transition, animateChild, AnimationMetadata } from '@angular/animations';

export const enterTransition =

trigger('enterTransition', [
    transition(':enter', [
        /* query(':enter, :leave', style({ position: 'fixed', width: '100%' })
            , { optional: true }), */
        style({transform: 'translateX(100%)',/*  opacity: 0 */ }),
        animate('200ms', style({ transform:'translateX(0)', /* opacity: 1  */}))
    ]),
    transition(':leave', [
        /* query(':enter, :leave', style({ position: 'fixed', width: '100%' })
            , { optional: true }), */
        style({transform: 'translateX(0)', /* opacity: 1 */ }),
        animate('200ms', style({transform: 'translateX(100%)', /* opacity: 0  */}))
    ]),
])