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
import type { UAVUpdateData } from '../../../../models/cesium';

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
      console.log('[Cesium] Effect triggered - telemetry:', telemetry, 'isInitialized:', this.isInitialized());
      if (telemetry && this.isInitialized()) {
        console.log('[Cesium] Updating UAVs from telemetry...');
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
    console.log('[Cesium] Processing', telemetry.uavData.length, 'UAVs');
    telemetry.uavData.forEach((uavData: UAVTelemetryData) => {
      const updateData: UAVUpdateData = this.extractUpdateData(uavData);
      console.log('[Cesium] Updating UAV', uavData.tailId, 'with data:', updateData);
      console.log('[Cesium] About to call cesiumService.updateUAV...');
      this.cesiumService.updateUAV(uavData.tailId, updateData);
      console.log('[Cesium] Called cesiumService.updateUAV');
    });
  }

  private extractUpdateData(uavData: UAVTelemetryData): UAVUpdateData {
    const fields = uavData.fields;
    return {
      position: {
        latitude: fields[TelemetryField.Latitude] || 0,
        longitude: fields[TelemetryField.Longitude] || 0,
        height: fields[TelemetryField.Altitude] || 0,
      },
      orientation: {
        yaw: fields[TelemetryField.YawDeg] || 0,
        pitch: fields[TelemetryField.PitchDeg] || 0,
        roll: fields[TelemetryField.RollDeg] || 0,
      },
    };
  }
}
