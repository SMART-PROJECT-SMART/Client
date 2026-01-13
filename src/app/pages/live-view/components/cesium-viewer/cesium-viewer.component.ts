import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CesiumService } from '../../../../services/cesium/cesuim.service';
import { LtsSignalRService } from '../../../../services/lts/lts-signalr.service';
import { TelemetryField } from '../../../../common/enums';
import type { TelemetryBroadcastDto, UAVTelemetryData } from '../../../../models';
import type { GeographicPosition } from '../../../../models/cesium';

@Component({
  selector: 'app-cesium-viewer',
  standalone: false,
  templateUrl: './cesium-viewer.html',
  styleUrl: './cesium-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CesiumViewer implements OnInit, OnDestroy {
  public readonly isInitialized = signal<boolean>(false);

  constructor(
    private readonly cesiumService: CesiumService,
    private readonly ltsService: LtsSignalRService
  ) {
    effect(() => {
      const telemetry: TelemetryBroadcastDto | null = this.ltsService.latestTelemetry();
      if (telemetry && this.isInitialized()) {
        this.updateUAVsFromTelemetry(telemetry);
      }
    });
  }

  public async ngOnInit(): Promise<void> {
    try {
      console.log('[Cesium] Initializing Cesium viewer...');
      await this.cesiumService.initializeViewer('cesium-container');
      this.isInitialized.set(true);
      console.log('[Cesium] Cesium viewer initialized');

      this.cesiumService.zoomToIsrael();
      console.log('[Cesium] Zoomed to Israel');

      console.log('[Cesium] Connecting to LTS for all UAVs...');
      await this.ltsService.connectToAllUAVs();
      console.log('[Cesium] Connected to LTS');
    } catch (error) {
      console.error('[Cesium] Failed to initialize Cesium viewer or connect to LTS:', error);
    }
  }

  public async ngOnDestroy(): Promise<void> {
    this.cesiumService.removeAllUAVs();
    await this.ltsService.disconnect();
  }

  private updateUAVsFromTelemetry(telemetry: TelemetryBroadcastDto): void {
    telemetry.uavData.forEach((uavData: UAVTelemetryData) => {
      this.cesiumService.updateUAV(uavData.tailId, uavData);
    });
  }

  private extractPosition(uavData: UAVTelemetryData): GeographicPosition {
    const fields = uavData.fields;
    return {
      latitude: fields[TelemetryField.Latitude] || 0,
      longitude: fields[TelemetryField.Longitude] || 0,
      height: fields[TelemetryField.Altitude] || 0,
    };
  }
}
