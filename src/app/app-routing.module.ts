import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page/home-page-component.component';
import { AssignmentPageComponentComponent } from './pages/assignment/assignment-page/assignment-page-component.component';
import { LiveViewPageComponentComponent } from './pages/live-view/live-view-page/live-view-page-component.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'assignment-page', component: AssignmentPageComponentComponent },
  { path: 'live-view-page', component: LiveViewPageComponentComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
