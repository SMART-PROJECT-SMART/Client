import { Component, computed, signal } from '@angular/core';
import { UAVDisplay } from '../../../../models/uav/uavDisplay.model';
import { UAVStoreService } from '../../../../services/uav/uav-store.service';

@Component({
  selector: 'app-uav-selection-component',
  standalone: false,
  templateUrl: './uav-selection-component.component.html',
  styleUrl: './uav-selection-component.component.scss',
})
export class UavSelectionComponentComponent {
  public isCollapsed = signal(false);

  constructor(private readonly uavStore: UAVStoreService) {}

  public uavOptions = computed<UAVDisplay[]>(() => {
    return Array.from(this.uavStore.getActiveTailIds()).map((tailId) => ({
      tailId: tailId,
    }));
  });

  public toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }
}
