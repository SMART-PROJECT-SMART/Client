import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App {
  public readonly isSidebarExpanded = signal<boolean>(false);

  public onSidebarExpansionChange(isExpanded: boolean): void {
    this.isSidebarExpanded.set(isExpanded);
  }
}
