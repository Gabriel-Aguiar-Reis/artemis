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

## Mapa de Dependências (diretas, não transitivas)

`getQueryKeysToInvalidate(key)` devolve a própria key mais as dependências
**diretas** listadas em `QUERY_DEPENDENCIES`. Não há mais fecho transitivo:
antes, mexer em um cliente acabava refazendo `workOrderItems`,
`workOrderResults` e `workOrderResultItems` sem necessidade. Cada lista agora
contém só o que realmente embute o dado alterado.

| Mutação em | Invalida | Motivo |
| --- | --- | --- |
| `customers` | `workOrders`, `itineraries`, `itineraryWorkOrders` | OS e itinerário exibem nome/endereço/telefone do cliente (join) |
| `workOrders` | `itineraries`, `itineraryWorkOrders`, `workOrderItems`, `workOrderResults`, `workOrderResultItems` | escrita de OS toca itinerário, itens e resultado |
| `workOrderItems` | `workOrders`, `itineraries` | OS e itinerário carregam os itens |
| `itineraries` | `itineraryWorkOrders` | |
| `itineraryWorkOrders` | `itineraries`, `workOrders` | |
| `products` | `workOrders`, `itineraries`, `workOrderItems`, `workOrderResultItems` | nome do produto aparece nos itens |
| `categories` | `products` | só a lista de produtos mostra a categoria; OS não depende dela |
| `paymentOrders` | `workOrders`, `itineraries` | itinerário faz join com pagamento |
| `workOrderResults` | `workOrders`, `itineraries`, `workOrderResultItems` | |
| `workOrderResultItems` | `workOrders`, `itineraries`, `workOrderResults` | |
| `license` | (nenhuma) | |

Observação: como a OS mostra o nome do cliente (e itens mostram nome do
produto), `customers`/`products` continuam invalidando `workOrders`. O custo
foi reduzido por `refetchType: 'active'` (abaixo), não removendo a dependência.

## Estratégia de refetch

- `create-repository-hooks.ts` e `useInvalidateQueries` usam
  `refetchType: 'active'`: só queries montadas refazem a consulta
  imediatamente; as demais ficam marcadas como stale e recarregam quando a
  tela é aberta. Antes (`'all'`) toda lista de OS/itinerário, mesmo fora da
  tela, era recarregada a cada mutação.
- `structuralSharing` está no padrão (ligado) no `QueryClient`, preservando a
  identidade de objetos inalterados (menos re-render). Entidades de domínio
  são instâncias de classe e são tratadas como valores opacos.
- `staleTime`: 5 min para dados cadastrais (`customers`, `products`,
  `categories`), pois toda mutação os invalida; 30 s para o resto.
- Infinite queries (se existirem) devem usar a key raiz da entidade
  (`['workOrders', ...]`, `['customers', ...]`) para serem alcançadas por
  `invalidateQueries({ queryKey: [key] })`. Nesta branch ainda não existem
  `use-work-orders-infinite.ts` / `use-customers-infinite.ts`.

## Erros de exclusão (FK restrict)

`create-repository-hooks.ts` converte `FOREIGN KEY constraint failed` em
mensagem amigável (ex.: "Este cliente possui ordens de serviço e não pode ser
excluído.") no toast de erro.

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
4. Verifique se o `staleTime` não está muito alto (30 s por padrão; 5 min para dados cadastrais)

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
