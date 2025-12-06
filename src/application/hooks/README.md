# Hooks de Aplicação

Este diretório contém todos os hooks customizados da aplicação, incluindo hooks de repositório e utilitários.

## Sistema de Invalidação de Queries

### ⚠️ Importante: Dados Obsoletos Resolvidos!

Foi implementado um sistema automático de invalidação de queries que resolve definitivamente o problema de dados obsoletos entre entidades relacionadas.

### Como Funciona

Quando você modifica qualquer entidade (customer, workOrder, product, etc.), **automaticamente** todas as queries relacionadas são invalidadas e atualizadas.

#### Exemplo:

```typescript
const { mutate: updateCustomer } = customerHooks.updateCustomer()

updateCustomer(customerData)
// ✅ Automaticamente invalida:
// - customers (a própria query)
// - workOrders (ordens desse cliente)
// - itineraries (itinerários com ordens desse cliente)
// - itineraryWorkOrders (relações nos itinerários)
```

### Documentação Completa

Para entender o sistema completo, veja:

- **[docs/QUERY_INVALIDATION.md](../../../docs/QUERY_INVALIDATION.md)** - Documentação detalhada
- **[examples/query-invalidation-examples.ts](./examples/query-invalidation-examples.ts)** - Exemplos práticos

### Arquivos do Sistema

- `query-invalidation.config.ts` - Configuração centralizada de dependências
- `create-repository-hooks.ts` - Factory que cria hooks com invalidação automática
- `use-invalidate-queries.ts` - Hook para invalidação manual quando necessário

### Hooks Disponíveis

Todos os hooks abaixo já incluem invalidação automática:

- `customerHooks` - Gerenciamento de clientes
- `workOrderHooks` - Gerenciamento de ordens de serviço
- `productHooks` - Gerenciamento de produtos
- `categoryHooks` - Gerenciamento de categorias
- `itineraryHooks` - Gerenciamento de itinerários
- `itineraryWorkOrderHooks` - Gerenciamento de ordens nos itinerários
- `paymentOrderHooks` - Gerenciamento de pedidos de pagamento
- `workOrderResultHooks` - Gerenciamento de resultados
- `workOrderResultItemHooks` - Gerenciamento de items de resultado
- `workOrderItemHooks` - Gerenciamento de items de ordem

### Uso Básico

```typescript
import { customerHooks } from '@/src/application/hooks/customer.hooks'

function MyComponent() {
  // Queries (leitura)
  const { data: customers } = customerHooks.getCustomers()
  const { data: customer } = customerHooks.getCustomer(id)

  // Mutations (escrita) - com invalidação automática
  const { mutate: addCustomer } = customerHooks.addCustomer()
  const { mutate: updateCustomer } = customerHooks.updateCustomer()
  const { mutate: deleteCustomer } = customerHooks.deleteCustomer()

  // Usar é simples:
  addCustomer(newCustomerData) // Invalida automaticamente tudo relacionado
}
```

### Invalidação Manual (raramente necessário)

```typescript
import { useInvalidateQueries } from '@/src/application/hooks/use-invalidate-queries'

function MyComponent() {
  const invalidate = useInvalidateQueries()

  const handleSpecialCase = () => {
    // Invalida customers e todas dependências
    invalidate('customers')

    // Ou múltiplas queries
    invalidate(['customers', 'products'])
  }
}
```

### Adicionar Nova Entidade

1. Adicione o tipo em `query-invalidation.config.ts`
2. Defina as dependências no `QUERY_DEPENDENCIES`
3. Crie o hook usando `createRepositoryHooks` com a query key correta

Veja a documentação completa para mais detalhes.
