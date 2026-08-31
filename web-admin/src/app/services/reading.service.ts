import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BloodPressureReading, CreateReadingRequest } from '../models/reading.model';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly apiUrl = `${environment.apiUrl}/readings`;

  constructor(private http: HttpClient) {}

  // Patients see only their own readings; admins may pass userId to scope
  // the list to a specific patient (per the API contract).
  getReadings(userId?: number): Observable<BloodPressureReading[]> {
    let params = new HttpParams();
    if (userId !== undefined) {
      params = params.set('userId', userId);
    }
    return this.http.get<BloodPressureReading[]>(this.apiUrl, { params });
  }

  getReading(id: number): Observable<BloodPressureReading> {
    return this.http.get<BloodPressureReading>(`${this.apiUrl}/${id}`);
  }

  createReading(payload: CreateReadingRequest): Observable<BloodPressureReading> {
    return this.http.post<BloodPressureReading>(this.apiUrl, payload);
  }

  updateReading(id: number, payload: CreateReadingRequest): Observable<BloodPressureReading> {
    return this.http.put<BloodPressureReading>(`${this.apiUrl}/${id}`, payload);
  }

  deleteReading(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
