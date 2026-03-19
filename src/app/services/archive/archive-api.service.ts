import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientConstants } from '../../common/constants/clientConstants.constant';
import type { ArchiveAssignmentRo } from '../../models/archive';

const { ArchiveAPI } = ClientConstants;

@Injectable({
  providedIn: 'root',
})
export class ArchiveApiService {
  private readonly http = inject(HttpClient);

  getLatest(): Observable<ArchiveAssignmentRo | null> {
    return this.http.get<ArchiveAssignmentRo>(ArchiveAPI.LATEST).pipe(
      catchError(() => of(null))
    );
  }

  getByDate(date: string): Observable<ArchiveAssignmentRo[]> {
    return this.http.get<ArchiveAssignmentRo[]>(ArchiveAPI.BY_DATE(date)).pipe(catchError(() => of([])));
  }
}
