# Artemis 📱

Sistema mobile de gerenciamento de rotas e ordens de serviço desenvolvido com React Native e Expo.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Principais Funcionalidades](#principais-funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalacao)
- [Scripts Disponíveis](#scripts-disponiveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Entidades do Domínio](#entidades-do-dominio)
- [Sistema de Licenças](#sistema-de-licencas)
- [Build e Deploy](#build-e-deploy)
- [Contribuindo](#contribuindo)

## 🎯 Sobre o Projeto

Artemis é um aplicativo mobile completo para gerenciamento de rotas de vendas e ordens de serviço. Ele permite que vendedores e representantes comerciais organizem suas visitas, gerenciem clientes, produtos e acompanhem o desempenho de suas entregas e vendas.

### Principais Funcionalidades

#### 👥 Gestão de Clientes

- Cadastro completo de clientes com dados de contato
- Suporte a múltiplos telefones (fixo e celular)
- Integração com WhatsApp
- Geolocalização via endereço
- Histórico de pedidos e visitas

#### 📦 Gestão de Produtos

- Catálogo de produtos com categorias
- Controle de validade
- Preços e descrições
- Organização por categorias

#### 👥 Gestão de Clientes

- Cadastro completo de clientes com dados de contato
- Suporte a múltiplos telefones (fixo e celular)
- Integração com WhatsApp
- Geolocalização via endereço
- Histórico de pedidos e visitas

#### 📦 Gestão de Produtos

- Catálogo de produtos com categorias
- Controle de validade
- Preços e descrições
- Organização por categorias

#### 🗂️ Categorias

- Organização hierárquica de produtos
- Facilita a busca e filtragem

#### 📋 Ordens de Serviço

- Criação e gerenciamento de ordens de serviço
- Produtos agendados e resultados de visita
- Status de pagamento
- Data de visita e agendamento
- Observações e notas
- Integração com WhatsApp para envio de resumos

#### 🗺️ Itinerários

- Planejamento de rotas de visita
- Visualização de ordens de serviço no itinerário
- Reordenação de visitas (drag and drop)
- Finalização de itinerários
- Filtragem e busca avançada

#### 💰 Gestão Financeira

- Controle de pagamentos
- Ordens de pagamento vinculadas
- Cálculo automático de totais
- Status de pagamento (pago/pendente)

#### 📱 Integração WhatsApp

- Envio automático de resumos de pedidos
- Notificações de visita
- Mensagens personalizadas para clientes

#### 📊 Importação/Exportação de Dados

- Download de template Excel (.xlsx) pré-configurado
- Importação em lote de categorias, produtos e clientes
- Validação automática de dados durante importação
- Tratamento de referências cruzadas (categorias em produtos)
- Mensagens de erro detalhadas para facilitar correção
- Formatos flexíveis para campos (ex: validade aceita múltiplos formatos)

#### 🔐 Sistema de Licenças

- Controle de licenças de uso
- Modo administrador
- Renovação de licenças
- Criptografia de chaves de ativação

## 🛠️ Tecnologias Utilizadas

### Core

- **[React Native](https://reactnative.dev/)** (0.78.4) - Framework mobile
- **[Expo](https://expo.dev/)** (~52.0.29) - Plataforma de desenvolvimento
- **[TypeScript](https://www.typescriptlang.org/)** (5.9.2) - Tipagem estática
- **[Expo Router](https://docs.expo.dev/router/introduction/)** (6.0.10) - Navegação file-based

### Banco de Dados

- **[Drizzle ORM](https://orm.drizzle.team/)** (0.44.7) - ORM TypeScript-first
- **[Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)** (16.0.9) - Banco de dados local
- **[Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)** (0.31.7) - Migrations e studio

### UI/UX

- **[NativeWind](https://www.nativewind.dev/)** (4.2.1) - Tailwind CSS para React Native
- **[Lucide React Native](https://lucide.dev/)** (0.545.0) - Ícones
- **[React Native Actions Sheet](https://github.com/ammarahm-ed/react-native-actions-sheet)** (0.9.8) - Bottom sheets
- **[@rn-primitives](https://rn-primitives.com/)** - Componentes UI acessíveis
- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** (4.1.1) - Animações

### Gerenciamento de Estado

- **[TanStack Query](https://tanstack.com/query)** (5.90.8) - Server state management
- **[React Hook Form](https://react-hook-form.com/)** (7.66.0) - Formulários
- **[Zod](https://zod.dev/)** (4.1.12) - Validação de schemas

### Outras Bibliotecas

- **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** - Gestos
- **[React Native Reorderable List](https://github.com/omahili/react-native-reorderable-list)** - Listas arrastáveis
- **[FlashList](https://shopify.github.io/flash-list/)** - Listas otimizadas
- **[libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js)** - Validação de telefones
- **[XLSX](https://docs.sheetjs.com/)** - Importação e exportação Excel
- **[Expo Document Picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)** - Seleção de arquivos
- **[Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)** - Manipulação de arquivos
- **[Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)** - Compartilhamento de arquivos

### Dev Tools

- **[Reactotron](https://github.com/infinitered/reactotron)** - Debug
- **[Prettier](https://prettier.io/)** - Formatação de código
- **[ESLint](https://eslint.org/)** - Linting

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com separação clara de responsabilidades:

```text
src/
├── app/                    # Screens (Expo Router)
├── application/            # Camada de aplicação
│   ├── hooks/              # React Query hooks
│   └── services/           # Serviços de aplicação
├── domain/                 # Camada de domínio
│   ├── entities/           # Entidades de negócio
│   ├── repositories/       # Interfaces de repositórios
│   └── validations/        # Schemas de validação (Zod)
├── infra/                  # Camada de infraestrutura
│   ├── db/                 # Configuração do banco
│   └── repositories/       # Implementação dos repositórios
├── components/             # Componentes reutilizáveis
│   └── ui/                 # Componentes de interface
├── lib/                    # Utilitários e helpers
└── types/                  # Definições de tipos TypeScript
```

### Camadas

#### 1. Domain (Domínio)

- **Entities**: Classes que representam os conceitos principais do negócio
- **Repositories**: Interfaces que definem contratos de acesso a dados
- **Validations**: Schemas Zod para validação de dados
- **Value Objects**: Objetos imutáveis que representam conceitos do domínio

#### 2. Application (Aplicação)

- **Hooks**: Custom hooks usando TanStack Query para gerenciamento de estado
- **Services**: Lógica de aplicação (WhatsApp, Pagamentos, Geocoding)

#### 3. Infrastructure (Infraestrutura)

- **DB**: Configuração Drizzle e migrations
- **Repositories**: Implementação concreta dos repositórios usando Drizzle

#### 4. Presentation (Apresentação)

- **App**: Screens do aplicativo (Expo Router)
- **Components**: Componentes React reutilizáveis

## 📦 Pré-requisitos

- **Node.js** >= 18.x
- **Yarn** (recomendado) ou npm
- **Expo CLI**
- **Android Studio** (para Android) ou **Xcode** (para iOS)
- **EAS CLI** (para builds)

## 🔧 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/Gabriel-Aguiar-Reis/artemis.git
cd artemis
```

2. **Instale as dependências**

```bash
yarn install
# ou
npm install
```

3. **Inicie o desenvolvimento**

```bash
yarn dev
# ou
npm run dev
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev              # Inicia o servidor Expo (limpa cache)
yarn android          # Inicia no Android
yarn ios              # Inicia no iOS
yarn web              # Inicia na web

# Build (Development)
yarn build:dev:android    # Build de desenvolvimento Android (EAS)
yarn build:dev:ios        # Build de desenvolvimento iOS (EAS)

# Build (Production)
yarn build:prod:android   # Build de produção Android (EAS)
yarn build:prod:ios       # Build de produção iOS (EAS)

# Utilitários
yarn clean            # Remove .expo e node_modules
```

## 📁 Estrutura do Projeto

```
artemis/
├── src/
│   ├── app/                          # Screens (file-based routing)
│   │   ├── _layout.tsx               # Layout raiz
│   │   ├── index.tsx                 # Tela inicial
│   │   ├── admin/                    # Funcionalidades admin
│   │   │   ├── data-transfer.tsx.    # Import e Export de planilha template
│   │   │   └── generate-license.tsx  # Geração de licenças
│   │   ├── categories/               # Gestão de categorias
│   │   │   ├── index.tsx
│   │   │   ├── form.tsx
│   │   │   ├── search.tsx
│   │   │   └── [id]/
│   │   ├── customers/                # Gestão de clientes
│   │   │   ├── index.tsx
│   │   │   ├── form.tsx
│   │   │   ├── search.tsx
│   │   │   └── [id]/
│   │   ├── products/                 # Gestão de produtos
│   │   │   ├── index.tsx
│   │   │   ├── form.tsx
│   │   │   ├── search.tsx
│   │   │   └── [id]/
│   │   ├── work-orders/              # Ordens de serviço
│   │   │   ├── index.tsx
│   │   │   ├── form.tsx
│   │   │   ├── search.tsx
│   │   │   └── [id]/
│   │   ├── itinerary/                # Itinerários
│   │   │   ├── index.tsx
│   │   │   ├── form.tsx
│   │   │   ├── finish.tsx
│   │   │   ├── reorder.tsx
│   │   │   └── search.tsx
│   │   └── license/                  # Licenciamento
│   │       └── renew.tsx
│   │
│   ├── application/
│   │   ├── hooks/                    # React Query hooks
│   │   │   ├── category.hooks.ts
│   │   │   ├── customer.hooks.ts
│   │   │   ├── product.hooks.ts
│   │   │   ├── work-order.hooks.ts
│   │   │   ├── itinerary.hooks.ts
│   │   │   ├── license.hooks.ts
│   │   │   └── ...
│   │   └── services/                 # Serviços
│   │       ├── excel.service.ts
│   │       ├── whatsapp.service.ts
│   │       ├── payment.service.ts
│   │       └── geocoding.service.ts
│   │
│   ├── domain/
│   │   ├── entities/                 # Entidades de domínio
│   │   │   ├── customer/
│   │   │   │   ├── customer.entity.ts
│   │   │   │   ├── mapper/
│   │   │   │   └── value-objects/
│   │   │   ├── product/
│   │   │   ├── category/
│   │   │   ├── work-order/
│   │   │   ├── itinerary/
│   │   │   ├── license/
│   │   │   └── ...
│   │   ├── repositories/             # Interfaces de repositórios
│   │   └── validations/              # Schemas Zod
│   │
│   ├── infra/
│   │   ├── db/
│   │   │   └── drizzle/
│   │   │       ├── drizzle-client.ts
│   │   │       ├── migrations/
│   │   │       └── schema/
│   │   └── repositories/             # Implementações
│   │
│   ├── components/
│   │   └── ui/                       # Componentes UI
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── work-order-card.tsx
│   │       ├── action-sheet/
│   │       ├── forms/
│   │       └── ...
│   │
│   ├── lib/                          # Utilitários
│   │   ├── utils.ts
│   │   ├── theme.ts
│   │   └── license-crypto.ts
│   │
│   └── assets/
│       ├── template-app-preenchimento.tsx
│       └── images/
│
├── app.json                          # Configuração Expo
├── eas.json                          # Configuração EAS Build
├── drizzle.config.ts                 # Configuração Drizzle
├── tailwind.config.js                # Configuração Tailwind
├── tsconfig.json                     # Configuração TypeScript
├── babel.config.js
├── metro.config.js
└── package.json
```

## 🎨 Entidades do Domínio

### Customer (Cliente)

```typescript
class Customer {
  id: UUID
  storeName: string // Nome da loja
  contactName: string // Nome do contato
  storeAddress: Address // Value Object
  phoneNumber?: SmartphoneNumber // Value Object (telefone celular)
  landlineNumber?: LandlinePhoneNumber // Value Object (telefone fixo)

  // Métodos
  isActiveWhatsApp(): boolean
  getMainNumber(): {
    value: string
    type: 'smartphone' | 'landline'
    isWhatsApp: boolean
  } | null
}
```

### Product (Produto)

```typescript
class Product {
  id: UUID
  name: string
  categoryId: UUID
  salePrice: number // Preço de venda
  isActive: boolean // Produto ativo/inativo
  expiration: Expiration // Value Object (validade)

  // Métodos
  isExpired(referenceDate?: Date): boolean
}
```

### Category (Categoria)

```typescript
class Category {
  id: UUID
  name: string
  isActive: boolean // Categoria ativa/inativa
}
```

### WorkOrder (Ordem de Serviço)

```typescript
enum WorkOrderStatus {
  PENDING = 'PENDING',
  COMMITTED = 'COMMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  COPIED = 'COPIED',
}

class WorkOrder {
  id: UUID
  customer: Customer // Objeto Customer completo
  scheduledDate: Date // Data agendada
  visitDate?: Date // Data da visita real
  notes?: string // Observações
  status: WorkOrderStatus
  paymentOrder?: PaymentOrder // Ordem de pagamento
  products?: WorkOrderItem[] // Produtos agendados
  result?: WorkOrderResult // Resultado da visita
  createdAt: Date
  updatedAt: Date

  // Métodos
  addProduct(product: Product, quantity: number): void
  removeProduct(productId: UUID): void
  updateProductQuantity(productId: UUID, quantity: number): void
  getTotalValue(): number
}
```

### Itinerary (Itinerário)

```typescript
class Itinerary {
  id: UUID
  initialItineraryDate: Date // Data inicial do itinerário
  finalItineraryDate: Date // Data final do itinerário
  isFinished: boolean // Itinerário finalizado
  workOrders: ItineraryWorkOrder[] // Ordens de serviço no itinerário

  // Métodos
  addWorkOrder(workOrder: WorkOrder): void
  markLateOrders(toleranceMinutes?: number): void
  finish(): void
  reopenItinerary(): void
}
```

### License (Licença)

```typescript
class License {
  id: UUID
  uniqueCode: string
  expirationDate: Date
  isAdmin: boolean
  createdAt: Date

  isExpired(): boolean
  isLifetime(): boolean
  getDaysRemaining(): number
}
```

## 📊 Importação e Exportação de Dados

O Artemis possui um sistema completo de importação e exportação de dados via planilhas Excel:

### Funcionalidades

#### Download de Template

- Template Excel pré-configurado com 3 abas (Categorias, Produtos, Clientes)
- Exemplos de preenchimento em cada aba
- Compartilhamento nativo do sistema para salvar em qualquer local

#### Importação de Dados

- Importação em lote de categorias, produtos e clientes
- Validação em tempo real durante a importação
- Tratamento automático de referências cruzadas (categorias → produtos)
- Mensagens de erro detalhadas indicando linha e problema
- Logs completos para debugging

### Formato do Campo de Validade (Produtos)

O campo "validade" aceita múltiplos formatos flexíveis:

- **Com espaço**: `30 dias`, `1 mês`, `2 semanas`, `1 ano`
- **Sem espaço**: `30dias`, `1mês`, `2semanas`
- **Abreviado**: `30 d`, `2 s`, `1 m`, `1 a`
- **Variações**: Aceita maiúsculas/minúsculas e com/sem acento
- **Plurais**: Detecta automaticamente singular/plural

Exemplos válidos:

```
30 dias
30dias
30 DIAS
1 mês
1 mes
2 semanas
2s
1a
```

A validação normaliza automaticamente o formato ao salvar no banco.

### Estrutura das Planilhas

#### Categorias

- **Nome**: Nome da categoria (obrigatório)
- **Ativo**: 1 para ativo, 0 para inativo

#### Produtos

- **Nome**: Nome do produto (obrigatório)
- **Categoria**: Nome exato da categoria (deve existir na aba Categorias)
- **Preço de Venda**: Valor numérico
- **Ativo**: 1 para ativo, 0 para inativo
- **Validade**: Formato flexível (ex: "30 dias", "1 mês")

#### Clientes

- **Nome Estabelecimento**: Nome da loja (obrigatório)
- **Nome Contato**: Nome da pessoa de contato (obrigatório)
- **Telefone Celular**: Número completo com DDI
- **WhatsApp Celular**: 1 se tem WhatsApp, 0 caso contrário
- **Telefone Fixo**: Número completo
- **WhatsApp Fixo**: 1 se tem WhatsApp, 0 caso contrário
- **Logradouro**: Nome da rua
- **Número**: Número do endereço
- **Bairro**: Nome do bairro
- **Cidade**: Nome da cidade
- **CEP**: Formato 01234-567

### Validações e Tratamento de Erros

- ✅ Validação de campos obrigatórios
- ✅ Validação de tipos de dados
- ✅ Validação de foreign keys (categorias em produtos)
- ✅ Mensagens de erro com número da linha
- ✅ Continuação da importação mesmo com erros em linhas específicas
- ✅ Resumo final com quantidade importada

## 🔐 Sistema de Licenças

O Artemis possui um sistema de licenciamento integrado para controle de uso:

### Tipos de Licença

- **Normal**: Licença com prazo de validade
- **Admin**: Licença vitalícia com privilégios especiais
- **Lifetime**: Licença vitalícia (expiração em 2150+)

### Funcionalidades

- ✅ Geração de códigos de ativação criptografados
- ✅ Validação de licenças
- ✅ Renovação de licenças
- ✅ Bloqueio automático quando expirada
- ✅ Modo administrador para testes

### Fluxo de Ativação

1. O app gera um código único ao primeiro uso
2. Usuário compartilha o código com o administrador
3. Administrador gera chave de ativação
4. Usuário insere a chave no app
5. Licença é ativada e validada

## 🎨 Temas e Estilos

O projeto utiliza **NativeWind** (Tailwind CSS) com suporte a:

- 🌗 Modo claro/escuro automático
- 🎨 Sistema de cores customizável (HSL)
- 📱 Design responsivo
- ♿ Componentes acessíveis

## 🚀 Build e Deploy

### Development Build

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

### Production Build

```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

### Configuração EAS

- **Project ID**: `2bb468aa-893d-4448-8274-4472d488da50`
- **Bundle ID (iOS)**: `com.gabrielaguiar.artemis`
- **Package (Android)**: `com.gabrielaguiar.artemis`

## 🧪 Boas Práticas Implementadas

- ✅ **Clean Architecture** e **DDD**
- ✅ **TypeScript** com strict mode
- ✅ **Type-safe routing** com Expo Router
- ✅ **Server state** com TanStack Query
- ✅ **Validação** com Zod
- ✅ **Migrations** versionadas com Drizzle
- ✅ **Componentes reutilizáveis** e acessíveis
- ✅ **Otimização de performance** (FlashList, Reanimated)
- ✅ **Code splitting** por funcionalidade
- ✅ **Formatação automática** com Prettier

## 🔄 Fluxos Principais

### Criar Ordem de Serviço

1. Selecionar cliente
2. Definir data de agendamento
3. Adicionar produtos agendados
4. Adicionar observações (opcional)
5. Salvar ordem de serviço
6. Enviar resumo por WhatsApp (opcional)

### Gerenciar Itinerário

1. Criar novo itinerário (data atual)
2. Adicionar ordens de serviço ao itinerário
3. Reordenar visitas por arraste
4. Executar visitas e registrar resultados
5. Finalizar itinerário

### Registrar Resultado de Visita

1. Abrir ordem de serviço no itinerário
2. Adicionar produtos vendidos
3. Registrar pagamento (se houver)
4. Marcar como concluída
5. Enviar confirmação por WhatsApp

## 📱 Suporte de Plataformas

- ✅ Android
- ✅ iOS
- ⚠️ Web (experimental)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e de uso restrito.

## 👨‍💻 Autor

Gabriel Aguiar Reis

- GitHub: [@Gabriel-Aguiar-Reis](https://github.com/Gabriel-Aguiar-Reis)

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através do repositório.

---

Desenvolvido com ❤️ usando React Native e Expo
