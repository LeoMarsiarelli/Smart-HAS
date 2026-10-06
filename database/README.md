# Smart HAS — Camada Oracle (Fase 6)

Scripts PL/SQL que estendem o Smart HAS com uma camada de persistência e
inteligência Oracle, validados de ponta a ponta em um Oracle Database XE
21c real (container `gvenzl/oracle-xe:21-slim`).

## Scripts (executar nesta ordem)

| Arquivo | Conteúdo |
|---|---|
| `01_schema.sql` | DDL: tabelas `APP_USER`, `BLOOD_PRESSURE_READING`, `MEDICATION_DELIVERY_REQUEST`, `SENSOR_ALERT` + índices e constraints |
| `02_seed_data.sql` | Dados simulados: usuários, histórico de leituras de sensor (pressão arterial) e pedidos de entrega |
| `03_functions.sql` | `FN_CLASSIFY_BP`, `FN_CALC_RISK_SCORE`, `FN_GET_USER_SUMMARY` |
| `04_procedures.sql` | `PRC_REGISTER_CRITICAL_ALERT`, `PRC_USER_DELIVERY_REPORT` |
| `05_usage_examples.sql` | Exemplos práticos: functions em `SELECT`, `EXEC` das procedures, exceção tratada |

## DER (Modelo relacional)

```
APP_USER (PK id)
  ├─< BLOOD_PRESSURE_READING (PK id, FK user_id)
  │      └─< SENSOR_ALERT (PK id, FK reading_id, FK user_id)
  └─< MEDICATION_DELIVERY_REQUEST (PK id, FK user_id)
```

Ver diagrama visual em [`../docs/DER_Oracle.png`](../docs/DER_Oracle.png).

## Functions

| Function | Parâmetros | Retorno | Propósito |
|---|---|---|---|
| `FN_CLASSIFY_BP` | `p_systolic IN`, `p_diastolic IN` | `VARCHAR2` | Classifica a pressão arterial (NORMAL…CRISE_HIPERTENSIVA); reutilizada pelas demais |
| `FN_CALC_RISK_SCORE` | `p_systolic IN`, `p_diastolic IN` | `NUMBER` | **Indicador relevante ao projeto**: score de risco (0-100) usado pela AI Logistics Extension |
| `FN_GET_USER_SUMMARY` | `p_user_id IN` | `VARCHAR2` | **Dados formatados**: resumo textual do paciente (nome, última PA, entregas pendentes) via `CURSOR` |

## Procedures

| Procedure | Parâmetros | Propósito |
|---|---|---|
| `PRC_REGISTER_CRITICAL_ALERT` | `p_reading_id IN` | Registra um alerta em `SENSOR_ALERT` quando a leitura é `HAS_ESTAGIO_2`/`CRISE_HIPERTENSIVA`. **Acionada pelo backend Java** (`POST /api/readings`) via JDBC logo após salvar uma leitura — fluxo REST → Java → JDBC → Oracle. |
| `PRC_USER_DELIVERY_REPORT` | `p_user_id IN`, `p_total_count OUT`, `p_total_qty OUT`, `p_details OUT SYS_REFCURSOR` | Relatório resumido de entregas por usuário: total de pedidos e unidades (via `CURSOR`+`LOOP` explícitos) e detalhe via cursor de referência. |

Ambas tratam exceções (`NO_DATA_FOUND`/`OTHERS`) com `RAISE_APPLICATION_ERROR`
e mensagens customizadas (-20020 a -20031).

## Como rodar localmente

```bash
docker run -d --name smarthas-oracle \
  -e ORACLE_PASSWORD=SmartHas123 \
  -e ORACLE_DATABASE=SMARTHAS \
  -e APP_USER=smarthas \
  -e APP_USER_PASSWORD=SmartHas123 \
  -p 1521:1521 \
  gvenzl/oracle-xe:21-slim

# aguarde o healthcheck (1-3 min na primeira vez), depois:
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @01_schema.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @02_seed_data.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @03_functions.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @04_procedures.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @05_usage_examples.sql
```

Essa é exatamente a sequência usada para validar os scripts nesta fase —
todas as functions/procedures compilaram sem erro e os exemplos de uso
(`05_usage_examples.sql`) rodaram com sucesso contra dados reais.

## Integração com o backend Spring Boot

Ver [`../backend/README.md`](../backend/README.md), seção "Integração Oracle
(Fase 6)": o perfil `oracle` do Spring Boot conecta via JDBC e expõe
endpoints que chamam estas functions/procedures diretamente.
