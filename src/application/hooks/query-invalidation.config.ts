/**
 * Configuração centralizada de invalidação de queries do TanStack Query
 *
 * Este arquivo mapeia as dependências entre entidades para garantir que
 * quando uma entidade é modificada, todas as queries relacionadas sejam invalidadas.
 */

export type QueryKey =
  | 'customers'
  | 'workOrders'
  | 'workOrderItems'
  | 'itineraries'
  | 'itineraryWorkOrders'
  | 'products'
  | 'categories'
  | 'paymentOrders'
  | 'workOrderResults'
  | 'workOrderResultItems'
  | 'license'

/**
 * Mapa de dependências: quando uma query key é modificada,
 * quais outras queries devem ser invalidadas
 */
export const QUERY_DEPENDENCIES: Record<QueryKey, QueryKey[]> = {
  // Quando customer muda, invalida work orders e itinerários
  customers: ['workOrders', 'itineraries', 'itineraryWorkOrders'],

  // Quando work order muda, invalida itinerários e items relacionados
  workOrders: [
    'itineraries',
    'itineraryWorkOrders',
    'workOrderItems',
    'workOrderResults',
    'workOrderResultItems',
  ],

  // Quando work order item muda, invalida work orders
  workOrderItems: ['workOrders'],

  // Quando itinerário muda, invalida itineraryWorkOrders
  itineraries: ['itineraryWorkOrders'],

  // Quando itineraryWorkOrder muda, invalida itinerários e work orders
  itineraryWorkOrders: ['itineraries', 'workOrders'],

  // Quando produto muda, invalida work order items e result items
  products: ['workOrderItems', 'workOrderResultItems', 'workOrders'],

  // Quando categoria muda, invalida produtos (que podem invalidar outras)
  categories: ['products'],

  // Quando payment order muda, invalida work orders
  paymentOrders: ['workOrders'],

  // Quando work order result muda, invalida work orders e result items
  workOrderResults: ['workOrders', 'workOrderResultItems'],

  // Quando work order result item muda, invalida work orders e results
  workOrderResultItems: ['workOrders', 'workOrderResults'],

  // License não tem dependências
  license: [],
}

/**
 * Retorna todas as query keys que devem ser invalidadas quando uma key específica é modificada
 * Inclui a própria key e todas suas dependências (recursivamente)
 */
export function getQueryKeysToInvalidate(key: QueryKey): QueryKey[] {
  const keysToInvalidate = new Set<QueryKey>([key])
  const visited = new Set<QueryKey>()

  function addDependencies(currentKey: QueryKey) {
    if (visited.has(currentKey)) return
    visited.add(currentKey)

    const dependencies = QUERY_DEPENDENCIES[currentKey] || []
    dependencies.forEach((depKey) => {
      keysToInvalidate.add(depKey)
      addDependencies(depKey)
    })
  }

  addDependencies(key)

  return Array.from(keysToInvalidate)
}
