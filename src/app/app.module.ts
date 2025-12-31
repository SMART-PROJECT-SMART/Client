import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { MissionComponentComponent } from './components/mission-component/mission-component.component';
import { MatModule } from './modules/mat.module';
import { AssignmentPageComponentComponent } from './components/assignment-page-component/assignment-page-component.component';
import { AssignmentManagementComponent } from './components/assignment-management-component/assignment-management-component';
import { AssignmentReviewComponent } from './components/assignment-review-component/assignment-review-component';

@NgModule({
  declarations: [App, MissionComponentComponent, AssignmentPageComponentComponent, AssignmentManagementComponent, AssignmentReviewComponent],
  imports: [BrowserModule, AppRoutingModule, MatModule, ReactiveFormsModule],
  providers: [provideBrowserGlobalErrorListeners(), provideAnimationsAsync(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
