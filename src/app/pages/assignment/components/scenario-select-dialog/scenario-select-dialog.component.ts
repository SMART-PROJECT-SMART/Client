import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { TestScenarioApiService } from '../../../../services/assignment/api/test-scenario-api.service';
import type { TestScenario } from '../../../../models';

@Component({
  selector: 'app-scenario-select-dialog',
  standalone: false,
  templateUrl: './scenario-select-dialog.component.html',
  styleUrl: './scenario-select-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioSelectDialogComponent {
  readonly scenarios = signal<TestScenario[]>([]);
  readonly loading = signal<boolean>(true);
  readonly submitting = signal<boolean>(false);
  readonly selectedKeys = signal(new Set<string>());
  readonly searchQuery = signal('');

  readonly filteredScenarios = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.scenarios();
    if (!query) return all;
    return all.filter((s) => s.label.toLowerCase().includes(query));
  });

  readonly hasSelection = computed(() => this.selectedKeys().size > 0);
  readonly allSelected = computed(() => {
    const keys = this.selectedKeys();
    const filtered = this.filteredScenarios();
    return filtered.length > 0 && filtered.every((s) => keys.has(s.key));
  });
  readonly someSelected = computed(() => {
    const keys = this.selectedKeys();
    const filtered = this.filteredScenarios();
    const selectedCount = filtered.filter((s) => keys.has(s.key)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  });

  constructor(
    private readonly dialogRef: MatDialogRef<ScenarioSelectDialogComponent>,
    private readonly testScenarioApi: TestScenarioApiService,
  ) {
    this.testScenarioApi
      .getScenarios()
      .pipe(take(1))
      .subscribe((data) => {
        this.scenarios.set(data);
        this.loading.set(false);
      });
  }

  isSelected(key: string): boolean {
    return this.selectedKeys().has(key);
  }

  toggleScenario(key: string): void {
    this.selectedKeys.update((keys) => {
      const next = new Set(keys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  toggleAll(): void {
    const filtered = this.filteredScenarios();
    if (this.allSelected()) {
      this.selectedKeys.update((keys) => {
        const next = new Set(keys);
        for (const s of filtered) next.delete(s.key);
        return next;
      });
    } else {
      this.selectedKeys.update((keys) => {
        const next = new Set(keys);
        for (const s of filtered) next.add(s.key);
        return next;
      });
    }
  }

  apply(): void {
    const selected = [...this.selectedKeys()];
    if (selected.length === 0) return;

    this.submitting.set(true);
    this.testScenarioApi
      .getMissionsForScenarios(selected)
      .pipe(take(1))
      .subscribe({
        next: (missions) => {
          this.dialogRef.close(missions);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  clear(): void {
    this.selectedKeys.set(new Set());
  }

  close(): void {
    this.dialogRef.close();
  }
}
