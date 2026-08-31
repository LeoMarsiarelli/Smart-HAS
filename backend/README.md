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
```

### Sobre a "AI Logistics Extension"

`LogisticsAiService` é um motor de regras (heurística explicável / expert
system) que calcula `riskScore`, `priority` e a janela estimada de entrega a
partir da classificação da leitura de pressão mais recente do paciente. É
uma escolha deliberada de IA simbólica/rule-based nesta fase — 100%
explicável e auditável — com roadmap para evoluir para um modelo de ML
treinado com dados históricos reais (ver documentação do projeto).
