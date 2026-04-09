import { Injectable } from '@angular/core';
import type { ArchiveAssignmentRo } from '../../models/archive';
import type { ArchiveInvestigationUiSnapshot } from './archive-investigation-return-state.model';

export interface ArchiveInvestigationRestorePayload {
  snapshot: ArchiveInvestigationUiSnapshot;
  diffRecord: ArchiveAssignmentRo | null;
}

@Injectable({ providedIn: 'root' })
export class ArchiveInvestigationReturnStateService {
  private uiSnapshot: ArchiveInvestigationUiSnapshot | null = null;
  private diffRecord: ArchiveAssignmentRo | null = null;
  private restorePending = false;

  saveArchiveUiSnapshot(snapshot: ArchiveInvestigationUiSnapshot): void {
    this.uiSnapshot = snapshot;
  }

  setDiffRecordForReturn(record: ArchiveAssignmentRo): void {
    this.diffRecord = record;
  }

  markRestorePending(): void {
    this.restorePending = true;
  }

  tryConsumeRestore(): ArchiveInvestigationRestorePayload | null {
    if (!this.restorePending) {
      return null;
    }
    this.restorePending = false;
    if (!this.uiSnapshot) {
      this.diffRecord = null;
      return null;
    }
    const payload: ArchiveInvestigationRestorePayload = {
      snapshot: this.uiSnapshot,
      diffRecord: this.diffRecord,
    };
    this.uiSnapshot = null;
    this.diffRecord = null;
    return payload;
  }
}
