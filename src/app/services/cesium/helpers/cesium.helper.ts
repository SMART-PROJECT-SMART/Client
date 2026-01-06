import * as Cesium from 'cesium';

export class CesiumHelper {
  public static validateDomElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`DOM element with id "${elementId}" not found`);
    }
  }

  public static suppressErrorLogging(viewer: Cesium.Viewer): void {
    viewer.scene.requestRenderMode = true;
    viewer.scene.maximumRenderTimeChange = Infinity;
  }

  public static hideCreditContainer(viewer: Cesium.Viewer): void {
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
    if (creditContainer) {
      creditContainer.style.display = 'none';
    }
  }

  public static async addBuildingTileset(viewer: Cesium.Viewer): Promise<void> {
    try {
      const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
      viewer.scene.primitives.add(tileset);
    } catch (error) {
      console.error('Failed to load building tileset:', error);
    }
  }
}
