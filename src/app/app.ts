import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { ClientConstants } from './common';

const { SidebarConstants } = ClientConstants;

const PAGE_TITLES: Record<string, string> = {
  '/assignment-page': 'Assignment',
  '/live-view-page': 'Live View',
  '/device-management-page': 'Device Management',
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  public readonly logoPath: string = SidebarConstants.LOGO_PATH;

  private readonly router = inject(Router);

  public readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => PAGE_TITLES[this.router.url] ?? 'SMART'),
    ),
    { initialValue: PAGE_TITLES[this.router.url] ?? 'SMART' },
  );
}
