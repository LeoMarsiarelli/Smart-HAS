export type Classification =
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
  notes?: string;
  measuredAt: string;
  classification: Classification;
}

// Body accepted by POST /api/readings.
// classification is always computed server-side and never sent by the client.
export interface CreateReadingRequest {
  systolic: number;
  diastolic: number;
  pulse: number;
  notes?: string;
  measuredAt?: string;
}
