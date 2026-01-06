import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CesiumService } from '../../services/cesium/cesuim.service';

@Component({
  selector: 'app-cesium-viewer',
  standalone: false,
  templateUrl: './cesium-viewer.html',
  styleUrl: './cesium-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CesiumViewer implements OnInit, OnDestroy {
  public readonly isInitialized = signal<boolean>(false);

  constructor(private readonly cesiumService: CesiumService) {}

  public async ngOnInit(): Promise<void> {
    try {
      await this.cesiumService.initializeViewer('cesium-container');
      this.isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize Cesium viewer:', error);
    }
  }

  public ngOnDestroy(): void {
    this.cesiumService.removeUAV();
  }

  public onZoomToIsrael(): void {
    this.cesiumService.zoomToIsrael();
  }

  public async onUseDefaultImagery(): Promise<void> {
    await this.cesiumService.useDefaultImagery();
  }

  public onUseCustomMap(): void {
    this.cesiumService.useCustomMap();
  }
}
