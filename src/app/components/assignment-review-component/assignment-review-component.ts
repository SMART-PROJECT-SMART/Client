import { Component, input, output, signal, OnInit } from '@angular/core';
import type {
  AssignmentAlgorithmRo,
  UavToMission,
  MissionToUavAssignment,
  UAV,
} from '../../models';
import { TelemetryField } from '../../common/enums';
import { ClientConstants } from '../../common';

const { BACK_LABEL, APPLY_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-review-component',
  standalone: false,
  templateUrl: './assignment-review-component.html',
  styleUrl: './assignment-review-component.scss',
})
export class AssignmentReviewComponent implements OnInit {
  public readonly algorithmResult = input.required<AssignmentAlgorithmRo>();
  public readonly availableUavs = input.required<UAV[]>();
  public readonly back = output<void>();
  public readonly apply = output<{ suggested: MissionToUavAssignment[]; actual: MissionToUavAssignment[] }>();

  public readonly backLabel = BACK_LABEL;
  public readonly applyLabel = APPLY_LABEL;
  public readonly TelemetryField = TelemetryField;

  public editedAssignments = signal<Map<string, UavToMission>>(new Map());
  public expandedMissions = signal<Set<string>>(new Set());
  public expandedTelemetry = signal<Set<string>>(new Set());

  public ngOnInit(): void {
    const initialMap = new Map<string, UavToMission>();
    this.algorithmResult().assignments.forEach((assignment) => {
      initialMap.set(assignment.mission.id, assignment);
    });
    this.editedAssignments.set(initialMap);
  }

  public onUavChange(missionId: string, uavTailId: number): void {
    const currentAssignment = this.editedAssignments().get(missionId);
    if (!currentAssignment) return;

    const selectedUav = this.availableUavs().find((uav) => uav.tailId === uavTailId);
    if (!selectedUav) return;

    const updatedAssignment: UavToMission = {
      ...currentAssignment,
      uav: selectedUav,
    };

    const newMap = new Map(this.editedAssignments());
    newMap.set(missionId, updatedAssignment);
    this.editedAssignments.set(newMap);
  }

  public toggleMissionDetails(missionId: string): void {
    const expanded = new Set(this.expandedMissions());
    if (expanded.has(missionId)) {
      expanded.delete(missionId);
    } else {
      expanded.add(missionId);
    }
    this.expandedMissions.set(expanded);
  }

  public toggleTelemetry(missionId: string): void {
    const expanded = new Set(this.expandedTelemetry());
    if (expanded.has(missionId)) {
      expanded.delete(missionId);
    } else {
      expanded.add(missionId);
    }
    this.expandedTelemetry.set(expanded);
  }

  public isMissionExpanded(missionId: string): boolean {
    return this.expandedMissions().has(missionId);
  }

  public isTelemetryExpanded(missionId: string): boolean {
    return this.expandedTelemetry().has(missionId);
  }

  public isAssignmentModified(missionId: string): boolean {
    const original = this.algorithmResult().assignments.find((a) => a.mission.id === missionId);
    const edited = this.editedAssignments().get(missionId);
    return original?.uav.tailId !== edited?.uav.tailId;
  }

  public onBack(): void {
    this.back.emit();
  }

  public onApply(): void {
    const suggestedAssignments: MissionToUavAssignment[] = this.algorithmResult().assignments.map(
      (assignment) => ({
        mission: assignment.mission,
        uavTailId: assignment.uav.tailId,
        startTime: assignment.timeWindow.start,
      })
    );

    const actualAssignments: MissionToUavAssignment[] = Array.from(
      this.editedAssignments().values()
    ).map((assignment) => ({
      mission: assignment.mission,
      uavTailId: assignment.uav.tailId,
      startTime: assignment.timeWindow.start,
    }));

    this.apply.emit({ suggested: suggestedAssignments, actual: actualAssignments });
  }

  public getTelemetryEntries(uav: UAV): [TelemetryField, number][] {
    return Object.entries(uav.telemetryData) as [TelemetryField, number][];
  }

  public trackByMissionId(_index: number, assignment: UavToMission): string {
    return assignment.mission.id;
  }
}
