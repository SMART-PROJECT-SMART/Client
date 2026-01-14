import { Injectable, signal } from '@angular/core';
import { UAV } from '../../models/uav/uav.model';
import { TelemetryBroadcastDto, UAVTelemetryData } from '../../models';
import { TelemetryField } from '../../common/enums';

@Injectable({
  providedIn: 'root',
})
export class UAVStoreService {
  private readonly uavs = signal<Map<number, Record<TelemetryField, number>>>(new Map());
  public getAllUAVs(): Map<number, Record<TelemetryField, number>> {
    return this.uavs();
  }
  public addIfNotExists(uav: UAVTelemetryData): void {
    const currentMap = new Map(this.uavs());
    if (!currentMap.has(uav.tailId)) {
      currentMap.set(uav.tailId, uav.fields);
      this.uavs.set(currentMap);
    }
  }
  public updateActiveUAVs(uavs: TelemetryBroadcastDto): void {
    const newMap = new Map<number, Record<TelemetryField, number>>();
    uavs.uavData.forEach((uavData) => {
      newMap.set(uavData.tailId, uavData.fields);
    });
    this.uavs.set(newMap);
  }
  public removeIfExists(tailId: number): void {
    const currentMap = new Map(this.uavs());
    if (currentMap.has(tailId)) {
      currentMap.delete(tailId);
      this.uavs.set(currentMap);
    }
  }
}
