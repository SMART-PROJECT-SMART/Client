import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { MatModule } from './modules/mat.module';

import { AssignmentManagementComponent } from './pages/assignment/components/assignment-management/assignment-management-component.component';
import { AssignmentReviewComponent } from './pages/assignment/components/assignment-review/assignment-review-component.component';
import { MissionComponentComponent } from './pages/assignment/components/mission/mission-component.component';
import { MissionCreateDialogComponent } from './pages/assignment/components/mission-create-dialog/mission-create-dialog.component';
import { MissionEditDialogComponent } from './pages/assignment/components/mission-edit-dialog/mission-edit-dialog.component';
import { MissionSummaryDialogComponent } from './pages/assignment/components/mission-summary-dialog/mission-summary-dialog.component';
import { LiveViewPageComponent } from './pages/live-view/live-view-page/live-view-page-component.component';
import { CesiumViewer } from './pages/live-view/components/cesium-viewer/cesium-viewer.component';
import { SidebarComponent } from './common/components/sidebar/sidebar-component.component';
import { AssignmentPageComponentComponent } from './pages/assignment/assignment-page/assignment-page-component.component';
import { UavSelectionComponentComponent } from './pages/live-view/components/uav-selection-component/uav-selection-component.component';
import { UavOptionComponentComponent } from './pages/live-view/components/uav-option-component/uav-option-component.component';
import { DeviceManagementPageComponent } from './pages/device-management-page/device-management-page.component';
import { ArchivePageComponent } from './pages/archive/archive-page/archive-page.component';
import { UavTableComponent } from './pages/device-management-page/components/uav-table/uav-table.component';
import { SleeveTableComponent } from './pages/device-management-page/components/sleeve-table/sleeve-table.component';
import { UAVDialogComponent } from './pages/device-management-page/components/uavdialog/uavdialog.component';
import { SleeveDialogComponent } from './pages/device-management-page/components/sleeve-dialog/sleeve-dialog.component';
import { DeleteConfirmationDialogComponent } from './pages/device-management-page/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { NumericInputDirective } from './common/directives/numeric-input.directive';
import { TimeInputDirective } from './common/directives/time-input.directive';
import { ArchiveDiffDialogComponent } from './pages/archive/components/archive-diff-dialog/archive-diff-dialog.component';
import { ArchiveFilterDialogComponent } from './pages/archive/components/archive-filter-dialog/archive-filter-dialog.component';
import { ActiveMissionsTableComponent } from './pages/archive/components/active-missions-table/active-missions-table.component';

@NgModule({
  declarations: [
    App,
    MissionComponentComponent,
    MissionCreateDialogComponent,
    MissionEditDialogComponent,
    MissionSummaryDialogComponent,
    AssignmentPageComponentComponent,
    AssignmentManagementComponent,
    AssignmentReviewComponent,
    SidebarComponent,
    LiveViewPageComponent,
    CesiumViewer,
    UavSelectionComponentComponent,
    UavOptionComponentComponent,
    DeviceManagementPageComponent,
    UavTableComponent,
    SleeveTableComponent,
    UAVDialogComponent,
    SleeveDialogComponent,
    DeleteConfirmationDialogComponent,
    ArchivePageComponent,
    ArchiveDiffDialogComponent,
    ArchiveFilterDialogComponent,
    ActiveMissionsTableComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatModule,
    ReactiveFormsModule,
    NumericInputDirective,
    TimeInputDirective,
  ],
  providers: [provideBrowserGlobalErrorListeners(), provideAnimationsAsync(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
