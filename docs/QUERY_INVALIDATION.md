# Sistema de Invalidação de Queries - TanStack Query

## Problema Resolvido

Antes, quando você modificava uma entidade (ex: `customer`), apenas as queries dessa entidade eram invalidadas. Isso causava dados obsoletos em outras partes do app que dependem desse dado. Por exemplo:

- Atualizar um `customer` → `workOrders` continuavam com dados antigos do customer
- Atualizar um `product` → `workOrderItems` continuavam com dados antigos do produto
- Adicionar/remover `itineraryWorkOrder` → `itineraries` e `workOrders` ficavam desatualizados

## Solução Implementada

### 1. Configuração Centralizada de Dependências

Arquivo: `src/application/hooks/query-invalidation.config.ts`

Define o mapa de dependências entre todas as entidades do sistema:

```typescript
export const QUERY_DEPENDENCIES: Record<QueryKey, QueryKey[]> = {
  customers: ['workOrders', 'itineraries', 'itineraryWorkOrders'],
  workOrders: ['itineraries', 'itineraryWorkOrders', 'workOrderItems', ...],
  // ... etc
}
```

### 2. Invalidação Automática

Quando você usa qualquer hook de mutação (`addCustomer`, `updateWorkOrder`, etc.), **automaticamente** todas as queries relacionadas são invalidadas.

#### Exemplo:

```typescript
// Quando você faz isso:
const { mutate: updateCustomer } = customerHooks.updateCustomer()
updateCustomer(customerData)

// Automaticamente invalida:
// ✅ customers (a query principal)
// ✅ workOrders (depende de customers)
// ✅ itineraries (depende de customers)
// ✅ itineraryWorkOrders (depende de customers)
```

### 3. Invalidação Manual (quando necessário)

Para casos especiais, você pode invalidar queries manualmente:

```typescript
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'

function MyComponent() {
  const invalidate = useInvalidateQueries()

  const handleSpecialAction = () => {
    // ... alguma ação

    // Invalida customers e TODAS suas dependências
    invalidate('customers')

    // Ou invalida múltiplas queries
    invalidate(['customers', 'products'])
  }
}
```

## Mapa de Dependências

### Customers

Quando modificado, invalida:

- `workOrders` - ordens de serviço do cliente
- `itineraries` - itinerários que contêm ordens do cliente
- `itineraryWorkOrders` - relações de ordens nos itinerários

### Work Orders

Quando modificado, invalida:

- `itineraries` - itinerários que contêm essa ordem
- `itineraryWorkOrders` - relações nos itinerários
- `workOrderItems` - items da ordem
- `workOrderResults` - resultados da ordem
- `workOrderResultItems` - items dos resultados

### Products

Quando modificado, invalida:

- `workOrderItems` - items que usam esse produto
- `workOrderResultItems` - resultados que usam esse produto
- `workOrders` - ordens que contêm esses items

### Categories

Quando modificado, invalida:

- `products` - produtos dessa categoria
  - E por cascata, tudo que depende de products

### Payment Orders

Quando modificado, invalida:

- `workOrders` - ordens com esse pagamento

### Itineraries

Quando modificado, invalida:

- `itineraryWorkOrders` - ordens no itinerário

### Itinerary Work Orders

Quando modificado, invalida:

- `itineraries` - itinerário pai
- `workOrders` - ordens relacionadas

## Como Adicionar Novas Entidades

1. **Adicione o tipo da query key em `query-invalidation.config.ts`:**

```typescript
export type QueryKey = 'customers' | 'workOrders' | 'suaNovaEntidade' // ← adicione aqui
```

2. **Defina as dependências em `QUERY_DEPENDENCIES`:**

```typescript
export const QUERY_DEPENDENCIES: Record<QueryKey, QueryKey[]> = {
  // ... outras entidades
  suaNovaEntidade: ['entidadesQueDependemDela'],
}
```

3. **Use no hook:**

```typescript
export const suaNovaEntidadeHooks = createRepositoryHooks(
  repo,
  'suaNovaEntidade', // ← deve corresponder ao QueryKey
  'sua nova entidade',
  'F'
)
```

## Benefícios

✅ **Dados sempre atualizados** - Não há mais dados obsoletos em nenhuma parte do app
✅ **Manutenção fácil** - Configuração centralizada em um único arquivo
✅ **Automático** - Funciona transparentemente sem código adicional
✅ **Type-safe** - TypeScript garante que você use query keys válidas
✅ **Performance** - Invalida apenas o necessário (sem invalidações em excesso)

## Troubleshooting

### Ainda vejo dados obsoletos?

1. Verifique se a query key está corretamente mapeada em `QUERY_DEPENDENCIES`
2. Confirme que o hook está usando `createRepositoryHooks` com a query key correta
3. Use `useInvalidateQueries` manualmente se necessário
4. Verifique se o `staleTime` não está muito alto (padrão: 5 minutos)

### Como debugar invalidações?

Você pode adicionar logs temporariamente em `create-repository-hooks.ts`:

```typescript
onSuccess: () => {
  const keysToInvalidate = getQueryKeysToInvalidate(key)
  console.log(`Invalidating for ${key}:`, keysToInvalidate)
  // ... resto do código
}
```

## Exemplos Práticos

### Cenário 1: Atualizar cliente

```typescript
// Antes (PROBLEMA):
updateCustomer(data) // ❌ workOrders ficavam com dados antigos

// Agora (RESOLVIDO):
updateCustomer(data) // ✅ workOrders são automaticamente atualizadas
```

### Cenário 2: Adicionar produto ao resultado da ordem

```typescript
const { mutate: addResultItem } =
  workOrderResultItemHooks.addWorkOrderResultItem()

addResultItem(data)
// ✅ Automaticamente invalida:
// - workOrderResultItems
// - workOrders (por dependência)
// - workOrderResults (por dependência)
```

### Cenário 3: Reordenar itinerário

```typescript
const { mutate: updatePositions } = itineraryWorkOrderHooks.updatePositions()

updatePositions(data)
// ✅ Automaticamente invalida:
// - itineraryWorkOrders
// - itineraries (por dependência)
// - workOrders (por dependência)
```
