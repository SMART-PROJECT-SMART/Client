import type { AssignmentAlgorithmRo, MissionAssignmentPairing, UAV, UavToMission } from '../../models';
import { TelemetryField } from '../enums';
import { EnumUtil } from './enum.util';

export class AssignmentUtil {
  public static transformPairingsToAssignments(result: AssignmentAlgorithmRo): UavToMission[] {
    return result.pairings.map((pairing: MissionAssignmentPairing): UavToMission => {
      const uav: UAV = this.buildUavFromTelemetry(pairing.tailId, result.uavTelemetryData[pairing.tailId]);

      return {
        mission: pairing.mission,
        uav: uav,
        timeWindow: pairing.timeWindow,
      };
    });
  }

  public static buildUavFromTelemetry(
    tailId: number,
    telemetry: Record<TelemetryField, number>
  ): UAV {
    const platformTypeValue: number = telemetry[TelemetryField.PlatformType];
    const uavType = EnumUtil.getUAVTypeFromPlatformNumber(platformTypeValue);

    return {
      tailId: tailId,
      uavType: uavType,
      telemetryData: telemetry,
    };
  }

  public static extractAllUavsFromTelemetry(
    uavTelemetryData: Record<number, Record<TelemetryField, number>>
  ): UAV[] {
    const uavs: UAV[] = [];

    Object.keys(uavTelemetryData).forEach((tailIdStr: string) => {
      const tailId: number = parseInt(tailIdStr, 10);
      const telemetry = uavTelemetryData[tailId];
      const platformTypeValue: number | undefined = telemetry[TelemetryField.PlatformType];

      if (platformTypeValue !== undefined) {
        uavs.push(this.buildUavFromTelemetry(tailId, telemetry));
      }
    });

    return uavs;
  }
}
