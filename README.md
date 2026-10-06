# Smart HAS

Sistema inteligente de apoio à decisão para o acompanhamento de pacientes com
**Hipertensão Arterial Sistêmica (HAS)**, evoluído nesta fase com a camada
**AI Logistics Extension**: um motor de regras que prioriza e sugere janelas
de entrega de medicamentos com base no risco clínico calculado a partir das
leituras de pressão arterial do paciente — alinhado aos princípios da
Sociedade 5.0 (tecnologia a serviço do cuidado centrado na pessoa).

Monorepo com os entregáveis da atividade:

```
/mobile      React Native (Expo) — app do paciente
/backend     Spring Boot — API REST + persistência + IA de logística + integração Oracle (Fase 6)
/web-admin   Angular — dashboard administrativo
/database    Fase 6 — scripts PL/SQL (schema, seed, functions, procedures) para Oracle
/docs        Contrato de API, DER e documentação da atividade
```

## Parte 1 — Stack mobile: React Native

Optamos por construir o cliente mobile em **React Native (Expo)**. Como o
repositório do projeto começou vazio nesta fase (sem uma base Flutter/Kotlin
herdada de fases anteriores para migrar), a escolha de stack foi decidida
puramente pelo valor técnico da opção para o restante do roadmap:

- **Time único de front-end** entre mobile e o dashboard web: React Native e
  Angular compartilham conceitos de componentização, data binding reativo e
  consumo de APIs REST via HTTP client, reduzindo a curva de aprendizado do
  time e permitindo reaproveitar padrões de UX entre as duas superfícies.
- **Expo** acelera o ciclo de desenvolvimento/demonstração (sem exigir
  Android Studio/Xcode para rodar em um dispositivo físico via Expo Go),
  o que é especialmente valioso para a apresentação/demo da atividade.
- **Ecossistema maduro** (React Navigation, bibliotecas de UI, comunidade)
  para evoluir rapidamente a camada AI Logistics Extension em fases futuras
  (ex.: notificações push de status de entrega, mapas de rota).

Ver detalhes em [`mobile/README.md`](mobile/README.md).

## Parte 2 — Backend Spring Boot

API REST em Java + Spring Boot, com Controllers/Services/Repositories/Models,
autenticação JWT, banco relacional (H2 em dev / PostgreSQL em produção),
validação, tratamento de erros padronizado e documentação via Swagger/OpenAPI.
Inclui o motor de regras `LogisticsAiService` (AI Logistics Extension) que
calcula prioridade e janela de entrega de medicamentos.

Ver detalhes em [`backend/README.md`](backend/README.md) e o contrato completo
em [`docs/api-contract.md`](docs/api-contract.md).

## Parte 3 — Dashboard Angular

Painel administrativo em Angular que consome a mesma API REST do app mobile:
gestão de leituras de pressão e pedidos de entrega, com tabelas (`*ngFor`),
estados condicionais (`*ngIf`), formulário com `[(ngModel)]`, e rotas
`/login`, `/home`, `/admin`.

Ver detalhes em [`web-admin/README.md`](web-admin/README.md).

## Fase 6 — Camada Oracle (PL/SQL) + integração com o backend

Estendemos a arquitetura com uma camada de persistência e inteligência
**Oracle**: tabelas dedicadas (`APP_USER`, `BLOOD_PRESSURE_READING`,
`MEDICATION_DELIVERY_REQUEST`, `SENSOR_ALERT`), três *functions* PL/SQL
(`FN_CLASSIFY_BP`, `FN_CALC_RISK_SCORE`, `FN_GET_USER_SUMMARY`) e duas
*procedures* (`PRC_REGISTER_CRITICAL_ALERT`, `PRC_USER_DELIVERY_REPORT`),
todas com tratamento de exceção, `CURSOR`/`LOOP` e comentários explicando o
propósito. O backend Spring Boot chama essas functions/procedures via JDBC
(`CallableStatement`) por meio de um datasource Oracle independente —
inclusive automaticamente a cada nova leitura de pressão salva pelo app
(`POST /api/readings`), fechando o fluxo **REST → Java → JDBC → Oracle**.

Tudo foi validado de ponta a ponta contra um Oracle Database XE 21c real
(não é só script "no papel"). Ver [`database/README.md`](database/README.md)
(schema, seed, DER) e a seção "Integração Oracle" em
[`backend/README.md`](backend/README.md).

## Rodando o projeto completo localmente

```bash
# 1. Backend (porta 8080)
cd backend && mvn spring-boot:run

# 2. Dashboard Angular (porta 4200), em outro terminal
cd web-admin && npm install && npm start

# 3. App mobile (Expo), em outro terminal
cd mobile && npm install && npx expo start
```

Usuários de demonstração (criados automaticamente pelo backend):

| Papel | Email | Senha |
|---|---|---|
| Admin | admin@smarthas.com | admin123 |
| Paciente | maria@smarthas.com | paciente123 |

## Roadmap tecnológico

- ✅ **Concluído em fases anteriores:** definição do escopo estratégico do
  Smart HAS; planejamento da arquitetura; app mobile em React Native,
  backend Spring Boot com autenticação JWT e AI Logistics Extension,
  dashboard administrativo em Angular — MVP funcional e conectado.
- ✅ **Concluído nesta fase (Fase 6):** camada de persistência e
  inteligência Oracle (schema, dados simulados, DER); functions e
  procedures PL/SQL com boas práticas (`EXCEPTION`, `CURSOR`, `LOOP`,
  parâmetros `IN`/`OUT`); integração do backend Java com o Oracle via JDBC,
  incluindo o acionamento automático de uma procedure a partir de um evento
  REST real (nova leitura de pressão → alerta crítico registrado no banco).
- 🔜 **Planejado para as próximas fases:** evoluir o motor de regras
  (Java e PL/SQL) para um modelo de Machine Learning treinado com dados
  históricos reais de entregas e adesão ao tratamento; notificações push no
  app mobile para alertas de pressão crítica e status de entrega; deploy em
  nuvem do backend e do Oracle (ex.: Oracle Autonomous Database) e do
  dashboard; testes automatizados de ponta a ponta (E2E); papéis de acesso
  mais granulares (ex.: cuidador/familiar) no dashboard administrativo.

## Documentação da atividade

A documentação completa da atividade (justificativa técnica, roadmap
detalhado, prints e vínculo com os objetivos do projeto) está em
[`docs/`](docs/).
