import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CHome } from './component.home/CPNT.home';
import { CWorks } from './component.works/CPNT.works';
import { CDetail } from './component.detail/CPNT.detail';
import { CStats } from './component.stats/CPNT.stats';
import { CSearch } from './component.search/CPNT.search';
import { CArticle } from './component.article/CPNT.article';
import { CSetting } from './component.setting/CPNT.setting';
import { CRepo } from './component.article/CPNT.repo';
import { CRoles } from './component.setting/CPNT.roles';

const routes: Routes = [
    {
        path: 'home',
        component: CHome,
        data: { state: 'p1' }
    },
    {
        path: 'work',
        component: CWorks,
        data: { state: 'p2' }
    },
    {
        path: 'detail',
        component: CDetail,
        data: { state: 'p2' }
    },
    {
        path: 'stats',
        component: CStats,
        data: { state: 'p3' }
    },
    {
        path: 'search',
        component: CSearch,
        data: { state: 'p5' }
    },
    {
        path: 'article',
        component: CArticle,
        data: { state: 'p3' }
    },
    {
        path: 'setting',
        component: CSetting,
        data: { state: 'p6' }
    },
    {
        path: 'repo',
        component: CRepo,
        data: { state: 'p6' }
    },
    {
        path: 'roles',
        component: CRoles,
        data: { state: 'p6' }
    },
    {
        path: '',
        redirectTo: 'home',
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