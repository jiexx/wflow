import { ChangeDetectorRef, Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';
import { routerTransition } from './router.animation';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Bus, BusService, IBusMessage } from 'app/common/bus/bus';
import { UserService } from 'app/common/data/user';

@Component({
    templateUrl: './layout.main.html',
    styleUrls: ['./layout.main.css'],
    animations: [ routerTransition ]
})
export class LayoutMain extends Bus implements OnDestroy  {
    name(): string {
        return 'LayoutMain';
    }
    num = '';
    counter = [];
    onUpdate(msg: IBusMessage){
        let d =  msg.data as any
        this.counter = d.counter;
        this.num = d.num;
    }
    
    mobileQuery: MediaQueryList;
    private _mobileQueryListener: () => void;
    at = 0;
    avatar = null;
    privileges = null;
    constructor(private router: Router, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, public location: Location, public bus: BusService, private user : UserService) {
        super(bus);
        this.mobileQuery = media.matchMedia('(max-width: 600px)');
        this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        this.mobileQuery.addListener(this._mobileQueryListener);
        this.user.getUser().then((u:any) =>{
            this.avatar = u.avatar;
            this.privileges = !u.privileges ? 0 : u.privileges;
        });
    }
    ngOnDestroy(): void {
        this.mobileQuery.removeListener(this._mobileQueryListener);
    }
    isDarkThemeActive = false;
    prepareRoute(outlet: RouterOutlet) {
        const anim = outlet.activatedRouteData['state'] || {};
        return anim || null; 
    } 
    logout(){
        localStorage.removeItem('logined1');
        this.router.navigate(['/user/login']);
    }
}
