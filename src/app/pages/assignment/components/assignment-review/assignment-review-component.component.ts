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
import { firstValueFrom } from 'rxjs';
import type {
  AssignmentAlgorithmRo,
  MissionAssignmentPairing,
  UAV,
  ApplyAssignmentRo,
  ValidationResult,
} from '../../../../models';
import type { ActiveMissionRo } from '../../../../models/Ro/activeMissionRo.ro';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';
import type { AssignmentReviewMapMissionFilterOption } from '../../../../models/assignment/assignmentReviewMapMissionFilterOption.model';
import type { AssignmentReviewMapMissionTypeFilterOption } from '../../../../models/assignment/assignmentReviewMapMissionTypeFilterOption.model';
import type { AssignmentReviewMapUavFilterOption } from '../../../../models/assignment/assignmentReviewMapUavFilterOption.model';
import { TelemetryField, ViolationType, PlatformType, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { TelemetryUtil, EnumUtil, AssignmentUtil, ImageUtil } from '../../../../common/utils';
import { AssignmentValidatorService } from '../../../../services/assignment/assignment-validator.service';
import { MissionStatusStorageService } from '../../../../services/mission/mission-status-storage.service';
import { buildApplyAssignmentRoFromReviewState } from '../../utils/assignment-review-apply-payload.util';
import { resolveRelativeScore } from '../../utils/assignment-relative-score.util';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import {
  buildMapMissionFilterOptionsFromPairings,
  buildMapMissionTypeFilterOptionsFromPairings,
  buildMapUavTypeFilterOptionsFromUavs,
  buildMapUavFilterOptionsFromUavs,
} from '../../utils/assignment-review-map-filter-options.util';

const {
  BACK_LABEL,
  APPLY_LABEL,
  REVIEW_TAB_OPERATIONAL_MAP_LABEL,
  REVIEW_TAB_MISSION_BRIEF_CARDS_LABEL,
  RELATIVE_SCORE_SUFFIX,
  RELATIVE_SCORE_MIN,
  RELATIVE_SCORE_MAX,
  CARD_SCORE_BAND_HIGH,
  CARD_SCORE_BAND_MEDIUM,
  CARD_SCORE_BAND_LOW,
  CARD_SCORE_HIGH_MIN,
  CARD_SCORE_MEDIUM_MIN,
  CARD_SCORE_CIRCLE_SIZE_PX,
  CARD_SCORE_CIRCLE_INNER_SIZE_PX,
  VIOLATION_TYPE_TIME_OVERLAP_LABEL,
  VIOLATION_TYPE_TYPE_MISMATCH_LABEL,
  VIOLATION_TYPE_DEFAULT_LABEL,
  ACTIVE_MISSIONS_LOAD_ERROR_MESSAGE,
} = ClientConstants.AssignmentPageConstants;
const HIDDEN_FIELDS_FOR_ARMED = new Set<TelemetryField>([TelemetryField.DataStorageUsedGB]);
const HIDDEN_FIELDS_FOR_SURVEILLANCE = new Set<TelemetryField>([TelemetryField.AmmoPercentage]);
const MAP = ClientConstants.AssignmentReviewMap;

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
  public readonly operationalMapTabLabel: string = REVIEW_TAB_OPERATIONAL_MAP_LABEL;
  public readonly missionBriefCardsTabLabel: string = REVIEW_TAB_MISSION_BRIEF_CARDS_LABEL;
  public readonly relativeScoreSuffix: string = RELATIVE_SCORE_SUFFIX;
  public readonly scoreBandHigh: string = CARD_SCORE_BAND_HIGH;
  public readonly scoreBandMedium: string = CARD_SCORE_BAND_MEDIUM;
  public readonly scoreBandLow: string = CARD_SCORE_BAND_LOW;
  public readonly cardScoreCircleSizePx: number = CARD_SCORE_CIRCLE_SIZE_PX;
  public readonly cardScoreCircleInnerSize: string = `${CARD_SCORE_CIRCLE_INNER_SIZE_PX}px`;
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

  public readonly selectedMissionIdsForMap = signal<string[]>([]);
  public readonly selectedMissionTypesForMap = signal<UAVType[]>([]);
  public readonly selectedUavTypesForMap = signal<UAVType[]>([]);
  public readonly selectedTailIdsForMap = signal<number[]>([]);
  public readonly separateOverlapsForMap = signal(false);
  public readonly selectedReviewTabIndex = signal(0);

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

  public readonly activeMissionTailIds: Signal<Set<number>> = computed(() => {
    return new Set(this.activeMissions().map((activeMission) => activeMission.tailId));
  });

  public readonly highlightMissionIds: Signal<Set<string>> = computed(() => {
    return new Set(this.selectedMissionIdsForMap());
  });

  public readonly highlightTailIds: Signal<Set<number>> = computed(() => {
    return new Set(this.selectedTailIdsForMap());
  });

  public readonly highlightMissionTypes: Signal<Set<UAVType>> = computed(() => {
    return new Set(this.selectedMissionTypesForMap());
  });

  public readonly highlightUavTypes: Signal<Set<UAVType>> = computed(() => {
    return new Set(this.selectedUavTypesForMap());
  });

  public readonly mapMissionOptions: Signal<AssignmentReviewMapMissionFilterOption[]> = computed(() => {
    return buildMapMissionFilterOptionsFromPairings(this.algorithmResult().pairings);
  });

  public readonly mapUavOptions: Signal<AssignmentReviewMapUavFilterOption[]> = computed(() => {
    return buildMapUavFilterOptionsFromUavs(this.availableUavs());
  });

  public readonly mapUavTypeOptions: Signal<AssignmentReviewMapMissionTypeFilterOption[]> = computed(() => {
    return buildMapUavTypeFilterOptionsFromUavs(this.availableUavs());
  });

  public readonly mapMissionTypeOptions: Signal<AssignmentReviewMapMissionTypeFilterOption[]> = computed(() => {
    return buildMapMissionTypeFilterOptionsFromPairings(this.algorithmResult().pairings);
  });

  public readonly shouldShowSeparateOverlapsToggle: Signal<boolean> = computed(() => {
    const coordinates: Array<{ latitude: number; longitude: number }> = [];

    for (const pairing of this.algorithmResult().pairings) {
      coordinates.push({
        latitude: pairing.mission.location.latitude,
        longitude: pairing.mission.location.longitude,
      });
    }

    for (const uav of this.availableUavs()) {
      const position = extractLatLonFromUav(uav);
      if (!position) {
        continue;
      }
      coordinates.push({
        latitude: position.lat,
        longitude: position.lon,
      });
    }

    for (let firstIndex = 0; firstIndex < coordinates.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < coordinates.length; secondIndex += 1) {
        const first = coordinates[firstIndex];
        const second = coordinates[secondIndex];
        const distance = Math.hypot(
          first.latitude - second.latitude,
          first.longitude - second.longitude,
        );
        if (distance <= MAP.OVERLAP_VISIBILITY_THRESHOLD_DEGREES) {
          return true;
        }
      }
    }

    return false;
  });

  public readonly uavTypeByTailId: Signal<Record<number, UAVType>> = computed(() => {
    return this.availableUavs().reduce<Record<number, UAVType>>((accumulator, uav) => {
      accumulator[uav.tailId] = uav.uavType;
      return accumulator;
    }, {});
  });

  public readonly pairingInsightByMissionId: Signal<Map<string, AssignmentPairingInsight>> = computed(() => {
    const insights = new Map<string, AssignmentPairingInsight>();
    for (const insight of this.algorithmResult().pairingInsights) {
      insights.set(insight.missionId, insight);
    }
    return insights;
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

  public clearMapHighlights(): void {
    this.selectedMissionIdsForMap.set([]);
    this.selectedMissionTypesForMap.set([]);
    this.selectedUavTypesForMap.set([]);
    this.selectedTailIdsForMap.set([]);
  }

  public toggleSeparateMapOverlaps(): void {
    this.separateOverlapsForMap.update((value) => !value);
  }

  public focusMissionOnMap(missionId: string): void {
    const tailId =
      this.selectedTailIds().get(missionId)
      ?? this.algorithmResult().pairings.find((pairing) => pairing.mission.id === missionId)?.tailId;
    this.selectedMissionIdsForMap.set([missionId]);
    this.selectedMissionTypesForMap.set([]);
    this.selectedUavTypesForMap.set([]);
    this.selectedTailIdsForMap.set(tailId !== undefined ? [tailId] : []);
    this.selectedReviewTabIndex.set(0);
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
    this.apply.emit(
      buildApplyAssignmentRoFromReviewState(
        this.algorithmResult().pairings,
        this.selectedTailIds(),
        this.algorithmResult().uavTelemetryData,
      ),
    );
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

  public getSelectedTailIdForMission(missionId: string, suggestedTailId: number): number {
    return this.selectedTailIds().get(missionId) ?? suggestedTailId;
  }

  public getCardRelativeScore(missionId: string): number {
    const insight = this.pairingInsightByMissionId().get(missionId);
    if (!insight) {
      return RELATIVE_SCORE_MIN;
    }

    const selectedTailId = this.getSelectedTailIdForMission(missionId, insight.suggestedTailId);
    const selectedTotalScore = this.resolveSelectedTotalScore(insight, selectedTailId);
    return this.clampRelativeScore(resolveRelativeScore(insight.totalScore, selectedTotalScore));
  }

  public getCardScoreBand(relativeScore: number): string {
    if (relativeScore >= CARD_SCORE_HIGH_MIN) {
      return CARD_SCORE_BAND_HIGH;
    }

    if (relativeScore >= CARD_SCORE_MEDIUM_MIN) {
      return CARD_SCORE_BAND_MEDIUM;
    }

    return CARD_SCORE_BAND_LOW;
  }

  public getCardScoreFill(relativeScore: number): string {
    return `${this.clampRelativeScore(relativeScore)}%`;
  }

  private initializeEditedAssignments(): void {
    const initialMap: Map<string, number> = new Map<string, number>();

    this.algorithmResult().pairings.forEach((pairing: MissionAssignmentPairing) => {
      initialMap.set(pairing.mission.id, pairing.tailId);
    });

    this.selectedTailIds.set(initialMap);
  }

  private resolveSelectedTotalScore(insight: AssignmentPairingInsight, selectedTailId: number): number {
    if (selectedTailId === insight.suggestedTailId) {
      return insight.totalScore;
    }

    const selectedAlternative = insight.alternatives.find((alternative) => alternative.tailId === selectedTailId);
    return selectedAlternative?.totalScore ?? RELATIVE_SCORE_MIN;
  }

  private clampRelativeScore(relativeScore: number): number {
    return Math.min(RELATIVE_SCORE_MAX, Math.max(RELATIVE_SCORE_MIN, relativeScore));
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
