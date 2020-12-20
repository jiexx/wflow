import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IUploaderResult } from 'app/common/uploader/CPNT.uploader';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { UserService } from 'app/common/data/user';


@Component({
    templateUrl: './CPNT.detail.html',
    styleUrls: ['./CPNT.detail.css'],
})
export class CDetail   {
    data;
    myControl = new FormControl();
    constructor(private router: Router, private route: ActivatedRoute, private user: UserService) {

    }
    step;
    num = [1,1,1,1,1,1,1,1,1];
    expanded = true;
    range = new FormGroup({
        start: new FormControl(),
        end: new FormControl()
    });
    selected = 'option1';
}