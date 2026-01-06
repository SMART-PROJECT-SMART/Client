import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { CesiumConstants } from '../../common/constants/cesium.constants';
import type { GeographicPosition } from '../../models/cesium';

@Injectable({
  providedIn: 'root',
})
export class CesiumCameraService {
  public setInitialView(viewer: Cesium.Viewer): void {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        CesiumConstants.ISRAEL_CENTER_LONGITUDE,
        CesiumConstants.ISRAEL_CENTER_LATITUDE,
        CesiumConstants.DEFAULT_CAMERA_ALTITUDE
      ),
    });
  }

  public zoomToIsrael(viewer: Cesium.Viewer): void {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        CesiumConstants.ISRAEL_CENTER_LONGITUDE,
        CesiumConstants.ISRAEL_CENTER_LATITUDE,
        CesiumConstants.DEFAULT_CAMERA_ALTITUDE
      ),
      duration: CesiumConstants.CAMERA_FLY_DURATION_SECONDS,
    });
  }

  public flyToPosition(viewer: Cesium.Viewer, position: GeographicPosition): void {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        position.height
      ),
      duration: CesiumConstants.CAMERA_FLY_DURATION_SECONDS,
    });
  }

  public flyToUAV(
    viewer: Cesium.Viewer,
    longitude: number,
    latitude: number,
    height: number
  ): void {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        height + CesiumConstants.CAMERA_UAV_HEIGHT_OFFSET
      ),
      orientation: {
        heading: Cesium.Math.toRadians(CesiumConstants.CAMERA_UAV_HEADING_DEGREES),
        pitch: Cesium.Math.toRadians(CesiumConstants.CAMERA_UAV_PITCH_DEGREES),
        roll: CesiumConstants.CAMERA_UAV_ROLL,
      },
      duration: CesiumConstants.CAMERA_UAV_FLY_DURATION_SECONDS,
    });
  }
}
