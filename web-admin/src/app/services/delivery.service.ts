import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateDeliveryRequest,
  DeliveryStatus,
  MedicationDeliveryRequest
} from '../models/delivery.model';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly apiUrl = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  // Patients see only their own delivery requests; admins see all of them.
  getDeliveries(): Observable<MedicationDeliveryRequest[]> {
    return this.http.get<MedicationDeliveryRequest[]>(this.apiUrl);
  }

  getDelivery(id: number): Observable<MedicationDeliveryRequest> {
    return this.http.get<MedicationDeliveryRequest>(`${this.apiUrl}/${id}`);
  }

  // riskScore / priority / estimatedWindow* are computed server-side by the
  // AI Logistics rules engine — the client only sends the raw request.
  createDelivery(payload: CreateDeliveryRequest): Observable<MedicationDeliveryRequest> {
    return this.http.post<MedicationDeliveryRequest>(this.apiUrl, payload);
  }

  updateStatus(id: number, status: DeliveryStatus): Observable<MedicationDeliveryRequest> {
    return this.http.patch<MedicationDeliveryRequest>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteDelivery(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
