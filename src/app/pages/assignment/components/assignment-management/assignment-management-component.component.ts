import { Component, output, input, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import { UAVType, Priority } from '../../../../common/enums';
import { MissionCreateDialogComponent } from '../mission-create-dialog/mission-create-dialog.component';
import { MissionEditDialogComponent } from '../mission-edit-dialog/mission-edit-dialog.component';
import { MissionSummaryDialogComponent } from '../mission-summary-dialog/mission-summary-dialog.component';
import type { Mission, TimeWindow } from '../../../../models';

const { ADD_MISSION_LABEL, SUBMIT_LABEL } = ClientConstants.AssignmentPageConstants;
const { MISSION_DIALOG_WIDTH, MISSION_SUMMARY_DIALOG_WIDTH, PANEL_CLASS } = ClientConstants.DialogConfig;

@Component({
  selector: 'app-assignment-management-component',
  standalone: false,
  templateUrl: './assignment-management-component.html',
  styleUrl: './assignment-management-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentManagementComponent implements OnInit {
  public readonly missions = input<Mission[]>([]);
  public readonly hasResult = input<boolean>(false);
  public readonly missionsSubmit = output<Mission[]>();
  public readonly viewResults = output<void>();
  public readonly addMissionLabel: string = ADD_MISSION_LABEL;
  public readonly submitLabel: string = SUBMIT_LABEL;
  public readonly EnumUtil = EnumUtil;

  public readonly missionList = signal<Mission[]>([]);
  private readonly hasModifications = signal<boolean>(false);

  public readonly showViewResults = computed<boolean>(() => {
    return this.hasResult() && !this.hasModifications();
  });

  public readonly isEmpty = computed<boolean>(() => {
    return this.missionList().length === 0;
  });

  public readonly isSubmitDisabled = computed<boolean>(() => {
    return this.isEmpty();
  });

  constructor(private readonly dialog: MatDialog) {}

  public ngOnInit(): void {
    const inputMissions = this.missions();
    if (inputMissions.length > 0) {
      this.missionList.set([...inputMissions]);
    }
  }

  public onAddMission(): void {
    const dialogRef = this.dialog.open(MissionCreateDialogComponent, {
      width: MISSION_DIALOG_WIDTH,
      panelClass: PANEL_CLASS,
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result: Mission | undefined) => {
      if (result) {
        this.missionList.update((list) => [...list, result]);
        this.hasModifications.set(true);
      }
    });
  }

  public onEditMission(mission: Mission): void {
    const dialogRef = this.dialog.open(MissionEditDialogComponent, {
      width: MISSION_DIALOG_WIDTH,
      panelClass: PANEL_CLASS,
      data: { mission },
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result: Mission | undefined) => {
      if (result) {
        this.missionList.update((list) =>
          list.map((m) => (m.id === result.id ? result : m))
        );
        this.hasModifications.set(true);
      }
    });
  }

  public onViewSummary(mission: Mission): void {
    this.dialog.open(MissionSummaryDialogComponent, {
      width: MISSION_SUMMARY_DIALOG_WIDTH,
      panelClass: PANEL_CLASS,
      data: { mission },
    });
  }

  public onDeleteMission(mission: Mission): void {
    this.missionList.update((list) => list.filter((m) => m.id !== mission.id));
    this.hasModifications.set(true);
  }

  public onQuickAddTestMissions(): void {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const timeWindow: TimeWindow = { start: now, end: oneHourLater };

    const testMissions: Mission[] = [
      { id: crypto.randomUUID(), title: 'Test Surveillance 1', requiredUAVType: UAVType.Surveillance, priority: Priority.Medium, location: { latitude: 31, longitude: 31, altitude: 500000 }, timeWindow },
      { id: crypto.randomUUID(), title: 'Test Surveillance 2', requiredUAVType: UAVType.Surveillance, priority: Priority.Medium, location: { latitude: 32, longitude: 32, altitude: 500000 }, timeWindow },
      { id: crypto.randomUUID(), title: 'Test Armed 1', requiredUAVType: UAVType.Armed, priority: Priority.Medium, location: { latitude: 33, longitude: 33, altitude: 500000 }, timeWindow },
      { id: crypto.randomUUID(), title: 'Test Armed 2', requiredUAVType: UAVType.Armed, priority: Priority.Medium, location: { latitude: 34, longitude: 34, altitude: 500000 }, timeWindow },
    ];

    this.missionList.update((list) => [...list, ...testMissions]);
    this.hasModifications.set(true);
  }

  public onSubmit(): void {
    this.missionsSubmit.emit(this.missionList());
  }

  public onViewResults(): void {
    this.viewResults.emit();
  }

  public trackByMissionId(_index: number, mission: Mission): string {
    return mission.id;
  }

  public formatTimeWindow(timeWindow: TimeWindow): string {
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };
    return `${formatDate(timeWindow.start)} - ${formatDate(timeWindow.end)}`;
  }
}
