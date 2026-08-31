import apiClient from './client';
import {
  CreateDeliveryPayload,
  DeliveryStatus,
  MedicationDeliveryRequest,
} from '../types';

export async function listDeliveries(): Promise<MedicationDeliveryRequest[]> {
  const { data } = await apiClient.get<MedicationDeliveryRequest[]>('/deliveries');
  return data;
}

export async function getDelivery(id: number): Promise<MedicationDeliveryRequest> {
  const { data } = await apiClient.get<MedicationDeliveryRequest>(`/deliveries/${id}`);
  return data;
}

/**
 * Requests a new medication delivery. The server (LogisticsAiService)
 * computes riskScore/priority/estimatedWindow* from the user's most
 * recent blood pressure classification — the client never sends those.
 */
export async function createDelivery(
  payload: CreateDeliveryPayload,
): Promise<MedicationDeliveryRequest> {
  const { data } = await apiClient.post<MedicationDeliveryRequest>('/deliveries', payload);
  return data;
}

export async function updateDeliveryStatus(
  id: number,
  status: DeliveryStatus,
): Promise<MedicationDeliveryRequest> {
  const { data } = await apiClient.patch<MedicationDeliveryRequest>(
    `/deliveries/${id}/status`,
    { status },
  );
  return data;
}

export async function deleteDelivery(id: number): Promise<void> {
  await apiClient.delete(`/deliveries/${id}`);
}
