import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginatorIntl} from '@angular/material/paginator';
import { DialogModule } from '../dialog/dialog.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { CTable } from './CPNT.table';

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
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatPaginatorModule,
        DialogModule,
        MatAutocompleteModule,
        MatTableModule,
    ],
    declarations: [
        CTable
    ],
    exports: [
        CTable
    ],
    providers:[
        { provide: MatPaginatorIntl, useValue: ConfPaginator() },
    ],
    
})
export class TableModule { }