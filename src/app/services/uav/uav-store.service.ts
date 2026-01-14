import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UAVStoreService {
  private readonly activeUavIds = signal<Set<number>>(new Set());

  public getActiveTailIds(): Set<number> {
    return this.activeUavIds();
  }

  public isActive(tailId: number): boolean {
    return this.activeUavIds().has(tailId);
  }

  public add(tailId: number): void {
    const current = new Set(this.activeUavIds());
    current.add(tailId);
    this.activeUavIds.set(current);
  }

  public remove(tailId: number): void {
    const current = new Set(this.activeUavIds());
    current.delete(tailId);
    this.activeUavIds.set(current);
  }

  public clear(): void {
    this.activeUavIds.set(new Set());
  }
}
