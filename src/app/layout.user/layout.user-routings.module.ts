import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CLogin } from './component.login/CPNT.login';
import { CProfile } from './component.profile/CPNT.profile';
import { CWFlow } from './component.wflow/CPNT.wflow';
import { CUsers } from './component.setting/CPNT.users';

const routes: Routes = [
    {
        path: 'login',
        component: CLogin
    },
    {
        path: 'profile',
        component: CProfile
    },
    {
        path: 'wf',
        component: CWFlow
    },
    {
        path: 'users',
        component: CUsers
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [RouterModule],
})
export class LayoutRoutingModule { }