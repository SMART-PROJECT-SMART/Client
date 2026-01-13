import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
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
    const options: Cesium.Viewer.ConstructorOptions = {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false,
      terrain: Cesium.Terrain.fromWorldTerrain(),
      fullscreenButton: false,
      vrButton: false,
      infoBox: false,
    };

    if (imageryProvider !== undefined) {
      options.baseLayer =
        imageryProvider === false
          ? false
          : Cesium.ImageryLayer.fromProviderAsync(Promise.resolve(imageryProvider));
    }

    return options;
  }
}
