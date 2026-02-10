import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
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
  ];

  constructor(private readonly router: Router) {}

  public onNavItemClick(route: string): void {
    this.router.navigate([route]);
    this.navItemClicked.emit();
  }

  public isActive(route: string): boolean {
    return this.router.url === route;
  }
}
