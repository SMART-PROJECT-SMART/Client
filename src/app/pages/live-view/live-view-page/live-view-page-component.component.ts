import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-live-view-page-component',
  standalone: false,
  templateUrl: './live-view-page-component.component.html',
  styleUrl: './live-view-page-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveViewPageComponent {}
