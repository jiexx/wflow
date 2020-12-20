import { NgModule } from '@angular/core';
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { FlexLayoutModule } from "@angular/flex-layout";
import { CommonModule } from '@angular/common';
import { LayoutRoutingModule } from './layout.main-routings.module';
import { LayoutMain } from './layout.main';
import { CarouselModule } from 'app/common/carousel/carousel.module';
import { CHome } from './component.home/CPNT.home';
import { UploaderModule } from 'app/common/uploader/uploader.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule, MatPaginatorIntl} from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule  } from "@angular/material/card";
import { MatRadioModule } from '@angular/material/radio';
import { CWorks } from './component.works/CPNT.works';
import { CDetail } from './component.detail/CPNT.detail';
import { CStats } from './component.stats/CPNT.stats';
import { CSearch } from './component.search/CPNT.search';
import { CArticle } from './component.article/CPNT.article';
import { CSetting } from './component.setting/CPNT.setting';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { DialogModule } from 'app/common/dialog/dialog.module';
import { MatSortModule } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
//import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { CRepo } from './component.article/CPNT.repo';
import { CRepoOpen } from './component.article/CPNT.open.repo';
import { CRoles } from './component.setting/CPNT.roles';
import { StarModule } from 'app/common/star/star.module';
import { PostModule } from 'app/common/post/post.module';
import { CTree } from 'app/layout.user/component.wflow/CPNT.tree';


const ConfPaginator = () =>{
    const paginatorIntl = new MatPaginatorIntl();
  
    paginatorIntl.itemsPerPageLabel = '每页:';
    paginatorIntl.getRangeLabel = (
      (page, pageSize, length) => {
        if (length == 0 || pageSize == 0) {
          return `0 共 ${length}`;
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        // If the start index exceeds the list length, do not try and fix the end index to the end.
        const endIndex = startIndex < length ?
          Math.min(startIndex + pageSize, length) :
          startIndex + pageSize;
        return `${startIndex + 1} - ${endIndex} 共 ${length}`;
      });
  
    return paginatorIntl;
}
@NgModule({
    imports: [
        CommonModule,
        LayoutRoutingModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule,
        MatToolbarModule,
        FlexLayoutModule,
        CarouselModule,
        UploaderModule,
        MatExpansionModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatDividerModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatTabsModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatStepperModule,
        MatTableModule,
        MatCheckboxModule,
        MatCardModule,
        NgxGraphModule,
        DialogModule,
        MatSortModule,
        MatBadgeModule,
        MatMenuModule,
        StarModule,
        PostModule,
        // FroalaEditorModule.forRoot(), 
        // FroalaViewModule.forRoot()
    ],
    declarations: [
        LayoutMain,
        CHome,
        CWorks,
        CDetail,
        CStats,
        CSearch,
        CArticle,
        CSetting,
        CRepo,
        CRepoOpen,
        CRoles,
    ],
    providers:[
        { provide: MatPaginatorIntl, useValue: ConfPaginator() },
    ],
    
})
export class LayoutMainModule { }