import { describe, expect, it } from 'vitest'

describe('getQueryKeysToInvalidate', () => {
  it('should return the key itself and all recursive dependencies without duplicates', async () => {
    const { getQueryKeysToInvalidate } =
      await import('../query-invalidation.config')

    const keys = getQueryKeysToInvalidate('customers')

    expect(keys).toEqual(
      expect.arrayContaining([
        'customers',
        'workOrders',
        'itineraries',
        'itineraryWorkOrders',
        'workOrderItems',
        'workOrderResults',
        'workOrderResultItems',
      ])
    )

    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('should handle keys without dependencies', async () => {
    const { getQueryKeysToInvalidate } =
      await import('../query-invalidation.config')

    const keys = getQueryKeysToInvalidate('license')
    expect(keys).toEqual(['license'])
  })

  it('should set empty array for dependencies that do not exist', async () => {
    const { getQueryKeysToInvalidate } =
      await import('../query-invalidation.config')

    const keys = getQueryKeysToInvalidate('nonExistentKey' as any)
    expect(keys).toEqual(['nonExistentKey'])
  })
})
