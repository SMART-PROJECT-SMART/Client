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
  private viewer: Cesium.Viewer | null = null;
  private customImageryProvider: Cesium.UrlTemplateImageryProvider | null = null;
  private uavEntity = signal<Cesium.Entity | null>(null);

  constructor(
    private readonly configService: CesiumConfigService,
    private readonly cameraService: CesiumCameraService,
    private readonly imageryService: CesiumImageryService,
    private readonly uavService: CesiumUAVService
  ) {}

  public async initializeViewer(containerId: string): Promise<Cesium.Viewer> {
    this.validateDomElement(containerId);
    this.configService.initializeCesium();

    this.customImageryProvider = this.configService.createCustomImageryProvider();
    const viewerOptions = this.configService.getViewerOptions(this.customImageryProvider);

    this.viewer = new Cesium.Viewer(containerId, viewerOptions);

    this.setupViewer();
    await this.loadInitialContent();
    this.cameraService.setInitialView(this.viewer);

    return this.viewer;
  }

  public getViewer(): Cesium.Viewer | null {
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

  public useCustomMap(): void {
    if (!this.viewer || !this.customImageryProvider) return;
    this.imageryService.switchToCustomMap(this.viewer, this.customImageryProvider);
  }

  public async useDefaultImagery(): Promise<void> {
    if (!this.viewer) return;
    await this.imageryService.switchToDefaultImagery(this.viewer);
  }

  public addUAVAtPosition(position: GeographicPosition): void {
    if (!this.viewer) return;
    const entity = this.uavService.createUAVAtPosition(this.viewer, position);
    this.uavEntity.set(entity);
    this.cameraService.flyToUAV(
      this.viewer,
      position.longitude,
      position.latitude,
      position.height
    );
  }

  public removeUAV(): void {
    if (!this.viewer) return;
    this.uavService.removeUAV(this.viewer, this.uavEntity());
    this.uavEntity.set(null);
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

  private async loadInitialContent(): Promise<void> {
    if (!this.viewer) return;

    try {
      const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
      this.viewer.scene.primitives.add(tileset);
    } catch (error) {
      console.error('Failed to load building tileset:', error);
    }
  }
}
