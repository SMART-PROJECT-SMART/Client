import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignmentPageComponentComponent } from './pages/assignment/assignment-page/assignment-page-component.component';
import { LiveViewPageComponent } from './pages/live-view/live-view-page/live-view-page-component.component';
import { DeviceManagementPageComponent } from './pages/device-management-page/device-management-page.component';
import { ArchivePageComponent } from './pages/archive/archive-page/archive-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'assignment-page', pathMatch: 'full' },
  { path: 'assignment-page', component: AssignmentPageComponentComponent },
  { path: 'live-view-page', component: LiveViewPageComponent },
  { path: 'device-management-page', component: DeviceManagementPageComponent },
  { path: 'archive', component: ArchivePageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
