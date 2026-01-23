import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  public readonly isSidebarExpanded = signal<boolean>(false);

  public onSidebarExpansionChange(isExpanded: boolean): void {
    this.isSidebarExpanded.set(isExpanded);
  }
}
