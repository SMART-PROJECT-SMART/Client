import { Component, output, input, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import { MissionCreateDialogComponent } from '../mission-create-dialog/mission-create-dialog.component';
import { MissionEditDialogComponent } from '../mission-edit-dialog/mission-edit-dialog.component';
import { MissionSummaryDialogComponent } from '../mission-summary-dialog/mission-summary-dialog.component';
import type { Mission, TimeWindow } from '../../../../models';

const { ADD_MISSION_LABEL, SUBMIT_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-management-component',
  standalone: false,
  templateUrl: './assignment-management-component.html',
  styleUrl: './assignment-management-component.scss',
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
      width: '600px',
      panelClass: 'mission-dialog',
    });

    dialogRef.afterClosed().subscribe((result: Mission | undefined) => {
      if (result) {
        this.missionList.update((list) => [...list, result]);
        this.hasModifications.set(true);
      }
    });
  }

  public onEditMission(mission: Mission): void {
    const dialogRef = this.dialog.open(MissionEditDialogComponent, {
      width: '600px',
      panelClass: 'mission-dialog',
      data: { mission },
    });

    dialogRef.afterClosed().subscribe((result: Mission | undefined) => {
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
      width: '500px',
      panelClass: 'mission-dialog',
      data: { mission },
    });
  }

  public onDeleteMission(mission: Mission): void {
    this.missionList.update((list) => list.filter((m) => m.id !== mission.id));
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
