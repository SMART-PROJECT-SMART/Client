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
  public readonly scenarios = signal<TestScenario[]>([]);
  public readonly loading = signal<boolean>(true);
  public readonly submitting = signal<boolean>(false);
  public readonly selectedKeys = signal(new Set<string>());
  public readonly searchQuery = signal('');

  public readonly filteredScenarios = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.scenarios();
    if (!query) return all;
    return all.filter((s) => s.label.toLowerCase().includes(query));
  });

  public readonly hasSelection = computed(() => this.selectedKeys().size > 0);
  public readonly allSelected = computed(() => {
    const keys = this.selectedKeys();
    const filtered = this.filteredScenarios();
    return filtered.length > 0 && filtered.every((s) => keys.has(s.key));
  });
  public readonly someSelected = computed(() => {
    const keys = this.selectedKeys();
    const filtered = this.filteredScenarios();
    const selectedCount = filtered.filter((s) => keys.has(s.key)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  });

  public constructor(
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

  public isSelected(key: string): boolean {
    return this.selectedKeys().has(key);
  }

  public toggleScenario(key: string): void {
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

  public toggleAll(): void {
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

  public apply(): void {
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

  public clear(): void {
    this.selectedKeys.set(new Set());
  }

  public close(): void {
    this.dialogRef.close();
  }
}
