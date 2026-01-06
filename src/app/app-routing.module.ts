import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page-component/home-page-component.component';
import { AssignmentPageComponentComponent } from './components/assignment-page-component/assignment-page-component.component';
import { LiveViewPageComponentComponent } from './components/live-view-page-component/live-view-page-component.component';

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
