import {
  Component,
  input,
  output,
  signal,
  OnInit,
  WritableSignal,
  computed,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type {
  AssignmentAlgorithmRo,
  MissionAssignmentPairing,
  MissionToUavAssignment,
  UAV,
  ApplyAssignmentRo,
  ValidationResult,
} from '../../../../models';
import type { ActiveMissionRo } from '../../../../models/Ro/activeMissionRo.ro';
import { TelemetryField, ViolationType, PlatformType, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { TelemetryUtil, EnumUtil, AssignmentUtil, ImageUtil } from '../../../../common/utils';
import { AssignmentValidatorService } from '../../../../services/assignment/assignment-validator.service';
import { MissionStatusStorageService } from '../../../../services/mission/mission-status-storage.service';

const {
  BACK_LABEL,
  APPLY_LABEL,
  VIOLATION_TYPE_TIME_OVERLAP_LABEL,
  VIOLATION_TYPE_TYPE_MISMATCH_LABEL,
  VIOLATION_TYPE_DEFAULT_LABEL,
  ACTIVE_MISSIONS_LOAD_ERROR_MESSAGE,
} = ClientConstants.AssignmentPageConstants;
const HIDDEN_FIELDS_FOR_ARMED = new Set<TelemetryField>([TelemetryField.DataStorageUsedGB]);
const HIDDEN_FIELDS_FOR_SURVEILLANCE = new Set<TelemetryField>([TelemetryField.AmmoPercentage]);

@Component({
  selector: 'app-assignment-review-component',
  standalone: false,
  templateUrl: './assignment-review-component.html',
  styleUrl: './assignment-review-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewComponent implements OnInit {
  constructor(
    private readonly validatorService: AssignmentValidatorService,
    private readonly missionStatusStorage: MissionStatusStorageService,
  ) {}

  public readonly algorithmResult = input.required<AssignmentAlgorithmRo>();
  public readonly availableUavs = input.required<UAV[]>();
  public readonly back = output<void>();
  public readonly apply = output<ApplyAssignmentRo>();

  public readonly backLabel: string = BACK_LABEL;
  public readonly applyLabel: string = APPLY_LABEL;
  public readonly TelemetryField = TelemetryField;
  public readonly ViolationType = ViolationType;
  public readonly PlatformType = PlatformType;
  public readonly AssignmentUtil = AssignmentUtil;
  public readonly TelemetryUtil = TelemetryUtil;
  public readonly EnumUtil = EnumUtil;
  public readonly ImageUtil = ImageUtil;

  public readonly selectedTailIds: WritableSignal<Map<string, number>> = signal<
    Map<string, number>
  >(new Map());
  public readonly expandedMissions: WritableSignal<Set<string>> = signal<Set<string>>(new Set());
  public readonly expandedTelemetry: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

  public readonly missionFilterControl = new FormControl<string>('', { nonNullable: true });
  public readonly uavFilterControl = new FormControl<string>('', { nonNullable: true });
  public readonly selectedMissionIdsForMap = signal<string[]>([]);
  public readonly selectedTailIdsForMap = signal<number[]>([]);
  public readonly isMapFilterOpen = signal(false);

  public readonly validationResult: Signal<ValidationResult> = computed(() => {
    return this.validatorService.validateAssignments(
      this.algorithmResult().pairings,
      this.selectedTailIds(),
      this.algorithmResult().uavTelemetryData,
    );
  });

  public readonly canApplyAssignment: Signal<boolean> = computed(() => {
    return this.validationResult().isValid;
  });

  public readonly activeMissionsLoadError = signal<unknown | null>(null);

  public readonly activeMissions: Signal<ActiveMissionRo[]> = computed(() => {
    return this.missionStatusStorage.activeMissionList();
  });

  public readonly highlightMissionIds: Signal<Set<string>> = computed(() => {
    return new Set(this.selectedMissionIdsForMap());
  });

  public readonly highlightTailIds: Signal<Set<number>> = computed(() => {
    return new Set(this.selectedTailIdsForMap());
  });

  public readonly mapMissionById: Signal<Map<string, string>> = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.algorithmResult().pairings) {
      map.set(p.mission.id, p.mission.title);
    }
    return map;
  });

  public readonly missionFilterOptions: Signal<{ missionId: string; title: string }[]> = computed(
    () => {
      const selected = new Set(this.selectedMissionIdsForMap());
      const normalizedQuery = (this.missionFilterControl.value ?? '').trim().toLowerCase();
      const missions = new Map<string, string>();
      for (const p of this.algorithmResult().pairings) {
        missions.set(p.mission.id, p.mission.title);
      }
      const out: { missionId: string; title: string }[] = [];
      for (const [missionId, title] of missions.entries()) {
        if (selected.has(missionId)) continue;
        if (!normalizedQuery || title.toLowerCase().includes(normalizedQuery)) {
          out.push({ missionId, title });
        }
      }
      return out;
    },
  );

  public readonly uavFilterOptions: Signal<{ tailId: number }[]> = computed(() => {
    const selected = new Set(this.selectedTailIdsForMap());
    const normalizedQuery = (this.uavFilterControl.value ?? '').trim().toLowerCase();
    const out: { tailId: number }[] = [];
    for (const uav of this.availableUavs()) {
      if (selected.has(uav.tailId)) continue;
      const label = `uav-${uav.tailId}`;
      if (!normalizedQuery || label.includes(normalizedQuery) || uav.tailId.toString().includes(normalizedQuery)) {
        out.push({ tailId: uav.tailId });
      }
    }
    return out;
  });

  public getViolationTypeLabel(type: ViolationType): string {
    switch (type) {
      case ViolationType.TimeOverlap:
        return VIOLATION_TYPE_TIME_OVERLAP_LABEL;
      case ViolationType.TypeMismatch:
        return VIOLATION_TYPE_TYPE_MISMATCH_LABEL;
      default:
        return VIOLATION_TYPE_DEFAULT_LABEL;
    }
  }

  public readonly uavByMissionId: Signal<Map<string, UAV>> = computed(() => {
    const map = new Map<string, UAV>();
    const telemetryData = this.algorithmResult().uavTelemetryData;
    const selectedIds = this.selectedTailIds();

    this.algorithmResult().pairings.forEach((pairing) => {
      const tailId = selectedIds.get(pairing.mission.id) ?? pairing.tailId;
      const uav = AssignmentUtil.buildUavFromTelemetry(tailId, telemetryData[tailId]);
      map.set(pairing.mission.id, uav);
    });

    return map;
  });

  private readonly platformTypesArray: PlatformType[] = Object.values(PlatformType);

  public ngOnInit(): void {
    this.initializeEditedAssignments();
    void this.loadActiveMissions();
  }

  public addHighlightedMission(missionId: string): void {
    this.selectedMissionIdsForMap.set([...this.selectedMissionIdsForMap(), missionId]);
    this.missionFilterControl.setValue('');
  }

  public removeHighlightedMission(missionId: string): void {
    this.selectedMissionIdsForMap.set(this.selectedMissionIdsForMap().filter((id) => id !== missionId));
  }

  public addHighlightedUav(tailId: number): void {
    this.selectedTailIdsForMap.set([...this.selectedTailIdsForMap(), tailId]);
    this.uavFilterControl.setValue('');
  }

  public removeHighlightedUav(tailId: number): void {
    this.selectedTailIdsForMap.set(this.selectedTailIdsForMap().filter((id) => id !== tailId));
  }

  public clearMapHighlights(): void {
    this.selectedMissionIdsForMap.set([]);
    this.selectedTailIdsForMap.set([]);
    this.missionFilterControl.setValue('');
    this.uavFilterControl.setValue('');
  }

  public toggleMapFilter(): void {
    this.isMapFilterOpen.set(!this.isMapFilterOpen());
  }

  public closeMapFilter(): void {
    this.isMapFilterOpen.set(false);
  }

  private async loadActiveMissions(): Promise<void> {
    this.activeMissionsLoadError.set(null);
    try {
      await firstValueFrom(this.missionStatusStorage.loadActiveMissions());
    } catch (error) {
      this.activeMissionsLoadError.set(error);
      console.error(ACTIVE_MISSIONS_LOAD_ERROR_MESSAGE, error);
    }
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
    const telemetryData = this.algorithmResult().uavTelemetryData;

    const suggestedAssignments: MissionToUavAssignment[] = this.algorithmResult().pairings.map(
      (p) => ({
        mission: p.mission,
        uavTailId: p.tailId,
        startTime: p.timeWindow.start,
        uavTelemetrySnapshot: telemetryData[p.tailId],
      }),
    );

    const actualAssignments: MissionToUavAssignment[] = this.algorithmResult().pairings.map(
      (p) => {
        const tailId = this.selectedTailIds().get(p.mission.id) ?? p.tailId;
        return {
          mission: p.mission,
          uavTailId: tailId,
          startTime: p.timeWindow.start,
          uavTelemetrySnapshot: telemetryData[tailId],
        };
      },
    );
    const assignmentResult: ApplyAssignmentRo = {
      suggested: suggestedAssignments,
      actual: actualAssignments,
      allUavTelemetryData: telemetryData as Record<string, Record<string, number>>,
    };
    this.apply.emit(assignmentResult);
  }

  public getTelemetryEntries(uav: UAV): [TelemetryField, number][] {
    const uavType = this.getUavType(uav);
    return (Object.entries(uav.telemetryData) as [TelemetryField, number][]).filter(
      ([field]) =>
        field !== TelemetryField.UAVTypeValue &&
        field !== TelemetryField.TailId &&
        field !== TelemetryField.PlatformType &&
        field !== TelemetryField.NearestSleeveId &&
        field !== TelemetryField.MissionId &&
        !this.isTelemetryFieldHiddenForUavType(field, uavType),
    );
  }

  public getPlatformType(uav: UAV): PlatformType {
    const platformValue = uav.telemetryData[TelemetryField.PlatformType];
    return this.platformTypesArray[platformValue];
  }

  public getUavType(uav: UAV): UAVType {
    const platformType = this.getPlatformType(uav);
    return EnumUtil.getUAVTypeFromPlatform(platformType);
  }

  public trackByMissionId(_index: number, pairing: MissionAssignmentPairing): string {
    return pairing.mission.id;
  }

  public getUavForPairing(pairing: MissionAssignmentPairing): UAV {
    const tailId = this.selectedTailIds().get(pairing.mission.id) ?? pairing.tailId;
    return AssignmentUtil.buildUavFromTelemetry(
      tailId,
      this.algorithmResult().uavTelemetryData[tailId],
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

  private isTelemetryFieldHiddenForUavType(field: TelemetryField, uavType: UAVType): boolean {
    if (uavType === UAVType.Armed) {
      return HIDDEN_FIELDS_FOR_ARMED.has(field);
    }
    if (uavType === UAVType.Surveillance) {
      return HIDDEN_FIELDS_FOR_SURVEILLANCE.has(field);
    }
    return false;
  }
}
