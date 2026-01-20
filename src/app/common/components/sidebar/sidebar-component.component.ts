import { Component, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import type { NavigationItem } from '../../../models';
import { ClientConstants } from '../../../common';

const { SidebarConstants } = ClientConstants;

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar-component.component.html',
  styleUrl: './sidebar-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public readonly isExpanded = signal<boolean>(false);
  public readonly expansionChange = output<boolean>();
  public readonly logoPath: string = SidebarConstants.LOGO_PATH;
  public readonly collapsedWidth: number = SidebarConstants.COLLAPSED_WIDTH;
  public readonly expandedWidth: number = SidebarConstants.EXPANDED_WIDTH;

  public readonly navigationItems: NavigationItem[] = [
    {
      label: 'Assignment',
      icon: 'assignment',
      route: '/assignment-page',
    },
    { label: 'Live View', icon: 'map', route: '/live-view-page' },
  ];

  constructor(private readonly router: Router) {}

  public toggleSidebar(): void {
    this.isExpanded.update((value) => !value);
    this.expansionChange.emit(this.isExpanded());
  }

  public navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  public isActive(route: string): boolean {
    return this.router.url === route;
  }
}
