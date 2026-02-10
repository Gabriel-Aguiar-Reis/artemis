import { describe, expect, it } from 'vitest'

import {
  category,
  customer,
  itinerary,
  itineraryWorkOrder,
  license,
  paymentOrder,
  product,
  workOrder,
  workOrderItem,
  workOrderResult,
  workOrderResultItem,
} from '@/src/infra/db/drizzle/schema'

describe('drizzle schema definitions', () => {
  const tableAssertions: Array<[string, any]> = [
    ['category', category],
    ['customer', customer],
    ['itinerary', itinerary],
    ['itineraryWorkOrder', itineraryWorkOrder],
    ['license', license],
    ['paymentOrder', paymentOrder],
    ['product', product],
    ['workOrder', workOrder],
    ['workOrderItem', workOrderItem],
    ['workOrderResult', workOrderResult],
    ['workOrderResultItem', workOrderResultItem],
  ]

  it.each(tableAssertions)('exposes %s columns', (_label, table) => {
    expect(Object.keys(table)).toMatchSnapshot()
  })
})
