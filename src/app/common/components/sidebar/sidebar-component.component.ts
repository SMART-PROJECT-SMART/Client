import { Component, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import type { NavigationItem } from '../../../models';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar-component.component.html',
  styleUrl: './sidebar-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public readonly navItemClicked = output<void>();

  public readonly navigationItems: NavigationItem[] = [
    { label: 'Assignment', icon: 'assignment', route: '/assignment-page' },
    { label: 'Live View', icon: 'map', route: '/live-view-page' },
    { label: 'Device Management', icon: 'devices', route: '/device-management-page' },
    { label: 'Archive', icon: 'archive', route: '/archive' },
  ];

  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  public onNavItemClick(route: string): void {
    this.router.navigate([route]);
    this.navItemClicked.emit();
  }

  public isActive(route: string): boolean {
    return this.currentUrl() === route;
  }
}
