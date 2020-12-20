import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CPosts } from './CPNT.post';
import { CReply } from './CPNT.reply';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginatorIntl} from '@angular/material/paginator';
import { DialogModule } from '../dialog/dialog.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { CTags } from './CPNT.tag';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { TableModule } from '../table/table.module';
import { CAttachments } from './CPNT.attachment';
import { CActions } from './CPNT.action';
import { UploaderModule } from '../uploader/uploader.module';
import { MatRadioModule } from '@angular/material/radio';
import { CPlans } from './CPNT.plan';
import { CInstead } from './CPNT.instead';
import { CTextarea } from './CPNT.textarea';
import { CNew } from './CPNT.new';
import { CarouselModule } from '../carousel/carousel.module';
import { CStar } from '../star/CPNT.star';
import { StarModule } from '../star/star.module';
import { CLists } from './CPNT.list';

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
        MatIconModule,
        MatButtonModule,
        FlexLayoutModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatPaginatorModule,
        DialogModule,
        MatExpansionModule,
        MatAutocompleteModule,
        MatChipsModule,
        TableModule,
        UploaderModule,
        MatRadioModule,
        CarouselModule,
        StarModule
    ],
    declarations: [
        CPosts,
        CReply,
        CTags,
        CAttachments,
        CActions,
        CPlans,
        CInstead,
        CTextarea,
        CNew,
        CLists,
    ],
    exports: [
        CPosts,
        CReply,
        CTags,
        CAttachments,
        CActions,
        CPlans,
        CInstead,
        CTextarea,
        CNew,
        CLists
    ],
    providers:[
        { provide: MatPaginatorIntl, useValue: ConfPaginator() },
    ],
    
})
export class PostModule { }