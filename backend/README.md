# Smart HAS — Backend (Spring Boot)

API REST em **Java 17 + Spring Boot 3** que sustenta o app mobile e o
dashboard Angular do Smart HAS: cadastro/monitoramento de pressão arterial
de pacientes com HAS (Hipertensão Arterial Sistêmica) e a camada
**AI Logistics Extension**, que prioriza entregas de medicamento com base
no risco clínico do paciente.

Contrato completo de dados/endpoints: [`../docs/api-contract.md`](../docs/api-contract.md).

## Stack

- Spring Web (Controllers REST)
- Spring Security + JWT (`io.jsonwebtoken`) — autenticação stateless
- Spring Data JPA + H2 (dev, arquivo local) / PostgreSQL (perfil `postgres`)
- Bean Validation (`spring-boot-starter-validation`)
- springdoc-openapi (Swagger UI)

## Como rodar

Pré-requisitos: Java 17+ e Maven (ou use o wrapper, se adicionado).

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. Endpoints em `/api/**`.

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Console H2 (dev): `http://localhost:8080/h2-console`
  (JDBC URL: `jdbc:h2:file:./data/smarthas`, user `sa`, senha em branco)

Na primeira execução, um `DataSeeder` cria dados de demonstração:

| Usuário | Email | Senha | Papel |
|---|---|---|---|
| Admin | admin@smarthas.com | admin123 | ADMIN |
| Paciente | maria@smarthas.com | paciente123 | PATIENT |

## Rodando com PostgreSQL

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```
Configure `SMARTHAS_DB_URL`, `SMARTHAS_DB_USER`, `SMARTHAS_DB_PASSWORD` conforme
necessário (veja `application-postgres.yml`).

## Integração Oracle (Fase 6)

```bash
# 1. Suba um Oracle XE local (ver ../database/README.md) e rode os scripts
#    01_schema.sql, 02_seed_data.sql, 03_functions.sql, 04_procedures.sql.

# 2. Suba o backend com o profile "oracle" além do datasource principal:
mvn spring-boot:run -Dspring-boot.run.profiles=oracle
```

O profile `oracle` ativa um **datasource independente** (não substitui o H2/
Postgres usado pelo JPA — os dois coexistem, ver `OracleDataSourceConfig`) e
expõe, via `OracleController`, endpoints que chamam diretamente as functions
e procedures PL/SQL descritas em [`../database/README.md`](../database/README.md):

| Endpoint | PL/SQL chamado |
|---|---|
| `GET /api/oracle/risk-score?systolic=&diastolic=` | `FN_CLASSIFY_BP` + `FN_CALC_RISK_SCORE` |
| `GET /api/oracle/users/{id}/summary` | `FN_GET_USER_SUMMARY` |
| `GET /api/oracle/users/{id}/delivery-report` | `PRC_USER_DELIVERY_REPORT` |
| `POST /api/oracle/alerts/{readingId}` | `PRC_REGISTER_CRITICAL_ALERT` |

**Fluxo REST → Java → JDBC → Oracle automático**: toda vez que `POST /api/readings`
salva uma leitura (fluxo normal, inalterado, no datasource principal),
`BloodPressureService` também — se o profile `oracle` estiver ativo —
replica essa leitura para o Oracle via `OracleIntelligenceService`
(`CallableStatement`/JDBC puro) e aciona `PRC_REGISTER_CRITICAL_ALERT` sobre
a linha recém-inserida. Usuários são casados entre os dois bancos pelo
**email** (os IDs numéricos são gerados independentemente em cada um). Essa
chamada é *best-effort*: uma falha na réplica Oracle é logada como `WARN` e
nunca derruba a criação da leitura no fluxo principal.

Essa integração foi validada de ponta a ponta contra um Oracle XE 21c real
(container `gvenzl/oracle-xe:21-slim`): registro de usuário → leitura crítica
via `POST /api/readings` → réplica automática no Oracle → alerta `CRITICO`
registrado por `PRC_REGISTER_CRITICAL_ALERT` → conferido com `sqlplus`.

## Testes

```bash
mvn test
```

## Arquitetura

```
controller/  → Controllers REST (fino, delega para services)
service/     → Regras de negócio (inclui LogisticsAiService: motor de IA)
repository/  → Spring Data JPA
model/       → Entidades JPA
dto/         → Records de request/response (nunca expõe entidades diretamente)
security/    → JWT (geração/validação) + filtro + UserDetailsService
config/      → Security, OpenAPI, seed de dados
exception/   → Exceções de domínio + handler global (respostas de erro padronizadas)
oracle/      → Fase 6: datasource independente + chamadas JDBC às functions/
               procedures PL/SQL (OracleDataSourceConfig, OracleIntelligenceService,
               OracleController) — só ativo com o profile "oracle"
```

### Sobre a "AI Logistics Extension"

`LogisticsAiService` é um motor de regras (heurística explicável / expert
system) que calcula `riskScore`, `priority` e a janela estimada de entrega a
partir da classificação da leitura de pressão mais recente do paciente. É
uma escolha deliberada de IA simbólica/rule-based nesta fase — 100%
explicável e auditável — com roadmap para evoluir para um modelo de ML
treinado com dados históricos reais (ver documentação do projeto).

Na Fase 6, a mesma regra de classificação/risco também passou a existir em
PL/SQL (`FN_CLASSIFY_BP`, `FN_CALC_RISK_SCORE`), disponível diretamente no
banco Oracle para consultas e procedures — reforçando a organização e a
"inteligência de dados" descrita no contexto da atividade, sem duplicar a
regra de forma divergente (os dois lados usam exatamente os mesmos limiares).
