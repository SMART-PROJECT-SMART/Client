import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
} from '@angular/core';
import { TelemetryField } from '../../../common/enums';
import type { Mission, UAV } from '../../../models';
import type { AssignmentReviewMapMissionTooltipComponent } from '../components/assignment-review-map-mission-tooltip/assignment-review-map-mission-tooltip.component';
import type { AssignmentReviewMapUavTooltipComponent } from '../components/assignment-review-map-uav-tooltip/assignment-review-map-uav-tooltip.component';
import {
  createTooltipHostElement,
  destroyTooltipHostElements,
} from './assignment-review-map-tooltip-host.util';

export class AssignmentReviewMapTooltipFacade {
  private readonly tooltipComponentRefs: ComponentRef<unknown>[] = [];

  public constructor(
    private readonly appRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly uavTooltipComponent: typeof AssignmentReviewMapUavTooltipComponent,
    private readonly missionTooltipComponent: typeof AssignmentReviewMapMissionTooltipComponent,
  ) {}

  public buildUavTooltip(
    uav: UAV,
    telemetry: Record<TelemetryField, number>,
    activeMission: Mission | null,
    relativeScore: number | null,
  ): HTMLElement {
    return createTooltipHostElement(
      this.appRef,
      this.environmentInjector,
      this.uavTooltipComponent,
      (tooltipComponentRef) => {
        tooltipComponentRef.setInput('uav', uav);
        tooltipComponentRef.setInput('telemetry', telemetry);
        tooltipComponentRef.setInput('activeMission', activeMission);
        tooltipComponentRef.setInput('relativeScore', relativeScore);
      },
      this.tooltipComponentRefs,
    );
  }

  public buildMissionTooltip(mission: Mission): HTMLElement {
    return createTooltipHostElement(
      this.appRef,
      this.environmentInjector,
      this.missionTooltipComponent,
      (tooltipComponentRef) => {
        tooltipComponentRef.setInput('mission', mission);
      },
      this.tooltipComponentRefs,
    );
  }

  public clear(): void {
    destroyTooltipHostElements(this.appRef, this.tooltipComponentRefs);
  }
}
