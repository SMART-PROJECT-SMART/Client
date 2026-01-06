import type { AssignmentAlgorithmRo, MissionAssignmentPairing, UAV, UavToMission } from '../../models';
import { TelemetryField, UAVType } from '../enums';

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
    const uavTypeValue: number = telemetry[TelemetryField.UAVTypeValue];
    const uavType: UAVType = uavTypeValue === 0 ? UAVType.Surveillance : UAVType.Armed;

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
      const uavTypeValue: number | undefined = telemetry[TelemetryField.UAVTypeValue];

      if (uavTypeValue !== undefined) {
        uavs.push(this.buildUavFromTelemetry(tailId, telemetry));
      }
    });

    return uavs;
  }
}
