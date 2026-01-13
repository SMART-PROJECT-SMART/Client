import { Component, input, output, signal, OnInit, WritableSignal, computed, Signal } from '@angular/core';
import type {
  AssignmentAlgorithmRo,
  MissionAssignmentPairing,
  MissionToUavAssignment,
  UAV,
  ApplyAssignmentRo,
  ValidationResult,
  Violation,
} from '../../../../models';
import { TelemetryField, ViolationType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { TelemetryUtil, EnumUtil, AssignmentUtil } from '../../../../common/utils';
import { ApplyAssignmentDto } from '../../../../models/dto/applyAssignmentDto.dto';
import { AssignmentValidatorService } from '../../../../services/assignment/assignment-validator.service';

const { BACK_LABEL, APPLY_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-review-component',
  standalone: false,
  templateUrl: './assignment-review-component.html',
  styleUrl: './assignment-review-component.scss',
})
export class AssignmentReviewComponent implements OnInit {
  private readonly validatorService: AssignmentValidatorService = new AssignmentValidatorService();

  public readonly algorithmResult = input.required<AssignmentAlgorithmRo>();
  public readonly availableUavs = input.required<UAV[]>();
  public readonly back = output<void>();
  public readonly apply = output<ApplyAssignmentRo>();

  public readonly backLabel: string = BACK_LABEL;
  public readonly applyLabel: string = APPLY_LABEL;
  public readonly TelemetryField = TelemetryField;
  public readonly ViolationType = ViolationType;
  public readonly AssignmentUtil = AssignmentUtil;
  public readonly TelemetryUtil = TelemetryUtil;
  public readonly EnumUtil = EnumUtil;

  public readonly selectedTailIds: WritableSignal<Map<string, number>> = signal<
    Map<string, number>
  >(new Map());
  public readonly expandedMissions: WritableSignal<Set<string>> = signal<Set<string>>(new Set());
  public readonly expandedTelemetry: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

  public readonly validationResult: Signal<ValidationResult> = computed(() => {
    return this.validatorService.validateAssignments(
      this.algorithmResult().pairings,
      this.selectedTailIds(),
      this.algorithmResult().uavTelemetryData
    );
  });

  public readonly canApplyAssignment: Signal<boolean> = computed(() => {
    return this.validationResult().isValid;
  });

  public ngOnInit(): void {
    this.initializeEditedAssignments();
  }

  public onUavChange(missionId: string, uavTailId: number): void {
    const newMap: Map<string, number> = new Map(this.selectedTailIds());
    newMap.set(missionId, uavTailId);
    this.selectedTailIds.set(newMap);
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
    const originalPairing = this.algorithmResult().pairings.find((p) => p.mission.id === missionId);
    const selectedTailId = this.selectedTailIds().get(missionId);
    return originalPairing?.tailId !== selectedTailId;
  }

  public onBack(): void {
    this.back.emit();
  }

  public onApply(): void {
    const suggestedAssignments: MissionToUavAssignment[] = this.algorithmResult().pairings.map(
      (p) => ({
        mission: p.mission,
        uavTailId: p.tailId,
        startTime: p.timeWindow.start,
      })
    );

    const actualAssignments: MissionToUavAssignment[] = this.algorithmResult().pairings.map(
      (p) => ({
        mission: p.mission,
        uavTailId: this.selectedTailIds().get(p.mission.id) ?? p.tailId,
        startTime: p.timeWindow.start,
      })
    );
    const Ro: ApplyAssignmentRo = { suggested: suggestedAssignments, actual: actualAssignments };
    this.apply.emit(Ro);
  }

  public getTelemetryEntries(uav: UAV): [TelemetryField, number][] {
    return (Object.entries(uav.telemetryData) as [TelemetryField, number][]).filter(
      ([field]) => field !== TelemetryField.UAVTypeValue && field !== TelemetryField.TailId
    );
  }

  public trackByMissionId(_index: number, pairing: MissionAssignmentPairing): string {
    return pairing.mission.id;
  }

  public getUavForPairing(pairing: MissionAssignmentPairing): UAV {
    const tailId = this.selectedTailIds().get(pairing.mission.id) ?? pairing.tailId;
    return AssignmentUtil.buildUavFromTelemetry(
      tailId,
      this.algorithmResult().uavTelemetryData[tailId]
    );
  }

  private initializeEditedAssignments(): void {
    const initialMap: Map<string, number> = new Map<string, number>();

    this.algorithmResult().pairings.forEach((pairing: MissionAssignmentPairing) => {
      initialMap.set(pairing.mission.id, pairing.tailId);
    });

    this.selectedTailIds.set(initialMap);
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
}
