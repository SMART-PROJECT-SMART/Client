import { Component, input, output, signal, OnInit, WritableSignal } from '@angular/core';
import type {
  AssignmentAlgorithmRo,
  UavToMission,
  MissionToUavAssignment,
  UAV,
  ApplyAssignmentRo,
} from '../../models';
import { TelemetryField } from '../../common/enums';
import { ClientConstants } from '../../common';
import { TelemetryUtil, EnumUtil } from '../../common/utils';

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
  public readonly apply = output<ApplyAssignmentRo>();

  public readonly backLabel: string = BACK_LABEL;
  public readonly applyLabel: string = APPLY_LABEL;
  public readonly TelemetryField = TelemetryField;
  public readonly TelemetryUtil = TelemetryUtil;
  public readonly EnumUtil = EnumUtil;

  public readonly editedAssignments: WritableSignal<Map<string, UavToMission>> = signal<Map<string, UavToMission>>(new Map());
  public readonly expandedMissions: WritableSignal<Set<string>> = signal<Set<string>>(new Set());
  public readonly expandedTelemetry: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

  public ngOnInit(): void {
    this.initializeEditedAssignments();
  }

  public onUavChange(missionId: string, uavTailId: number): void {
    const currentAssignment: UavToMission | undefined = this.editedAssignments().get(missionId);
    if (!currentAssignment) return;

    const selectedUav: UAV | undefined = this.findUavByTailId(uavTailId);
    if (!selectedUav) return;

    this.updateAssignment(missionId, currentAssignment, selectedUav);
  }

  public toggleMissionDetails(missionId: string): void {
    this.toggleExpansion(this.expandedMissions, missionId);
  }

  public toggleTelemetry(missionId: string): void {
    this.toggleExpansion(this.expandedTelemetry, missionId);
  }

  public isMissionExpanded(missionId: string): boolean {
    return this.expandedMissions().has(missionId);
  }

  public isTelemetryExpanded(missionId: string): boolean {
    return this.expandedTelemetry().has(missionId);
  }

  public isAssignmentModified(missionId: string): boolean {
    const originalAssignment: UavToMission | undefined = this.findOriginalAssignment(missionId);
    const editedAssignment: UavToMission | undefined = this.editedAssignments().get(missionId);
    return originalAssignment?.uav.tailId !== editedAssignment?.uav.tailId;
  }

  public onBack(): void {
    this.back.emit();
  }

  public onApply(): void {
    const suggestedAssignments: MissionToUavAssignment[] = this.mapToMissionToUavAssignments(
      this.algorithmResult().assignments
    );

    const actualAssignments: MissionToUavAssignment[] = this.mapToMissionToUavAssignments(
      Array.from(this.editedAssignments().values())
    );

    this.apply.emit({ suggested: suggestedAssignments, actual: actualAssignments });
  }

  public getTelemetryEntries(uav: UAV): [TelemetryField, number][] {
    return Object.entries(uav.telemetryData) as [TelemetryField, number][];
  }

  public trackByMissionId(_index: number, assignment: UavToMission): string {
    return assignment.mission.id;
  }

  private initializeEditedAssignments(): void {
    const initialMap: Map<string, UavToMission> = new Map<string, UavToMission>();
    this.algorithmResult().assignments.forEach((assignment: UavToMission) => {
      initialMap.set(assignment.mission.id, assignment);
    });
    this.editedAssignments.set(initialMap);
  }

  private findUavByTailId(uavTailId: number): UAV | undefined {
    return this.availableUavs().find((uav: UAV) => uav.tailId === uavTailId);
  }

  private updateAssignment(missionId: string, currentAssignment: UavToMission, selectedUav: UAV): void {
    const updatedAssignment: UavToMission = {
      ...currentAssignment,
      uav: selectedUav,
    };

    const newMap: Map<string, UavToMission> = new Map(this.editedAssignments());
    newMap.set(missionId, updatedAssignment);
    this.editedAssignments.set(newMap);
  }

  private toggleExpansion(expansionSignal: WritableSignal<Set<string>>, id: string): void {
    const expanded: Set<string> = new Set(expansionSignal());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    expansionSignal.set(expanded);
  }

  private findOriginalAssignment(missionId: string): UavToMission | undefined {
    return this.algorithmResult().assignments.find((assignment: UavToMission) => assignment.mission.id === missionId);
  }

  private mapToMissionToUavAssignments(assignments: UavToMission[]): MissionToUavAssignment[] {
    return assignments.map((assignment: UavToMission): MissionToUavAssignment => ({
      mission: assignment.mission,
      uavTailId: assignment.uav.tailId,
      startTime: assignment.timeWindow.start,
    }));
  }
}
