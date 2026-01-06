import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { CesiumViewerConfig } from '../../configuration/cesium';
import type { CustomImageryProviderConfig } from '../../configuration/cesium';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CesiumConfigService {
  public initializeCesium(): void {
    Cesium.Ion.defaultAccessToken = CesiumConstants.ION_ACCESS_TOKEN;
    window.CESIUM_BASE_URL = CesiumConstants.BASE_URL;
  }

  public createCustomImageryProvider(): Cesium.UrlTemplateImageryProvider {
    const config: CustomImageryProviderConfig = {
      url: CesiumConstants.TILE_SERVER_URL,
      minimumLevel: 0,
      maximumLevel: 18,
      tileWidth: 256,
      tileHeight: 256,
    };

    return new Cesium.UrlTemplateImageryProvider({
      url: config.url,
      minimumLevel: config.minimumLevel,
      maximumLevel: config.maximumLevel,
      tileWidth: config.tileWidth,
      tileHeight: config.tileHeight,
    });
  }

  public getViewerOptions(
    imageryProvider?: Cesium.ImageryProvider | false
  ): Cesium.Viewer.ConstructorOptions {
    const config: CesiumViewerConfig = {
      imageryProvider: imageryProvider,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false,
      terrainProvider: Cesium.Terrain.fromWorldTerrain(),
      skyBox: undefined,
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
    };

    return config as Cesium.Viewer.ConstructorOptions;
  }
}
