import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutMain } from './layout.main/layout.main';
import { LayoutLogin } from './layout.user/layout.user';

const routes: Routes = [
    {
        path: 'main',
        component: LayoutMain,
        loadChildren: () => import('./layout.main/layout.main.module').then(mod => mod.LayoutMainModule)
    },
    {
        path: 'user',
        component: LayoutLogin,
        loadChildren: () => import('./layout.user/layout.user.module').then(mod => mod.LayoutLoginModule)
    },
    {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full',
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
