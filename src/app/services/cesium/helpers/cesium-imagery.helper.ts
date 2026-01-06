import * as Cesium from 'cesium';
import { CesiumConstants } from '../../../common/constants/cesium.constants';

export class CesiumImageryHelper {
  public static switchToCustomMap(
    viewer: Cesium.Viewer,
    customProvider: Cesium.ImageryProvider
  ): void {
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(customProvider);
  }

  public static async switchToDefaultImagery(viewer: Cesium.Viewer): Promise<void> {
    viewer.imageryLayers.removeAll();
    const defaultProvider = await Cesium.IonImageryProvider.fromAssetId(
      CesiumConstants.DEFAULT_IMAGERY_ASSET_ID
    );
    viewer.imageryLayers.addImageryProvider(defaultProvider);
  }
}
