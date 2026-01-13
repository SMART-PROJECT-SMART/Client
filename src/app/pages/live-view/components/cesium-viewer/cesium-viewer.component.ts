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
      if (telemetry && this.isInitialized()) {
        this.updateUAVsFromTelemetry(telemetry);
      }
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.cesiumService.initializeViewer('cesium-container');
    this.isInitialized.set(true);
    this.cesiumService.zoomToIsrael();
    await this.ltsService.connectToAllUAVs();
  }

  public async ngOnDestroy(): Promise<void> {
    this.cesiumService.removeAllUAVs();
    await this.ltsService.disconnect();
  }

  private updateUAVsFromTelemetry(telemetry: TelemetryBroadcastDto): void {
    telemetry.uavData.forEach((uavData: UAVTelemetryData) => {
      const updateData: UAVUpdateData = this.extractUpdateData(uavData);
      this.cesiumService.updateUAV(uavData.tailId, updateData);
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
