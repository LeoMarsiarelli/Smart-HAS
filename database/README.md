# Smart HAS — Camada Oracle

Scripts PL/SQL que estendem o Smart HAS com uma camada de persistência e
inteligência Oracle, validados de ponta a ponta em um Oracle Database XE
21c real (container `gvenzl/oracle-xe:21-slim`). Consolidados nesta fase em
um único **Package**, com **Triggers** de auditoria/automação e uma
procedure com **Dynamic SQL**.

## Scripts (executar nesta ordem)

| Arquivo | Conteúdo |
|---|---|
| `01_schema.sql` | DDL: tabelas `APP_USER`, `BLOOD_PRESSURE_READING`, `MEDICATION_DELIVERY_REQUEST`, `SENSOR_ALERT` + índices e constraints |
| `02_seed_data.sql` | Dados simulados: usuários, histórico de leituras de sensor (pressão arterial) e pedidos de entrega |
| `03_package_smarthas.sql` | Package `SMARTHAS_PKG` (spec + body): todas as functions e procedures, incluindo a nova busca com Dynamic SQL |
| `04_triggers.sql` | Tabela `AUDIT_LOG` + triggers de auditoria/automação |
| `05_usage_examples.sql` | Exemplos práticos: functions em `SELECT`, `EXEC` das procedures, triggers disparando, Dynamic SQL com filtros variados, exceção tratada |

## DER (Modelo relacional)

```
APP_USER (PK id)
  ├─< BLOOD_PRESSURE_READING (PK id, FK user_id)
  │      └─< SENSOR_ALERT (PK id, FK reading_id, FK user_id)
  └─< MEDICATION_DELIVERY_REQUEST (PK id, FK user_id)

AUDIT_LOG (PK id) — tabela de auditoria genérica, alimentada pelas triggers
```

Ver diagrama visual em [`../docs/DER_Oracle.png`](../docs/DER_Oracle.png).

## Package `SMARTHAS_PKG`

Consolidar tudo em um package garante organização (um único ponto de
entrada, `smarthas_pkg.xxx`) e reuso (funções internas chamam umas às
outras sem repetir lógica).

### Functions

| Function | Parâmetros | Retorno | Propósito |
|---|---|---|---|
| `FN_CLASSIFY_BP` | `p_systolic IN`, `p_diastolic IN` | `VARCHAR2` | Classifica a pressão arterial (NORMAL…CRISE_HIPERTENSIVA); reutilizada pelas demais |
| `FN_CALC_RISK_SCORE` | `p_systolic IN`, `p_diastolic IN` | `NUMBER` | Indicador de risco (0-100) usado pela AI Logistics Extension |
| `FN_GET_USER_SUMMARY` | `p_user_id IN` | `VARCHAR2` | Dados formatados: resumo textual do paciente, via `CURSOR` |

### Procedures

| Procedure | Parâmetros | Propósito |
|---|---|---|
| `PRC_REGISTER_CRITICAL_ALERT` | `p_reading_id IN` | Registra um alerta em `SENSOR_ALERT` quando a leitura é `HAS_ESTAGIO_2`/`CRISE_HIPERTENSIVA`. **Acionada pelo backend Java** (`POST /api/readings`) via JDBC logo após salvar uma leitura — fluxo REST → Java → JDBC → Oracle. O `INSERT` dispara automaticamente `TRG_SENSOR_ALERT_AUDIT`. |
| `PRC_USER_DELIVERY_REPORT` | `p_user_id IN`, `p_total_count OUT`, `p_total_qty OUT`, `p_details OUT SYS_REFCURSOR` | Relatório resumido de entregas por usuário: total de pedidos e unidades (via `CURSOR`+`LOOP` explícitos) e detalhe via cursor de referência. |
| `PRC_SEARCH_READINGS` | `p_user_id IN DEFAULT NULL`, `p_classification IN DEFAULT NULL`, `p_since IN DEFAULT NULL`, `p_order_by IN DEFAULT 'MEASURED_AT_DESC'`, `p_cursor OUT SYS_REFCURSOR` | **Dynamic SQL**: busca flexível de leituras com todos os filtros opcionais. O `WHERE` é montado em tempo de execução por concatenação (só entram os filtros informados) e o `ORDER BY` é escolhido contra uma whitelist fixa (bind variable não parametriza nome de coluna) — ambos exigem SQL dinâmico de verdade, não dá pra resolver com um `WHERE` estático. |

Todas tratam exceções (`NO_DATA_FOUND`/`OTHERS`) com `RAISE_APPLICATION_ERROR`
e mensagens customizadas (-20010 a -20040), com comentários explicando
propósito/parâmetros/retorno de cada membro (ver `03_package_smarthas.sql`).

## Triggers de auditoria/automação

| Trigger | Evento | O que faz |
|---|---|---|
| `TRG_SENSOR_ALERT_AUDIT` | `AFTER INSERT ON sensor_alert` | Grava automaticamente em `AUDIT_LOG` todo alerta criado — sem nenhuma chamada explícita em nenhuma camada da aplicação. |
| `TRG_DELIVERY_STATUS_AUDIT` | `AFTER UPDATE OF status ON medication_delivery_request` | Grava automaticamente em `AUDIT_LOG` o "antes/depois" de cada mudança de status de um pedido de entrega. |

Ambas seguem o padrão de nunca propagar erro de auditoria para o fluxo
principal (`EXCEPTION WHEN OTHERS THEN NULL`).

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
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @03_package_smarthas.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @04_triggers.sql
sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS @05_usage_examples.sql
```

Essa é exatamente a sequência usada para validar os scripts — o package, as
triggers e a busca com Dynamic SQL compilaram sem erro e os exemplos de uso
(`05_usage_examples.sql`) rodaram com sucesso contra dados reais, inclusive
conferindo o `AUDIT_LOG` populado automaticamente pelas triggers.

É também a sequência executada automaticamente no pipeline de CI/CD (ver
`.github/workflows/ci-cd.yml`), que sobe um Oracle XE como serviço e roda
estes mesmos scripts a cada push/PR.

## Integração com o backend Spring Boot

Ver [`../backend/README.md`](../backend/README.md), seção "Integração Oracle":
o perfil `oracle` do Spring Boot conecta via JDBC e chama o package
`smarthas_pkg` diretamente (`{ call smarthas_pkg.xxx(...) }`).
