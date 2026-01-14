import * as Cesium from 'cesium';
import { CesiumConstants } from '../../../common/constants/cesium.constants';
import type { UAVUpdateData } from '../../../models/cesium';
import type { CesiumInterpolationConfig } from '../../../configuration/cesium/cesium-interpolation-config.config';

export class CesiumUavHelper {
  static readonly INTERPOLATION_CONFIG: CesiumInterpolationConfig = {
    interpolationAlgorithm: Cesium.LinearApproximation,
    interpolationDegree: CesiumConstants.POSITION_INTERPOLATION_DEGREE,
  };

  static getCartesian(updateData: UAVUpdateData): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(
      updateData.position.longitude,
      updateData.position.latitude,
      updateData.position.height
    );
  }

  static addSampleToPositionProperty(
    viewer: Cesium.Viewer,
    positionProperty: Cesium.SampledPositionProperty,
    updateData: UAVUpdateData
  ): Cesium.Cartesian3 {
    const clockTime = viewer.clock.currentTime;
    const time = Cesium.JulianDate.addSeconds(
      clockTime,
      CesiumConstants.SAMPLE_TIME_BUFFER_SECONDS,
      new Cesium.JulianDate()
    );
    const cartesian = this.getCartesian(updateData);
    positionProperty.addSample(time, cartesian);
    return cartesian;
  }

  static createSampledPositionProperty(
    viewer: Cesium.Viewer,
    updateData: UAVUpdateData
  ): Cesium.SampledPositionProperty {
    const positionProperty = new Cesium.SampledPositionProperty();
    positionProperty.setInterpolationOptions(this.INTERPOLATION_CONFIG);
    positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
    positionProperty.backwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
    this.addSampleToPositionProperty(viewer, positionProperty, updateData);
    return positionProperty;
  }
}
