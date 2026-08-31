# Smart HAS — Mobile (React Native / Expo)

Cliente mobile do **Smart HAS**, sistema de apoio à decisão para
acompanhamento de pacientes com Hipertensão Arterial Sistêmica (HAS),
com a camada **AI Logistics Extension** para priorização de entrega de
medicamentos.

Este app é o **Part 1** de uma entrega em 3 partes (FIAP): o backend
Spring Boot é desenvolvido em paralelo em `../backend` e o contrato de
API único está documentado em `../docs/api-contract.md`. Este projeto
consome exatamente os endpoints e formatos descritos ali.

## Stack

- [Expo](https://expo.dev) (SDK 57) + React Native 0.86 + React 19
- TypeScript
- [React Navigation](https://reactnavigation.org) — native-stack + bottom-tabs
- [axios](https://axios-http.com) para chamadas HTTP
- `@react-native-async-storage/async-storage` para persistir o JWT
- Context API (`AuthContext`) para estado de autenticação — sem Redux

## Como instalar

```bash
cd mobile
npm install
```

## Como rodar

```bash
npx expo start
```

Isso abre o Metro Bundler. A partir dele você pode:

- Pressionar `a` para abrir no emulador Android
- Pressionar `i` para abrir no simulador iOS (necessário macOS)
- Pressionar `w` para abrir no navegador
- Escanear o QR code com o app **Expo Go** no seu celular físico

## Apontando para o backend

O backend Spring Boot roda por padrão em `http://localhost:8080/api`.
A URL base do cliente HTTP fica centralizada em uma única constante em
[`src/api/client.ts`](./src/api/client.ts):

```ts
export const API_BASE_URL = 'http://localhost:8080/api';
```

Edite essa constante conforme o ambiente onde você está testando:

| Ambiente | URL |
|---|---|
| Web / Simulador iOS (macOS) | `http://localhost:8080/api` |
| Emulador Android (AVD) | `http://10.0.2.2:8080/api` |
| Dispositivo físico (Expo Go), mesma rede Wi-Fi | `http://<IP_LAN_DA_MAQUINA>:8080/api` |

O emulador Android não enxerga `localhost` como a máquina host — ele
usa o alias especial `10.0.2.2` para isso. Já um dispositivo físico
precisa do IP da máquina na rede local (ex.: `192.168.1.42`), obtido
com `ipconfig getifaddr en0` (macOS), `ipconfig` (Windows) ou
`hostname -I` (Linux).

## Arquitetura / estrutura de pastas

```
mobile/
├── App.tsx                 # Ponto de entrada: providers + navegação
├── app.json                # Configuração do Expo
├── src/
│   ├── api/
│   │   ├── client.ts        # Instância axios + interceptor de JWT + BASE_URL
│   │   ├── auth.ts          # POST /auth/login, /auth/register, GET /users/me
│   │   ├── readings.ts      # CRUD de /readings
│   │   └── deliveries.ts    # CRUD de /deliveries + PATCH status
│   ├── context/
│   │   └── AuthContext.tsx  # Estado de autenticação (token, user, login/logout)
│   ├── navigation/
│   │   ├── RootNavigator.tsx  # Troca AuthStack <-> MainTabs conforme login
│   │   ├── AuthStack.tsx      # Login -> Register
│   │   ├── MainTabs.tsx       # Tabs: Home, Readings, Deliveries, Profile
│   │   └── types.ts           # Param lists tipadas de cada navigator
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx           # Dashboard: última leitura + entregas pendentes
│   │   ├── ReadingsListScreen.tsx   # FlatList de leituras + badge de classificação
│   │   ├── AddReadingScreen.tsx     # Formulário (tela modal) de nova leitura
│   │   ├── DeliveriesListScreen.tsx # FlatList de entregas + badge de prioridade/status
│   │   ├── AddDeliveryScreen.tsx    # Formulário (tela modal) de nova entrega
│   │   └── ProfileScreen.tsx        # Dados do usuário + logout
│   ├── components/
│   │   ├── Badge.tsx         # Pill colorida (classificação/prioridade/status)
│   │   ├── Card.tsx          # Superfície elevada reutilizada em todas as telas
│   │   └── ScreenState.tsx   # Estados de loading / erro reutilizáveis
│   ├── theme/
│   │   └── colors.ts         # Paleta + mapas de cor por classificação/prioridade/status
│   ├── types/
│   │   └── index.ts          # Tipos espelhando o contrato de API (docs/api-contract.md)
│   └── utils/
│       └── format.ts         # Formatação de datas e URL de avatar (DiceBear)
└── README.md
```

### Decisões de design

- **Estado**: `AuthContext` guarda `user`/`token` e persiste a sessão
  no `AsyncStorage`; cada tela busca seus próprios dados com
  `useState`/`useEffect` (ou `useFocusEffect`, para recarregar ao
  voltar para a tela) chamando os módulos em `src/api/*` — sem Redux.
- **Componentes nativos**: as telas usam `View`, `Text`, `Image` e o
  `Button` nativo do `react-native` para as ações primárias (entrar,
  cadastrar, salvar leitura, solicitar entrega, sair). `TouchableOpacity`
  é usado apenas para elementos secundários (ex.: link "Cadastre-se").
  `Image` carrega avatares remotos gerados pelo DiceBear
  (`https://api.dicebear.com/7.x/initials/png?seed=<nome>`), então
  nenhum asset binário precisa ser versionado.
- **Classificação e prioridade nunca são calculadas no cliente** — os
  badges apenas mapeiam o valor (`classification`, `priority`,
  `status`) recebido do backend para uma cor/rótulo, conforme a tabela
  do `api-contract.md`.
- **Tratamento de erro/loading**: toda tela que busca dados usa
  `LoadingState`/`ErrorState` (com botão de "Tentar novamente") ou o
  equivalente inline nos formulários.

## Suposições de integração com o backend

- Base URL: `http://localhost:8080/api` (ajustável, ver acima).
- Autenticação via header `Authorization: Bearer <token>`, anexado
  automaticamente por um interceptor do axios.
- `POST /auth/login` e `POST /auth/register` devem responder
  `{ token, user }`.
- `GET /readings` e `GET /deliveries` retornam a lista do usuário
  autenticado (o app não envia `userId` — o backend infere pelo token).
- Campos calculados no servidor (`classification` em
  `BloodPressureReading`; `riskScore`, `priority`,
  `estimatedWindowStart`, `estimatedWindowEnd` em
  `MedicationDeliveryRequest`) **nunca** são enviados pelo cliente nos
  payloads de criação — apenas lidos e exibidos.

## Status da instalação

`npm install` e `npx tsc --noEmit` foram executados com sucesso neste
ambiente de desenvolvimento (sem erros de tipo). Caso o ambiente onde
você clonar o projeto tenha restrições de rede para o npm registry,
o código-fonte completo permanece correto — basta rodar `npm install`
em um ambiente com acesso à internet.
