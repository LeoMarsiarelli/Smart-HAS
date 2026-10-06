# Roteiro do Vídeo — Smart HAS Fase 6 (até 5 minutos)

Formato sugerido: tela dividida entre os slides (`Apresentacao_Smart_HAS.pdf`)
e a demonstração ao vivo (mobile/Swagger + Oracle). Grave em partes e edite,
ou grave direto seguindo o roteiro — os tempos são um guia, não cronômetro
exato.

**Antes de gravar**, deixe tudo já rodando em janelas separadas, para não
perder tempo de gravação esperando build/boot:
1. Container Oracle XE: `docker start smarthas-oracle` (ou suba um novo, ver
   `database/README.md`) e confirme que aceita conexão.
2. Backend com a camada Oracle ativa: `cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=oracle`
3. Um terminal com `sqlplus smarthas/SmartHas123@//localhost:1521/SMARTHAS`
   logado, pronto para rodar um `SELECT` rápido.
4. Swagger aberto em `localhost:8080/swagger-ui.html`.

---

## 0:00 – 0:20 | Abertura (Slide 1 — Capa)

> "Olá! Meu nome é Leonardo Marsiarelli e vou apresentar a evolução do
> **Smart HAS** nesta fase: a adoção do **Oracle PL/SQL** para dar mais
> inteligência e robustez ao sistema."

Mostrar o slide 1 (nome, RM e turma já preenchidos).

---

## 0:20 – 0:45 | Contexto (Slide 2)

> "Nas fases anteriores já tínhamos um MVP funcional: app mobile em React
> Native, backend em Spring Boot com a camada AI Logistics Extension, e um
> dashboard em Angular. Nesta fase, o objetivo foi levar parte dessa
> inteligência para dentro do próprio banco de dados, usando Oracle PL/SQL,
> e integrar isso ao backend Java."

Mostrar o slide 2.

---

## 0:45 – 1:15 | Parte 1: Aprimoramento (Slide 3)

> "A evolução técnica desta fase foi integrar o Oracle ao backend sem
> quebrar nada do que já funcionava: criei um datasource Oracle separado,
> injetado de forma opcional no serviço de leituras — se o Oracle não
> estiver disponível, o sistema continua funcionando normalmente com H2 ou
> Postgres. Também criei quatro novos endpoints REST que expõem as regras
> que agora vivem no banco."

Mostrar o slide 3.

---

## 1:15 – 2:00 | Parte 2: Banco Oracle (Slides 4 e 5)

> "Modelei quatro tabelas no Oracle: usuários, leituras de pressão — que
> representam os dados de sensor —, pedidos de entrega de medicamento, e uma
> nova tabela de alertas. Esse é o DER completo, validado contra um Oracle
> real."

Mostrar slide 4 (modelo de dados/DER).

> "A arquitetura mantém o H2 ou Postgres como banco principal, operado pelo
> JPA; o Oracle entra como uma camada adicional, acessada via JDBC puro,
> com CallableStatement chamando diretamente as functions e procedures."

Mostrar slide 5 (dois datasources).

---

## 2:00 – 2:50 | Parte 3: Functions e Procedures (Slides 6 e 7)

> "Criei três functions PL/SQL: FN_CLASSIFY_BP, que classifica a pressão
> arterial; FN_CALC_RISK_SCORE, que calcula um indicador de risco de 0 a
> 100; e FN_GET_USER_SUMMARY, que monta um resumo formatado do paciente
> usando um CURSOR. Todas tratam exceção e têm parâmetros IN e RETURN."

Mostrar slide 6 (functions + exemplo de SELECT).

> "E duas procedures: PRC_REGISTER_CRITICAL_ALERT, que registra um alerta
> quando a leitura é crítica — e é essa que o backend Java aciona
> automaticamente, fechando o fluxo REST para Java, para JDBC, para Oracle.
> E PRC_USER_DELIVERY_REPORT, que usa CURSOR, LOOP e um REF CURSOR de saída
> para gerar um relatório de entregas por paciente."

Mostrar slide 7 (procedures + fluxo REST→Java→JDBC→Oracle).

---

## 2:50 – 4:10 | Demonstração prática (AO VIVO — não pule esta parte)

Esta é a parte obrigatória: mostrar o app e o Oracle **rodando de verdade**.

**(a) Swagger — 15s**
- Mostrar rapidamente os endpoints `/api/oracle/**` no Swagger.

**(b) Fluxo crítico via API — 1min15**
- No Swagger (ou Postman), fazer **login** e depois **POST /api/readings**
  com uma leitura crítica, ex. `systolic: 195, diastolic: 128`.
- Mostrar a resposta: `classification: CRISE_HIPERTENSIVA`.
- Trocar para o terminal com `sqlplus` já logado e rodar:
  ```sql
  SELECT a.alert_level, a.message FROM sensor_alert a
  JOIN app_user u ON u.id = a.user_id
  ORDER BY a.created_at DESC FETCH FIRST 1 ROWS ONLY;
  ```
- Mostrar o alerta `CRITICO` que acabou de ser criado — **sem ter chamado
  nada manualmente**, só o POST da leitura.

> "Reparem: eu só criei uma leitura pelo app. O backend, por trás, replicou
> essa leitura pro Oracle e chamou a procedure que registrou o alerta
> sozinha."

**(c) Functions via Swagger — 45s**
- `GET /api/oracle/users/{id}/summary` com o id de um paciente seedado →
  mostrar o resumo formatado vindo direto do banco.
- `GET /api/oracle/users/{id}/delivery-report` → mostrar o total de pedidos
  e o detalhe retornado pela procedure com cursor.

**(d) App mobile ou dashboard — 30s (opcional, se der tempo)**
- Mostrar rapidamente o app mobile ou o dashboard Angular funcionando
  normalmente (prova de que a camada Oracle não quebrou o fluxo principal).

---

## 4:10 – 5:00 | Conclusão (Slide 10)

> "Nesta fase, o Smart HAS consolidou a interoperabilidade entre mobile,
> web, API REST e banco Oracle. As mesmas regras de negócio agora vivem
> tanto em Java quanto em PL/SQL, prontas para serem reaproveitadas por
> qualquer outro cliente que converse com o banco — um relatório de BI, por
> exemplo, sem precisar reimplementar nada."

> "Como próximo passo, pretendo evoluir esse motor de regras — tanto o
> Java quanto o PL/SQL — para um modelo de Machine Learning treinado com
> dados reais, e levar o Oracle para a nuvem com Autonomous Database."

> "Obrigado! O código completo, os scripts SQL e toda a documentação estão
> no repositório GitHub."

Mostrar slide 10 e, se quiser, o link do repositório na tela por 2-3s.

---

## Checklist antes de publicar

- [ ] Vídeo com até 5 minutos
- [ ] Demonstração prática rodando de verdade contra o Oracle (não só slides)
- [ ] Publicado no YouTube como **não listado**
- [ ] Link testado em aba anônima (confirma que abre sem estar logado)
- [ ] Link colocado no documento Word/PDF e nos slides (placeholders já
      marcados em vermelho nos dois arquivos)
