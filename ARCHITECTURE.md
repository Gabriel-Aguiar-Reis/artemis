# Artemis - Implementação Completa da Arquitetura

## Resumo das Mudanças

Este documento descreve a arquitetura DDD implementada, incluindo a refatoração completa para normalização do banco de dados (eliminando JSON serialization).

## ⚠️ Refatoração Importante (Última Atualização)

**Data:** Refatoração completa DDD - Normalização do banco de dados

**Mudança:** Eliminação de JSON serialization de entidades, implementando tabelas intermediárias normalizadas.

**Documentos relacionados:**

- `REFACTORING_SUMMARY.md` - Detalhes técnicos da refatoração
- `MIGRATION_GUIDE.md` - Guia de migração de dados

## Estrutura Implementada

### 1. **Entities (Entidades de Domínio)**

Todas as entidades seguem os princípios de DDD com:

- DTOs de serialização
- Métodos `toDTO()` e `fromDTO()`
- Validações de negócio
- Agregados ricos (não são serializados como JSON)

#### Entidades Implementadas:

- ✅ `Category`
- ✅ `Customer` (com value objects: Address, PhoneNumber, Coordinates)
- ✅ `Product` (com value object: Expiration)
- ✅ `WorkOrder` (com entidades relacionadas: WorkOrderItem, WorkOrderMapItem)
- ✅ `WorkOrderResult` (com WorkOrderResultItem)
- ✅ `PaymentOrder`
- ✅ `Itinerary`

#### Mudanças Importantes:

**WorkOrderItem:**

- **Antes:** Clonava dados do produto (productId, name, price, etc.)
- **Depois:** Referencia `Product` entity com `priceSnapshot`
- **Benefício:** Eliminação de duplicação, preços históricos preservados

**WorkOrderResultItem:**

- **Antes:** Dados de produto duplicados em JSON
- **Depois:** Referencia `Product` entity com `priceSnapshot` e `type` (exchanged/added/removed)
- **Benefício:** Normalização, integridade referencial

### 2. **Mappers**

Criados para converter entre entidades de domínio e tabelas do banco de dados:

```
src/domain/entities/
├── category/mapper/category.mapper.ts
├── customer/mapper/customer.mapper.ts
├── product/mapper/product.mapper.ts
├── payment-order/mapper/payment-order.mapper.ts
├── work-order/mapper/work-order.mapper.ts
├── itinerary/mapper/itinerary.mapper.ts
└── work-order-result/mapper/work-order-result.mapper.ts
```

**Responsabilidades:**

- `toDomain()`: Converte tabela do DB para entidade (pode receber arrays de items relacionados)
- `toPersistence()`: Converte entidade para tabela do DB

**Mudanças importantes:**

- Mappers agora recebem arrays de items relacionados em vez de parsear JSON
- `WorkOrderMapper.toDomain(table, customer, paymentOrder, items, result?)`
- `ItineraryMapper.toDomain(table, workOrdersMap)`
- `WorkOrderResultMapper.toDomain(table, exchangedProducts, addedProducts?, removedProducts?)`

### 3. **Schemas do Drizzle**

Definições de tabelas SQLite usando Drizzle ORM:

```
src/infra/db/drizzle/schema/
├── drizzle.category.schema.ts
├── drizzle.customer.schema.ts
├── drizzle.product.schema.ts
├── drizzle.payment-order.schema.ts
├── drizzle.work-order.schema.ts
├── drizzle.itinerary.schema.ts
├── drizzle.work-order-result.schema.ts
├── drizzle.work-order-items.schema.ts (NOVO - tabela intermediária)
├── drizzle.itinerary-work-orders.schema.ts (NOVO - tabela intermediária)
├── drizzle.work-order-result-items.schema.ts (NOVO - tabela intermediária)
└── index.ts (exporta todos os schemas)
```

**Características:**

- Type-safe com InferSelectModel e InferInsertModel
- Validação de estrutura usando `satisfies`
- Suporte completo para SQLite
- **Foreign keys com CASCADE DELETE** para integridade referencial

#### Tabelas Intermediárias (Normalização)

**`work_order_items`:**

- Relaciona `work_order` ↔ `product` (many-to-many)
- Campos: `workOrderId`, `productId`, `quantity`, `priceSnapshot`
- Benefício: Elimina JSON serialization, preserva preços históricos

**`itinerary_work_orders`:**

- Relaciona `itinerary` ↔ `work_order` (many-to-many com ordem)
- Campos: `itineraryId`, `workOrderId`, `position`, `isLate`
- Benefício: Ordem preservada, sem duplicação de work orders

**`work_order_result_items`:**

- Armazena items de resultado (exchanged/added/removed)
- Campos: `resultId`, `productId`, `quantity`, `priceSnapshot`, `type`, `observation`
- Benefício: Tipagem explícita, histórico normalizado

### 4. **Repositories**

#### Interfaces Abstratas (Contratos):

```
src/domain/repositories/
├── category/category.repository.ts
├── customer/customer.repository.ts
├── product/product.repository.ts
├── payment-order/payment-order.repository.ts
└── work-order/work-order.repository.ts
```

#### DTOs:

```
src/domain/repositories/
├── category/dtos/
│   ├── add-category.dto.ts
│   └── update-category.dto.ts
├── customer/dtos/
│   ├── add-customer.dto.ts
│   └── update-customer.dto.ts
├── product/dtos/
│   ├── add-product.dto.ts
│   └── update-product.dto.ts
├── payment-order/dtos/
│   ├── add-payment-order.dto.ts
│   └── update-payment-order.dto.ts
└── work-order/dtos/
    ├── add-work-order.dto.ts
    └── update-work-order.dto.ts
```

#### Implementações Drizzle:

```
src/infra/repositories/drizzle/
├── drizzle.category.repository.ts
├── drizzle.customer.repository.ts
├── drizzle.product.repository.ts
├── drizzle.payment-order.repository.ts
├── drizzle.work-order.repository.ts
└── drizzle.itinerary.repository.ts
```

**Práticas Importantes:**

1. **Uso de Entidades de Domínio:**
   - Repositories SEMPRE usam métodos das entidades
   - Nunca bypassam validações com updates diretos
   - Exemplo: `workOrder.complete()` em vez de `update({ status: 'completed' })`

2. **Transações para Atomicidade:**

   ```typescript
   async updateWorkOrder(wo: WorkOrder): Promise<void> {
     await this.db.transaction(async (tx) => {
       // Update principal
       await tx.update(workOrder).set(table).where(eq(workOrder.id, wo.id))

       // Sincronizar items relacionados
       await tx.delete(workOrderItems).where(eq(workOrderItems.workOrderId, wo.id))
       for (const item of wo.products) {
         await tx.insert(workOrderItems).values(...)
       }
     })
   }
   ```

3. **Eager Loading com Helpers:**

   ```typescript
   private async loadWorkOrderItems(workOrderId: UUID): Promise<WorkOrderItem[]> {
     const rows = await this.db
       .select()
       .from(workOrderItems)
       .leftJoin(product, eq(workOrderItems.productId, product.id))
       .where(eq(workOrderItems.workOrderId, workOrderId))

     return rows.map(row => new WorkOrderItem(
       ProductMapper.toDomain(row.product!),
       row.work_order_items.quantity,
       row.work_order_items.priceSnapshot
     ))
   }
   ```

4. **Cascade Deletes Automáticos:**
   - Foreign keys configuradas com `ON DELETE CASCADE`
   - Deletar work order → deleta items automaticamente
   - Deletar itinerary → deleta associações
   - **IMPORTANTE:** Deletar produto usado em histórico deve falhar (constraint violation)

**Métodos Implementados (exemplo Category):**

- `getCategories()`: Buscar todas
- `addCategory(dto)`: Adicionar nova
- `updateCategory(dto)`: Atualizar existente
- `deleteCategory(id)`: Deletar
- `getCategory(id)`: Buscar por ID
- `getActiveCategories()`: Buscar apenas ativas
- `updateDisableCategory(id)`: Desativar

### 5. **Hooks (React Query)**

Factory function que gera hooks automaticamente:

```typescript
// src/application/hooks/create-repository-hooks.ts
createRepositoryHooks(repo, key)
```

**Hooks Criados:**

```
src/application/hooks/
├── category.hooks.ts
├── customer.hooks.ts
├── product.hooks.ts
├── payment-order.hooks.ts
└── work-order.hooks.ts
```

**Uso:**

```typescript
const { data, isLoading } = categoryHooks.getCategories()
const { mutate } = categoryHooks.addCategory()
```

### 6. **Database Migrations**

```
src/infra/db/drizzle/migrations.ts
```

Função `initDatabase()` que:

- Cria todas as tabelas se não existirem
- Usa SQL direto para compatibilidade com expo-sqlite
- É chamada no `_layout.tsx` durante inicialização do app

### 7. **Telas (UI)**

#### Categories

- ✅ `app/categories/index.tsx` - Lista com hooks
- ✅ `app/categories/form.tsx` - Formulário com react-hook-form + zod

#### Customers

- ✅ `app/customers/index.tsx` - Atualizada para usar hooks
- ✅ `app/customers/form.tsx` - Refatorada com react-hook-form + zod

#### Products

- ✅ `app/products/index.tsx` - Atualizada para usar hooks
- ✅ `app/products/form.tsx` - Refatorada com react-hook-form + zod

#### Work Orders

- ⚠️ `app/work-orders/index.tsx` - Existente (precisa atualização)
- ⚠️ `app/work-orders/form.tsx` - Existente (precisa atualização)

## Padrão de Arquitetura

```
┌─────────────────────────────────────────────┐
│           UI Layer (React Components)        │
│  - Telas com react-hook-form + zod          │
│  - Usa hooks do React Query                 │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│        Application Layer (Hooks)             │
│  - createRepositoryHooks factory            │
│  - Auto-gera useQuery/useMutation           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Domain Layer (Business Logic)        │
│  - Entities com validações                  │
│  - Repository interfaces (contratos)        │
│  - DTOs                                      │
│  - Mappers                                   │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│      Infrastructure Layer (Persistence)      │
│  - Drizzle ORM Schemas                      │
│  - Repository implementations               │
│  - Database client                          │
└─────────────────────────────────────────────┘
```

## Como Adicionar Nova Entidade

1. **Criar Entity** em `src/domain/entities/[nome]/`
2. **Criar Mapper** em `src/domain/entities/[nome]/mapper/`
3. **Criar Schema Drizzle** em `src/infra/db/drizzle/schema/`
4. **Criar Repository Interface** em `src/domain/repositories/[nome]/`
5. **Criar DTOs** em `src/domain/repositories/[nome]/dtos/`
6. **Implementar Repository** em `src/infra/repositories/drizzle/`
7. **Criar Hooks** em `src/application/hooks/`
8. **Adicionar migração** em `migrations.ts`
9. **Criar telas UI** com os hooks

## Benefícios da Arquitetura

✅ **Separação de Responsabilidades**: Cada camada tem responsabilidade clara
✅ **Type Safety**: TypeScript em todas as camadas
✅ **Testabilidade**: Fácil mockar repositories e testar lógica
✅ **Manutenibilidade**: Mudanças isoladas em cada camada
✅ **Escalabilidade**: Fácil adicionar novas entidades
✅ **Reusabilidade**: Factory de hooks reutilizável
✅ **Performance**: React Query com cache automático
✅ **Developer Experience**: Código limpo e organizado

## Próximos Passos

1. ⚠️ Atualizar telas de Work Orders para usar hooks
2. 🔄 Implementar telas de Itinerary
3. ✨ Adicionar testes unitários
4. 📱 Adicionar feedback visual de loading/erro
5. 🔐 Implementar validações adicionais
6. 📊 Adicionar analytics/monitoring
