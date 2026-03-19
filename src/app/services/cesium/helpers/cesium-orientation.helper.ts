import { UAVUpdateData } from '../../../models/cesium';
import * as Cesium from 'cesium';

export class CesiumOrientationHelper {
  public static calculateQuaternion(
    updateData: UAVUpdateData,
    cartesian: Cesium.Cartesian3,
    yawCorrectionDegrees: number,
  ): Cesium.Quaternion {
    const heading = Cesium.Math.toRadians(updateData.orientation.yaw + yawCorrectionDegrees);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    return Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);
  }

  public static calculateHeadingPitchRollQuaternion(
    updateData: UAVUpdateData,
    cartesian: Cesium.Cartesian3,
    yawCorrectionDegrees: number,
  ): Cesium.Quaternion {
    const heading = Cesium.Math.toRadians(updateData.orientation.yaw + yawCorrectionDegrees);
    const pitch = Cesium.Math.toRadians(updateData.orientation.pitch);
    const roll = Cesium.Math.toRadians(updateData.orientation.roll);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    return Cesium.Transforms.headingPitchRollQuaternion(cartesian, hpr);
  }
}
