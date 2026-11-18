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
  | 'errorLogs'

/**
 * Mapa de dependências DIRETAS: quando uma query key é modificada, quais
 * outras queries precisam ser invalidadas. NÃO é transitivo: cada lista já
 * contém tudo o que realmente embute os dados alterados (ver
 * docs/QUERY_INVALIDATION.md). Itinerários e ordens carregam nome do cliente,
 * itens e nomes de produto no próprio join, por isso aparecem nas listas.
 */
export const QUERY_DEPENDENCIES: Record<QueryKey, QueryKey[]> = {
  // OS e itinerário exibem nome/endereço/telefone do cliente
  customers: ['workOrders', 'itineraries', 'itineraryWorkOrders'],

  // Escrita de OS toca itinerários, itens e resultados
  workOrders: [
    'itineraries',
    'itineraryWorkOrders',
    'workOrderItems',
    'workOrderResults',
    'workOrderResultItems',
  ],

  workOrderItems: ['workOrders', 'itineraries'],

  itineraries: ['itineraryWorkOrders'],

  itineraryWorkOrders: ['itineraries', 'workOrders'],

  // Itens de OS/resultado exibem nome do produto
  products: [
    'workOrders',
    'itineraries',
    'workOrderItems',
    'workOrderResultItems',
  ],

  // Error logs não dependem de nenhuma outra entidade
  errorLogs: [],

  // Só a lista de produtos mostra o nome da categoria
  categories: ['products'],

  paymentOrders: ['workOrders', 'itineraries'],

  workOrderResults: ['workOrders', 'itineraries', 'workOrderResultItems'],

  workOrderResultItems: ['workOrders', 'itineraries', 'workOrderResults'],

  license: [],
}

/**
 * Retorna a própria key mais suas dependências diretas (sem fecho transitivo,
 * sem duplicatas).
 */
export function getQueryKeysToInvalidate(key: QueryKey): QueryKey[] {
  return Array.from(
    new Set<QueryKey>([key, ...(QUERY_DEPENDENCIES[key] || [])])
  )
}
