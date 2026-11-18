/**
 * Centralized TanStack Query invalidation configuration
 *
 * This file maps dependencies between entities to ensure that
 * when an entity is modified, all related queries are invalidated.
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
 * Map of DIRECT dependencies: when a query key is modified, which
 * other queries must be invalidated. NOT transitive: each list already
 * contains everything that actually embeds the changed data (see
 * docs/QUERY_INVALIDATION.md). Itineraries and orders carry the customer name,
 * items and product names in their own join, which is why they appear in the lists.
 */
export const QUERY_DEPENDENCIES: Record<QueryKey, QueryKey[]> = {
  // Work orders and itineraries show the customer's name/address/phone
  customers: ['workOrders', 'itineraries', 'itineraryWorkOrders'],

  // Writing a work order touches itineraries, items and results
  workOrders: [
    'paymentOrders',
    'itineraries',
    'itineraryWorkOrders',
    'workOrderItems',
    'workOrderResults',
    'workOrderResultItems',
  ],

  workOrderItems: ['workOrders', 'itineraries'],

  itineraries: ['itineraryWorkOrders'],

  itineraryWorkOrders: ['itineraries', 'workOrders'],

  // Work order/result items show the product name
  products: [
    'workOrders',
    'itineraries',
    'workOrderItems',
    'workOrderResults',
    'workOrderResultItems',
  ],

  // Error logs do not depend on any other entity
  errorLogs: [],

  // Only the product list shows the category name
  categories: ['products'],

  paymentOrders: ['workOrders', 'itineraries'],

  workOrderResults: ['workOrders', 'itineraries', 'workOrderResultItems'],

  workOrderResultItems: ['workOrders', 'itineraries', 'workOrderResults'],

  license: [],
}

/**
 * Returns the key itself plus its direct dependencies (no transitive closure,
 * no duplicates).
 */
export function getQueryKeysToInvalidate(key: QueryKey): QueryKey[] {
  return Array.from(
    new Set<QueryKey>([key, ...(QUERY_DEPENDENCIES[key] || [])])
  )
}
