import apiClient from './client';
import { BloodPressureReading, CreateReadingPayload } from '../types';

export async function listReadings(): Promise<BloodPressureReading[]> {
  const { data } = await apiClient.get<BloodPressureReading[]>('/readings');
  return data;
}

export async function getReading(id: number): Promise<BloodPressureReading> {
  const { data } = await apiClient.get<BloodPressureReading>(`/readings/${id}`);
  return data;
}

export async function createReading(
  payload: CreateReadingPayload,
): Promise<BloodPressureReading> {
  const { data } = await apiClient.post<BloodPressureReading>('/readings', payload);
  return data;
}

export async function updateReading(
  id: number,
  payload: CreateReadingPayload,
): Promise<BloodPressureReading> {
  const { data } = await apiClient.put<BloodPressureReading>(`/readings/${id}`, payload);
  return data;
}

export async function deleteReading(id: number): Promise<void> {
  await apiClient.delete(`/readings/${id}`);
}
