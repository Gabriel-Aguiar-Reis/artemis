import { describe, expect, it } from 'vitest'

describe('getQueryKeysToInvalidate', () => {
  it('should return the key itself and its direct dependencies without duplicates', async () => {
    const { getQueryKeysToInvalidate } =
      await import('../query-invalidation.config')

    const keys = getQueryKeysToInvalidate('customers')

    expect(keys).toEqual(
      expect.arrayContaining([
        'customers',
        'workOrders',
        'itineraries',
        'itineraryWorkOrders',
      ])
    )
    // Não transitivo: cliente não precisa refazer itens/resultados de OS
    expect(keys).not.toContain('workOrderItems')
    expect(keys).not.toContain('workOrderResults')

    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('categories only invalidate products (no transitive work order refetch)', async () => {
    const { getQueryKeysToInvalidate } =
      await import('../query-invalidation.config')

    expect(getQueryKeysToInvalidate('categories')).toEqual([
      'categories',
      'products',
    ])
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
