# Roteiro do Vídeo — Smart HAS (até 5 minutos)

Formato sugerido: tela dividida entre os slides (`Apresentacao_Smart_HAS.pdf`) e a
demonstração ao vivo (mobile + dashboard + Swagger). Grave em partes e edite,
ou grave direto seguindo o roteiro — os tempos são um guia, não precisa ser
cronômetro exato.

**Antes de gravar**: suba o backend (`mvn spring-boot:run`), o dashboard
(`npm start` em `web-admin`) e deixe o Expo pronto (`npx expo start`) em
outra janela, para não perder tempo de gravação esperando build.

---

## 0:00 – 0:25 | Abertura (Slide 1 — Capa)

> "Olá! Somos o grupo [nome do grupo] e vamos apresentar o **Smart HAS**,
> nosso sistema de apoio à decisão para pacientes com Hipertensão Arterial
> Sistêmica, que nesta fase evoluiu com a camada **AI Logistics Extension**."

Mostrar o slide 1 rapidamente (nomes/RM do grupo já preenchidos).

---

## 0:25 – 0:50 | Contexto (Slide 2)

> "O Smart HAS acompanha a pressão arterial do paciente e, a partir do risco
> identificado, nossa camada de IA de logística sugere automaticamente a
> prioridade e a janela ideal para a entrega do medicamento — sem depender
> de um operador humano decidindo isso na mão."

Mostrar o slide 2 (fluxo Leitura → Classificação → Motor de IA → Prioridade).

---

## 0:50 – 1:30 | Parte 1: Stack Mobile (Slides 3 e 4)

> "Para o cliente mobile, optamos por **React Native com Expo**. Como o
> projeto começou esta fase sem uma base Flutter ou Kotlin herdada, escolhemos
> a stack que trouxesse mais consistência com o nosso dashboard em Angular —
> os dois compartilham o mesmo raciocínio de componentização e data binding —
> além de acelerar a demonstração, já que o app roda direto no celular via
> Expo Go, sem precisar de Android Studio."

Mostrar slide 3 (justificativa + componentes View/Text/Image/Button).

> "Esse é o nosso roadmap: o que já foi definido em fases anteriores, o que
> entregamos agora, e o que vem a seguir — como evoluir esse motor de regras
> para um modelo de Machine Learning treinado com dados reais."

Mostrar slide 4 (roadmap).

---

## 1:30 – 2:10 | Parte 2: Backend Spring Boot (Slides 5 e 6)

> "No back-end, construímos uma API REST em Java com Spring Boot, separada
> em camadas de Controller, Service, Repository e Model. Temos autenticação
> via JWT, banco de dados relacional, validação de dados e documentação
> interativa via Swagger."

Mostrar slide 5 (arquitetura em camadas).

> "O coração dessa fase é a **AI Logistics Extension**: o `LogisticsAiService`
> calcula, para cada pedido de entrega, o risco do paciente, a prioridade
> logística e a janela de entrega — com base na última leitura de pressão
> registrada. É uma IA baseada em regras, 100% explicável: dá pra auditar
> exatamente por que uma entrega virou urgente."

Mostrar slide 6 (tabela de prioridades: Crise → Urgente, etc.).

---

## 2:10 – 2:40 | Parte 3: Dashboard Angular (Slides 7 e 8)

> "Para a equipe de gestão, criamos um dashboard administrativo em Angular,
> que consome exatamente a mesma API do app mobile. Ele usa rotas protegidas,
> tabelas dinâmicas com `*ngFor`, filtros com `*ngIf` e `[(ngModel)]`, e um
> formulário completo para criar e acompanhar pedidos de entrega."

Mostrar slide 7 (mockup do dashboard).

> "No fim, essa é a nossa arquitetura: três front-ends diferentes — mobile,
> dashboard e a persistência — todos conversando com o mesmo contrato de API."

Mostrar slide 8 (diagrama de integração).

---

## 2:40 – 4:20 | Demonstração prática (AO VIVO — não pule esta parte)

Esta é a parte obrigatória: mostrar o app **rodando de verdade**.

**(a) Backend — 15s**
- Abrir o Swagger (`localhost:8080/swagger-ui.html`) e mostrar rapidamente
  a lista de endpoints (`/auth`, `/readings`, `/deliveries`).

**(b) App mobile — 1min30**
- Abrir o app no celular/emulador (Expo Go já rodando).
- **Cadastrar** um novo paciente (tela de Registro).
- Fazer **login**.
- Ir em **Leituras** → lançar uma pressão alta, ex. `190 / 125` (crise
  hipertensiva) → mostrar o badge de classificação aparecendo em vermelho.
- Ir em **Entregas (AI Logistics)** → solicitar um medicamento (ex.:
  "Captopril 25mg") → mostrar que a prioridade veio automaticamente como
  **URGENTE**, com a janela de entrega sugerida — sem o usuário escolher
  nada disso manualmente.
- Passar rapidamente pela tela de **Perfil**.

> "Reparem que eu não escolhi a prioridade — o backend calculou isso sozinho
> a partir da minha última leitura de pressão."

**(c) Dashboard Angular — 1min**
- Logar como admin (`admin@smarthas.com` / `admin123`) em `localhost:4200`.
- Ir em `/admin` → mostrar a leitura e a entrega que acabaram de ser
  criadas no celular aparecendo na tabela (prova de que é a mesma API).
- Filtrar por prioridade "URGENTE".
- Atualizar o status da entrega de "Pendente" para "Em rota".
- Mostrar rapidamente o formulário `[(ngModel)]` de criar nova entrega.

> "Essa é a integração completa: o que o paciente faz no celular aparece em
> tempo real para a equipe de gestão no dashboard."

---

## 4:20 – 5:00 | Conclusão (Slide 10)

> "Nesta fase, o Smart HAS saiu do papel e virou uma base técnica completa:
> app mobile em React Native, uma API robusta e segura em Spring Boot com
> uma camada de IA de logística explicável, e um dashboard administrativo em
> Angular — todos integrados pelo mesmo contrato de dados."

> "Como próximos passos, planejamos evoluir esse motor de regras para um
> modelo de Machine Learning treinado com dados reais, adicionar
> notificações push e colocar o sistema em produção na nuvem."

> "Obrigado! O código completo está no nosso repositório GitHub, com toda a
> documentação técnica."

Mostrar slide 10 e, se quiser, o link do repositório na tela por 2-3s.

---

## Checklist antes de publicar

- [ ] Vídeo com até 5 minutos
- [ ] Demonstração prática do app **rodando de verdade** (não só slides)
- [ ] Publicado no YouTube como **não listado**
- [ ] Link testado em aba anônima (confirma que abre sem estar logado)
- [ ] Link colocado no documento Word/PDF e nos slides (placeholders já
      marcados em vermelho nos dois arquivos)
