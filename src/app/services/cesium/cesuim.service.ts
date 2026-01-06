import { Injectable, signal } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConfigService } from './cesium-config.service';
import { CesiumCameraService } from './cesium-camera.service';
import { CesiumImageryService } from './cesium-imagery.service';
import { CesiumUAVService } from './cesium-uav.service';
import type { GeographicPosition } from '../../models/cesium';

@Injectable({
  providedIn: 'root',
})
export class CesiumService {
  private viewer!: Cesium.Viewer;
  private customImageryProvider: Cesium.UrlTemplateImageryProvider | null = null;
  private uavEntities = signal<Map<number, Cesium.Entity>>(new Map());

  constructor(
    private readonly configService: CesiumConfigService,
    private readonly cameraService: CesiumCameraService,
    private readonly uavService: CesiumUAVService
  ) {}

  public async initializeViewer(containerId: string): Promise<Cesium.Viewer> {
    this.validateDomElement(containerId);
    this.configService.initializeCesium();

    this.customImageryProvider = this.configService.createCustomImageryProvider();
    const viewerOptions = this.configService.getViewerOptions(this.customImageryProvider);

    this.viewer = new Cesium.Viewer(containerId, viewerOptions);

    this.setupViewer();
    this.cameraService.setInitialView(this.viewer);

    return this.viewer;
  }

  public getViewer(): Cesium.Viewer {
    return this.viewer;
  }

  public zoomToIsrael(): void {
    if (!this.viewer) return;
    this.cameraService.zoomToIsrael(this.viewer);
  }

  public flyToPosition(position: GeographicPosition): void {
    if (!this.viewer) return;
    this.cameraService.flyToPosition(this.viewer, position);
  }

  public addUAV(uavId: number, position: GeographicPosition): void {
    if (!this.viewer) return;

    const entity = this.uavService.createUAV(this.viewer, uavId, position);
    const currentMap = new Map(this.uavEntities());
    currentMap.set(uavId, entity);
    this.uavEntities.set(currentMap);

    this.cameraService.flyToUAV(
      this.viewer,
      position.longitude,
      position.latitude,
      position.height
    );
  }

  public updateUAV(uavId: number, position: GeographicPosition): void {
    if (!this.viewer) return;

    const entity = this.uavEntities().get(uavId);
    if (entity) {
      this.uavService.updateUAVPosition(entity, position);
    } else {
      this.addUAV(uavId, position);
    }
  }

  public updateMultipleUAVs(updates: Map<number, GeographicPosition>): void {
    if (!this.viewer) return;

    updates.forEach((position, uavId) => {
      this.updateUAV(uavId, position);
    });
  }

  public removeUAV(uavId: number): void {
    if (!this.viewer) return;

    const entity = this.uavEntities().get(uavId);
    if (entity) {
      this.uavService.removeUAV(this.viewer, entity);
      const currentMap = new Map(this.uavEntities());
      currentMap.delete(uavId);
      this.uavEntities.set(currentMap);
    }
  }

  public removeAllUAVs(): void {
    if (!this.viewer) return;

    this.uavService.removeAllUAVs(this.viewer);
    this.uavEntities.set(new Map());
  }

  public getUAVEntity(uavId: number): Cesium.Entity | undefined {
    return this.uavEntities().get(uavId);
  }

  public getAllUAVs(): Map<number, Cesium.Entity> {
    return this.uavEntities();
  }

  private validateDomElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`DOM element with id "${elementId}" not found`);
    }
  }

  private setupViewer(): void {
    if (!this.viewer) return;

    this.viewer.scene.requestRenderMode = true;
    this.viewer.scene.maximumRenderTimeChange = Infinity;

    const creditContainer = this.viewer.cesiumWidget.creditContainer as HTMLElement;
    if (creditContainer) {
      creditContainer.style.display = 'none';
    }
  }
}
