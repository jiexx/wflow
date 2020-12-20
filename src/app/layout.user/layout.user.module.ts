import { NgModule } from '@angular/core';
import { MatCardModule  } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from "@angular/flex-layout";
import { LayoutRoutingModule } from './layout.user-routings.module';
import { CommonModule } from '@angular/common';
import { CLogin } from './component.login/CPNT.login';
import { LayoutLogin } from './layout.user';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CProfile } from './component.profile/CPNT.profile';
import { UploaderModule } from 'app/common/uploader/uploader.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DialogModule } from 'app/common/dialog/dialog.module';
import { CWFlow } from './component.wflow/CPNT.wflow';
import { CChangeWflow } from './component.wflow/CPNT.change.wflow';
import { CWFlowGroup } from './component.wflow/CPNT.group.wflow';
import { CWFlowFlow } from './component.wflow/CPNT.flow.wflow';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { CTree } from './component.wflow/CPNT.tree';
import { CUsers } from './component.setting/CPNT.users';
import { TableModule } from 'app/common/table/table.module';

@NgModule({
    imports: [
        CommonModule,
        LayoutRoutingModule,
        MatIconModule,
        MatButtonModule,
        MatToolbarModule,
        FlexLayoutModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        UploaderModule,
        MatAutocompleteModule,
        MatStepperModule,
        MatCheckboxModule,
        DialogModule,
        MatTabsModule,
        MatSelectModule,
        MatTreeModule,
        TableModule
    ],
    declarations: [
        LayoutLogin,
        CLogin,
        CProfile,
        CWFlow,
        CUsers,
        CChangeWflow,
        CWFlowGroup,
        CWFlowFlow,
        CTree,
        
    ],
    
    
})
export class LayoutLoginModule { }