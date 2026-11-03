# Roteiro do Vídeo — Smart HAS: Consolidação PL/SQL + CI/CD (até 5 minutos)

Formato sugerido: tela dividida entre os slides (`Apresentacao_Smart_HAS.pdf`)
e a demonstração ao vivo (Swagger + Oracle + GitHub Actions). Grave em partes
e edite, ou grave direto seguindo o roteiro — os tempos são um guia, não
cronômetro exato.

**Antes de gravar**, deixe tudo já rodando em janelas separadas, para não
perder tempo de gravação esperando build/boot:
1. Container Oracle XE: `docker start smarthas-oracle` (ou suba um novo, ver
   `database/README.md`) e confirme que aceita conexão.
2. Backend com a camada Oracle ativa: `cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=oracle`
3. Um terminal com `sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS`
   logado, pronto para rodar um `SELECT` rápido.
4. Swagger aberto em `localhost:8080/swagger-ui.html`.
5. Uma aba do navegador aberta na aba **Actions** do repositório no GitHub,
   já em um run concluído do workflow `CI/CD — Smart HAS Backend + Oracle`.

---

## 0:00 – 0:20 | Abertura (Slide 1 — Capa)

> "Olá! Meu nome é Leonardo Marsiarelli e vou apresentar a etapa de
> consolidação do **Smart HAS**: organização do PL/SQL em um package,
> automação via triggers, Dynamic SQL, e um pipeline de CI/CD completo."

Mostrar o slide 1 (nome, RM e turma já preenchidos).

---

## 0:20 – 0:45 | Contexto (Slide 2)

> "O Smart HAS já tinha app mobile, backend Spring Boot com a AI Logistics
> Extension, dashboard Angular e uma camada Oracle com functions e
> procedures. Nesta etapa final, o objetivo foi profissionalizar essa
> entrega: consolidar o PL/SQL em um package reutilizável, automatizar
> auditoria com triggers, resolver consultas flexíveis com Dynamic SQL, e
> construir um pipeline que builda, testa e publica tudo automaticamente."

Mostrar o slide 2.

---

## 0:45 – 1:30 | Parte 1: Package SMARTHAS_PKG (Slide 3)

> "Todas as functions e procedures das fases anteriores foram agrupadas em
> um único package, o SMARTHAS_PKG: classificação da pressão, cálculo de
> risco, resumo do paciente, registro de alerta crítico, relatório de
> entregas, e uma nova procedure de busca flexível. O package dá organização
> — um ponto de entrada único — e reuso, já que os membros chamam uns aos
> outros internamente."

Mostrar o slide 3 (grid dos 6 membros do package).

---

## 1:30 – 2:00 | Parte 1: Triggers de auditoria (Slide 4)

> "Criei duas triggers de auditoria automática. A TRG_SENSOR_ALERT_AUDIT
> dispara depois que um alerta é inserido, e a TRG_DELIVERY_STATUS_AUDIT
> dispara quando o status de uma entrega muda, registrando o antes e o
> depois. Nenhuma das duas precisa ser chamada pela aplicação — o próprio
> banco gera o rastro de auditoria sozinho."

Mostrar o slide 4 (as duas triggers).

---

## 2:00 – 2:40 | Parte 1: Dynamic SQL (Slide 5)

> "A PRC_SEARCH_READINGS resolve um problema que SQL estático não resolve
> bem: busca de leituras com filtros todos opcionais e ordenação escolhida
> em tempo real. O WHERE é montado por concatenação, só entrando os filtros
> informados, e o ORDER BY é resolvido contra uma whitelist fixa antes de
> virar SQL — porque bind variable não parametriza nome de coluna. Isso
> evita SQL injection mesmo usando SQL dinâmico."

Mostrar o slide 5 (trecho de código do Dynamic SQL).

---

## 2:40 – 3:10 | Parte 2: Pipeline CI/CD (Slides 6 e 7)

> "O pipeline no GitHub Actions tem três jobs encadeados: build-test compila
> e roda os testes automatizados; oracle-integration sobe um Oracle XE real
> como serviço do próprio job, implanta o schema, o package e as triggers, e
> roda os exemplos de uso como teste de integração; e deploy builda a imagem
> Docker do backend e publica no GitHub Container Registry."

Mostrar o slide 6 (os três jobs).

> "Isso não é só um YAML revisado — é um pipeline que eu realmente disparei
> e acompanhei rodando no GitHub, com o Oracle sendo implantado do zero a
> cada execução."

Mostrar o slide 7 (checklist de execução real).

---

## 3:10 – 4:20 | Demonstração prática (AO VIVO — não pule esta parte)

Esta é a parte obrigatória: mostrar o app, o Oracle e o pipeline **rodando
de verdade**.

**(a) Fluxo crítico via API — 40s**
- No Swagger, fazer **login** e depois **POST /api/readings** com uma
  leitura crítica, ex. `systolic: 195, diastolic: 128`.
- Mostrar a resposta: `classification: CRISE_HIPERTENSIVA`.
- Trocar para o terminal com `sqlplus` já logado e rodar:
  ```sql
  SELECT operation, old_value, new_value FROM audit_log
  ORDER BY changed_at DESC FETCH FIRST 1 ROWS ONLY;
  ```
- Mostrar a linha `ALERT_CREATED` recém-gravada pela trigger — **sem
  nenhuma chamada manual**, só o POST da leitura.

> "Reparem: eu só criei uma leitura pelo app. O package registrou o alerta,
> e a trigger gravou a auditoria sozinha."

**(b) Dynamic SQL via Swagger — 25s**
- `GET /api/oracle/readings/search?classification=CRISE_HIPERTENSIVA&orderBy=RISK_DESC`
  → mostrar os resultados filtrados e ordenados pelo score de risco, vindos
  da procedure com Dynamic SQL.

**(c) Pipeline no GitHub Actions — 25s**
- Mostrar a aba Actions do repositório, abrir o run do workflow, mostrar os
  três jobs verdes (build-test, oracle-integration, deploy) e abrir o Step
  Summary do job `oracle-integration` mostrando o resultado do deploy do
  package/triggers em um Oracle real.

---

## 4:20 – 5:00 | Conclusão (Slide 10)

> "O Smart HAS fecha esta etapa como um produto tecnicamente robusto:
> inteligência de negócio organizada em um package PL/SQL reutilizável,
> automação via triggers, consultas flexíveis via Dynamic SQL, e um
> pipeline de CI/CD que builda, testa contra um Oracle real e publica a
> aplicação automaticamente a cada mudança."

> "Como próximos passos, pretendo levar o Oracle para a nuvem com Autonomous
> Database, adicionar observabilidade ao pipeline, e evoluir o motor de
> regras para Machine Learning."

> "Obrigado! O código completo, os scripts SQL, o pipeline e toda a
> documentação estão no repositório GitHub."

Mostrar slide 10 e, se quiser, o link do repositório na tela por 2-3s.

---

## Checklist antes de publicar

- [ ] Vídeo com até 5 minutos
- [ ] Demonstração prática rodando de verdade contra o Oracle (não só slides)
- [ ] Pipeline do GitHub Actions mostrado rodando/verde na tela
- [ ] Publicado no YouTube como **não listado**
- [ ] Link testado em aba anônima (confirma que abre sem estar logado)
- [ ] Link colocado no documento Word/PDF e nos slides (placeholders já
      marcados em vermelho nos dois arquivos)
