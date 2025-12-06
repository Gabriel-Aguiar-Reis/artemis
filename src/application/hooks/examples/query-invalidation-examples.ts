/**
 * Arquivo de exemplo demonstrando como usar o sistema de invalidação de queries
 *
 * Este arquivo NÃO deve ser importado no código de produção.
 * Serve apenas como referência e documentação.
 */

import { useQueryClient } from '@tanstack/react-query'
import { customerHooks } from '../customer.hooks'
import { productHooks } from '../product.hooks'
import { useInvalidateQueries } from '../use-invalidate-queries'
import { workOrderHooks } from '../work-order.hooks'

// ============================================================================
// EXEMPLO 1: Uso Normal - Invalidação Automática
// ============================================================================

export function ExampleCustomerUpdate() {
  // Quando você atualiza um customer, AUTOMATICAMENTE invalida:
  // ✅ customers
  // ✅ workOrders (que dependem de customer)
  // ✅ itineraries (que dependem de customer via workOrders)
  // ✅ itineraryWorkOrders (que dependem de customer via workOrders)

  const { mutate: updateCustomer } = customerHooks.updateCustomer()

  const handleUpdate = (customerId: string, data: any) => {
    updateCustomer({ id: customerId, ...data })
    // Pronto! Tudo será invalidado automaticamente
    // Não precisa fazer mais nada!
  }

  return null // exemplo
}

// ============================================================================
// EXEMPLO 2: Uso Normal - Adicionar Work Order
// ============================================================================

export function ExampleWorkOrderCreate() {
  // Quando você cria uma work order, AUTOMATICAMENTE invalida:
  // ✅ workOrders
  // ✅ itineraries (se a ordem for adicionada a um itinerário)
  // ✅ itineraryWorkOrders
  // ✅ workOrderItems
  // ✅ workOrderResults
  // ✅ workOrderResultItems

  const { mutate: addWorkOrder } = workOrderHooks.addWorkOrder()

  const handleCreate = (data: any) => {
    addWorkOrder(data)
    // Automaticamente atualiza tudo relacionado!
  }

  return null // exemplo
}

// ============================================================================
// EXEMPLO 3: Uso Normal - Atualizar Produto
// ============================================================================

export function ExampleProductUpdate() {
  // Quando você atualiza um produto, AUTOMATICAMENTE invalida:
  // ✅ products
  // ✅ workOrderItems (que usam esse produto)
  // ✅ workOrderResultItems (que usam esse produto)
  // ✅ workOrders (que contêm esses items)

  const { mutate: updateProduct } = productHooks.updateProduct()

  const handleUpdate = (productId: string, data: any) => {
    updateProduct({ id: productId, ...data })
    // Todo item/ordem que usa esse produto será atualizado!
  }

  return null // exemplo
}

// ============================================================================
// EXEMPLO 4: Invalidação Manual (quando necessário)
// ============================================================================

export function ExampleManualInvalidation() {
  const invalidate = useInvalidateQueries()

  const handleSpecialCase = async () => {
    // Faz alguma operação customizada que não passa pelos hooks
    await fetch('/api/special-operation', { method: 'POST' })

    // Invalida manualmente as queries necessárias
    invalidate('customers') // Invalida customers e todas dependências

    // Ou invalida múltiplas queries
    invalidate(['customers', 'products'])
  }

  return null // exemplo
}

// ============================================================================
// EXEMPLO 5: Invalidação após múltiplas operações
// ============================================================================

export function ExampleBatchOperations() {
  const { mutateAsync: addWorkOrder } = workOrderHooks.addWorkOrder()
  const { mutateAsync: updateCustomer } = customerHooks.updateCustomer()
  const invalidate = useInvalidateQueries()

  const handleComplexOperation = async () => {
    // Desabilita invalidação automática temporariamente se necessário
    // (não implementado neste exemplo, mas é uma possibilidade futura)

    const data1 = {} as any
    const data2 = {} as any
    const customerData = {} as any

    // Executa múltiplas operações
    await addWorkOrder(data1)
    await addWorkOrder(data2)
    await updateCustomer(customerData)

    // Como cada operação já invalida automaticamente,
    // não precisa fazer nada aqui!
    // Mas se quisesse forçar uma invalidação adicional:
    // invalidate(['workOrders', 'customers'])
  }

  return null // exemplo
}

// ============================================================================
// ANTI-PADRÕES - O QUE NÃO FAZER
// ============================================================================

export function AntiPatternExamples() {
  const { mutate: updateCustomer } = customerHooks.updateCustomer()
  const queryClient = useQueryClient() // ❌ NÃO faça isso

  const WRONG_handleUpdate = (data: any) => {
    updateCustomer(data)

    // ❌ NÃO FAÇA: Invalidação manual desnecessária
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    // Isso já acontece automaticamente!
  }

  const CORRECT_handleUpdate = (data: any) => {
    updateCustomer(data)
    // ✅ FAÇA: Deixe o sistema fazer automaticamente
    // Pronto! Não precisa de mais nada
  }

  return null // exemplo
}

// ============================================================================
// DEBUGGING - Como verificar se as invalidações estão funcionando
// ============================================================================

/**
 * Para debugar, você pode adicionar temporariamente em create-repository-hooks.ts:
 *
 * onSuccess: () => {
 *   const keysToInvalidate = getQueryKeysToInvalidate(key)
 *   console.log(`🔄 Invalidating for ${key}:`, keysToInvalidate)
 *
 *   keysToInvalidate.forEach(queryKey => {
 *     queryClient.invalidateQueries({ queryKey: [queryKey] })
 *   })
 * }
 *
 * Isso mostrará no console quais queries estão sendo invalidadas.
 */
