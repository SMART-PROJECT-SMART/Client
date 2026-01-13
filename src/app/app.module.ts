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
import { HomePageComponent } from './pages/home/home-page/home-page-component.component';
import { LiveViewPageComponent } from './pages/live-view/live-view-page/live-view-page-component.component';
import { CesiumViewer } from './pages/live-view/components/cesium-viewer/cesium-viewer.component';
import { SidebarComponent } from './common/components/sidebar/sidebar-component.component';
import { AssignmentPageComponentComponent } from './pages/assignment/assignment-page/assignment-page-component.component';

@NgModule({
  declarations: [
    App,
    MissionComponentComponent,
    AssignmentPageComponentComponent,
    AssignmentManagementComponent,
    AssignmentReviewComponent,
    SidebarComponent,
    HomePageComponent,
    LiveViewPageComponent,
    CesiumViewer,
  ],
  imports: [BrowserModule, AppRoutingModule, MatModule, ReactiveFormsModule],
  providers: [provideBrowserGlobalErrorListeners(), provideAnimationsAsync(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
