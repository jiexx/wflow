import { trigger, animate, style, group, query, transition, animateChild, AnimationMetadata } from '@angular/animations';

const rtl: AnimationMetadata[] = [
    /* order */
    /* 1 */ query(':enter, :leave', style({position: 'fixed'/* , width: '100%' */})
        , {optional: true}),
    /* 2 */ group([  // block executes in parallel
        query(':enter', [
            style({transform: 'translateX(100%)'}),
            animate('300ms ease-in-out', style({transform: 'translateX(0%)'}))
        ], {optional: true}),
        query(':leave', [
            style({transform: 'translateX(0%)'}),
            animate('300ms ease-in-out', style({transform: 'translateX(-150%)'}))
        ], {optional: true}),
    ])
];
const ltr: AnimationMetadata[] = [
    /* order */
    /* 1 */ query(':enter, :leave', style({position: 'fixed'/* , width: '100%' */})
        , {optional: true}),
    /* 2 */ group([  // block executes in parallel
        query(':enter', [
            style({transform: 'translateX(-100%)'}),
            animate('300ms ease-in-out', style({transform: 'translateX(0%)'}))
        ], {optional: true}),
        query(':leave', [
            style({transform: 'translateX(0%)'}),
            animate('300ms ease-in-out', style({transform: 'translateX(150%)'}))
        ], {optional: true}),
    ])
];

export const routerTransition = trigger('routerTransition', [
    transition('p1 => *', rtl),
    transition('p2 => p1', ltr),
    transition('p2 => *', rtl),
    transition('p3 => p2', ltr),
    transition('p3 => p1', ltr),
    transition('p3 => p5', rtl),
    transition('p3 => p6', rtl),
    transition('p5 => p6', rtl),
    transition('p5 => *', ltr),
    transition('p6 => *', ltr)
]);

trigger('routerTransition', [
    transition(':decrement', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' })
            , { optional: true }),
        group([
            query(':enter', [
                style({ transform: 'translateX(-100%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))
            ], { optional: true }),
            query(':leave', [
                style({ transform: 'translateX(0%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(100%)' }))
            ], { optional: true }),
        ])
    ]),
    transition(':increment', [
        group([
            query(':enter, :leave', style({ position: 'fixed', width: '100%' })
                , { optional: true }),
            query(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' }))
            ], { optional: true }),
            query(':leave', [
                style({ transform: 'translateX(0%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(-100%)' }))
            ], { optional: true }),
        ])
    ])
])