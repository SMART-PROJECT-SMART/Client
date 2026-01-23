import { Injectable } from '@angular/core';
import type { MissionAssignmentPairing, Violation } from '../../../models';
import { ViolationType } from '../../../common/enums';
import type { AssignmentValidationContext } from './assignment-validation-context.interface';
import type { AssignmentValidator } from './assignment-validator.interface';

interface ScheduleEntry {
  missionId: string;
  missionTitle: string;
  start: Date;
  end: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TimeOverlapValidator implements AssignmentValidator {
  public validate(context: AssignmentValidationContext): Violation[] {
    const violations: Violation[] = [];
    const uavSchedules = new Map<number, ScheduleEntry[]>();

    for (const pairing of context.pairings) {
      const selectedTailId = context.selectedTailIds.get(pairing.mission.id) ?? pairing.tailId;
      const schedule = this.getOrCreateSchedule(uavSchedules, selectedTailId);
      const newEntry = this.createScheduleEntry(pairing);

      const overlapViolation = this.findOverlapViolation(pairing, selectedTailId, newEntry, schedule);
      if (overlapViolation) {
        violations.push(overlapViolation);
      }

      schedule.push(newEntry);
    }

    return violations;
  }

  private getOrCreateSchedule(schedules: Map<number, ScheduleEntry[]>, tailId: number): ScheduleEntry[] {
    if (!schedules.has(tailId)) {
      schedules.set(tailId, []);
    }
    return schedules.get(tailId)!;
  }

  private createScheduleEntry(pairing: MissionAssignmentPairing): ScheduleEntry {
    return {
      missionId: pairing.mission.id,
      missionTitle: pairing.mission.title,
      start: new Date(pairing.timeWindow.start),
      end: new Date(pairing.timeWindow.end),
    };
  }

  private findOverlapViolation(
    pairing: MissionAssignmentPairing,
    tailId: number,
    newEntry: ScheduleEntry,
    schedule: ScheduleEntry[]
  ): Violation | null {
    for (const existingEntry of schedule) {
      if (this.hasTimeOverlap(newEntry, existingEntry)) {
        return {
          violationType: ViolationType.TimeOverlap,
          missionId: pairing.mission.id,
          missionTitle: pairing.mission.title,
          description: `UAV-${tailId} has time overlap between "${pairing.mission.title}" and "${existingEntry.missionTitle}"`,
        };
      }
    }
    return null;
  }

  private hasTimeOverlap(entry1: ScheduleEntry, entry2: ScheduleEntry): boolean {
    return entry1.start < entry2.end && entry2.start < entry1.end;
  }
}
