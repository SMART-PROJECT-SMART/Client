import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AssignmentPageComponentComponent } from './components/assignment-page-component/assignment-page-component.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'assignment-page', component: AssignmentPageComponentComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
