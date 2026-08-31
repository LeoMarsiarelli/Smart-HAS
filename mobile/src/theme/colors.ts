/**
 * Central color palette + badge color maps for classification/priority/status.
 * Kept in one place so every screen renders the same colors consistently.
 */
import { BpClassification, DeliveryPriority, DeliveryStatus } from '../types';

export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F4F6F9',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  danger: '#DC2626',
  white: '#FFFFFF',
};

/** Blood pressure classification -> badge background/text colors. */
export const classificationColors: Record<
  BpClassification,
  { bg: string; fg: string; label: string }
> = {
  NORMAL: { bg: '#DCFCE7', fg: '#15803D', label: 'Normal' },
  ELEVADA: { bg: '#FEF9C3', fg: '#A16207', label: 'Elevada' },
  HAS_ESTAGIO_1: { bg: '#FFEDD5', fg: '#C2410C', label: 'HAS Estágio 1' },
  HAS_ESTAGIO_2: { bg: '#FECACA', fg: '#B91C1C', label: 'HAS Estágio 2' },
  CRISE_HIPERTENSIVA: { bg: '#7F1D1D', fg: '#FFFFFF', label: 'Crise Hipertensiva' },
};

/** Delivery priority -> badge background/text colors. */
export const priorityColors: Record<
  DeliveryPriority,
  { bg: string; fg: string; label: string }
> = {
  URGENTE: { bg: '#7F1D1D', fg: '#FFFFFF', label: 'Urgente' },
  ALTA: { bg: '#FECACA', fg: '#B91C1C', label: 'Alta' },
  MEDIA: { bg: '#FEF9C3', fg: '#A16207', label: 'Média' },
  BAIXA: { bg: '#DCFCE7', fg: '#15803D', label: 'Baixa' },
};

/** Delivery status -> badge background/text colors. */
export const statusColors: Record<DeliveryStatus, { bg: string; fg: string; label: string }> = {
  PENDENTE: { bg: '#E2E8F0', fg: '#334155', label: 'Pendente' },
  EM_ROTA: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Em Rota' },
  ENTREGUE: { bg: '#DCFCE7', fg: '#15803D', label: 'Entregue' },
  CANCELADO: { bg: '#FECACA', fg: '#B91C1C', label: 'Cancelado' },
};
