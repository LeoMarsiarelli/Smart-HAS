# Smart HAS — Contrato de API (fonte única de verdade)

> Este documento é a referência compartilhada entre o **backend** (Spring Boot),
> o **app mobile** (React Native) e o **dashboard web** (Angular). Qualquer
> mudança de contrato deve ser refletida aqui primeiro.

## Domínio

**Smart HAS** — sistema de apoio à decisão para o acompanhamento de pacientes
com **Hipertensão Arterial Sistêmica (HAS)**, evoluído nesta fase com a camada
**AI Logistics Extension**: um motor de regras (heurística explicável, com
roadmap para virar um modelo de ML real em fases futuras) que prioriza e
sugere janelas de entrega de medicamentos com base no risco calculado a
partir das últimas leituras de pressão arterial do paciente.

Base URL (dev): `http://localhost:8080/api`
Autenticação: `Authorization: Bearer <JWT>` (obtido em `/auth/login`).

## Entidades

### User
```json
{
  "id": 1,
  "name": "Maria Silva",
  "email": "maria@smarthas.com",
  "role": "PATIENT",
  "createdAt": "2026-08-01T10:00:00Z"
}
```
`role`: `"PATIENT" | "ADMIN"`

### BloodPressureReading
```json
{
  "id": 10,
  "userId": 1,
  "systolic": 145,
  "diastolic": 92,
  "pulse": 78,
  "notes": "Após caminhada",
  "measuredAt": "2026-08-30T08:15:00Z",
  "classification": "HAS_ESTAGIO_2"
}
```
`classification` é **calculado no servidor** (nunca enviado pelo cliente),
seguindo a diretriz simplificada da Sociedade Brasileira de Cardiologia:

| Faixa (sistólica / diastólica) | classification |
|---|---|
| < 120 e < 80 | `NORMAL` |
| 120–129 e < 80 | `ELEVADA` |
| 130–139 ou 80–89 | `HAS_ESTAGIO_1` |
| ≥ 140 ou ≥ 90 | `HAS_ESTAGIO_2` |
| ≥ 180 ou ≥ 120 | `CRISE_HIPERTENSIVA` |

### MedicationDeliveryRequest (AI Logistics Extension)
```json
{
  "id": 5,
  "userId": 1,
  "medicationName": "Losartana 50mg",
  "quantity": 2,
  "deliveryAddress": "Rua das Flores, 123 - São Paulo/SP",
  "requestedAt": "2026-08-30T09:00:00Z",
  "riskScore": 82,
  "priority": "ALTA",
  "estimatedWindowStart": "2026-08-30T11:00:00Z",
  "estimatedWindowEnd": "2026-08-30T13:00:00Z",
  "status": "PENDENTE"
}
```
`riskScore`, `priority` e `estimatedWindow*` são **calculados no servidor**
pelo motor de regras (`LogisticsAiService`), a partir da classificação da
leitura de pressão mais recente do usuário:

| classification da última leitura | riskScore | priority | janela sugerida |
|---|---|---|---|
| `CRISE_HIPERTENSIVA` | 95 | `URGENTE` | +1h a +2h |
| `HAS_ESTAGIO_2` | 75 | `ALTA` | +2h a +4h |
| `HAS_ESTAGIO_1` | 50 | `MEDIA` | mesmo dia, +4h a +8h |
| `ELEVADA` | 30 | `BAIXA` | próximo dia útil |
| `NORMAL` / sem leitura | 15 | `BAIXA` | próximo dia útil |

`status`: `"PENDENTE" | "EM_ROTA" | "ENTREGUE" | "CANCELADO"`

## Endpoints

### Auth
- `POST /api/auth/register` — `{ name, email, password }` → `201 { token, user }`
- `POST /api/auth/login` — `{ email, password }` → `200 { token, user }`

### Users
- `GET /api/users/me` → `User` (do token)

### Readings
- `GET /api/readings` — paciente vê as próprias; admin pode passar `?userId=`
- `GET /api/readings/{id}`
- `POST /api/readings` — `{ systolic, diastolic, pulse, notes?, measuredAt? }`
- `PUT /api/readings/{id}`
- `DELETE /api/readings/{id}`

### Deliveries (AI Logistics Extension)
- `GET /api/deliveries` — paciente vê as próprias; admin vê todas
- `GET /api/deliveries/{id}`
- `POST /api/deliveries` — `{ medicationName, quantity, deliveryAddress }`
  (servidor calcula `riskScore`/`priority`/`estimatedWindow*`)
- `PATCH /api/deliveries/{id}/status` — `{ status }` (uso do dashboard admin)
- `DELETE /api/deliveries/{id}`

## Erros
Formato padrão de erro (todos os endpoints):
```json
{ "timestamp": "...", "status": 400, "error": "Bad Request", "message": "...", "path": "/api/readings" }
```

## Documentação interativa
Swagger UI em `/swagger-ui.html` (backend), OpenAPI JSON em `/v3/api-docs`.
