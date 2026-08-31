export type DeliveryPriority = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';
export type DeliveryStatus = 'PENDENTE' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';

export interface MedicationDeliveryRequest {
  id: number;
  userId: number;
  medicationName: string;
  quantity: number;
  deliveryAddress: string;
  requestedAt: string;
  riskScore: number;
  priority: DeliveryPriority;
  estimatedWindowStart: string;
  estimatedWindowEnd: string;
  status: DeliveryStatus;
}

// Body accepted by POST /api/deliveries.
// riskScore / priority / estimatedWindow* are computed server-side by the
// LogisticsAiService rules engine and must never be sent by the client.
export interface CreateDeliveryRequest {
  medicationName: string;
  quantity: number;
  deliveryAddress: string;
}

export interface UpdateDeliveryStatusRequest {
  status: DeliveryStatus;
}
