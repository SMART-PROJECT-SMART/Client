import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { MissionComponentComponent } from './components/mission-component/mission-component.component';
import { MatModule } from './modules/mat.module';

@NgModule({
  declarations: [App, MissionComponentComponent],
  imports: [BrowserModule, AppRoutingModule, MatModule, ReactiveFormsModule],
  providers: [provideBrowserGlobalErrorListeners(), provideAnimationsAsync()],
  bootstrap: [App],
})
export class AppModule {}
