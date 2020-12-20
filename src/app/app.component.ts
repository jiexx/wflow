import { Component, ChangeDetectorRef, AfterContentChecked, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from './common/data/user';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterContentChecked {
    title = 'roger';
    constructor(public user: UserService, private cdr: ChangeDetectorRef) {

    }
    ngAfterContentChecked() {
        this.cdr.detectChanges();
    }
}
