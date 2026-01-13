import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';

@Injectable({
  providedIn: 'root',
})
export class CesiumImageryService {
  public switchToCustomMap(viewer: Cesium.Viewer, customProvider: Cesium.ImageryProvider): void {
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(customProvider);
  }

  public async switchToDefaultImagery(viewer: Cesium.Viewer): Promise<void> {
    viewer.imageryLayers.removeAll();
    const defaultProvider = await Cesium.IonImageryProvider.fromAssetId(
      CesiumConstants.DEFAULT_IMAGERY_ASSET_ID
    );
    viewer.imageryLayers.addImageryProvider(defaultProvider);
  }
}
