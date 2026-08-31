/**
 * Shared TypeScript types that mirror the backend contract exactly.
 * Source of truth: /docs/api-contract.md (repo root).
 * Do NOT rename fields here — the Spring Boot backend serializes JSON
 * using these exact property names.
 */

export type UserRole = 'PATIENT' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type BpClassification =
  | 'NORMAL'
  | 'ELEVADA'
  | 'HAS_ESTAGIO_1'
  | 'HAS_ESTAGIO_2'
  | 'CRISE_HIPERTENSIVA';

export interface BloodPressureReading {
  id: number;
  userId: number;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes?: string | null;
  measuredAt: string;
  /** Calculated server-side. Never sent by the client. */
  classification: BpClassification;
}

/** Payload accepted by POST /api/readings */
export interface CreateReadingPayload {
  systolic: number;
  diastolic: number;
  pulse: number;
  notes?: string;
  measuredAt?: string;
}

export type DeliveryPriority = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';

export type DeliveryStatus = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';

export interface MedicationDeliveryRequest {
  id: number;
  userId: number;
  medicationName: string;
  quantity: number;
  deliveryAddress: string;
  requestedAt: string;
  /** Calculated server-side by LogisticsAiService. */
  riskScore: number;
  /** Calculated server-side by LogisticsAiService. */
  priority: DeliveryPriority;
  /** Calculated server-side by LogisticsAiService. */
  estimatedWindowStart: string;
  /** Calculated server-side by LogisticsAiService. */
  estimatedWindowEnd: string;
  status: DeliveryStatus;
}

/** Payload accepted by POST /api/deliveries */
export interface CreateDeliveryPayload {
  medicationName: string;
  quantity: number;
  deliveryAddress: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/** Standard error shape returned by every endpoint. */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
