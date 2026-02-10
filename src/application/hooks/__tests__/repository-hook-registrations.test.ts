import { describe, expect, it, vi } from 'vitest'

describe('repository hook registrations', () => {
  it('delegates to createRepositoryHooks with the expected parameters', async () => {
    const createdHooks = Symbol('hooks')
    const createRepositoryHooks = vi.fn(() => createdHooks)

    vi.doMock('../create-repository-hooks', () => ({
      createRepositoryHooks,
    }))

    type ModuleDefinition = {
      modulePath: string
      repoPath: string
      exportName: string
      key: string
      name: string
      gender?: 'M' | 'F'
      namedExport?: string
    }

    const definitions: ModuleDefinition[] = [
      {
        modulePath: '../category.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.category.repository',
        exportName: 'categoryHooks',
        key: 'categories',
        name: 'categoria',
        gender: 'F',
      },
      {
        modulePath: '../customer.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.customer.repository',
        exportName: 'customerHooks',
        key: 'customers',
        name: 'cliente',
      },
      {
        modulePath: '../itinerary.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.itinerary.repository',
        exportName: 'itineraryHooks',
        key: 'itineraries',
        name: 'itinerário',
      },
      {
        modulePath: '../product.hooks',
        repoPath: '@/src/infra/repositories/drizzle/drizzle.product.repository',
        exportName: 'productHooks',
        key: 'products',
        name: 'produto',
      },
      {
        modulePath: '../payment-order.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.payment-order.repository',
        exportName: 'paymentOrderHooks',
        key: 'paymentOrders',
        name: 'pedido de pagamento',
      },
      {
        modulePath: '../work-order-item.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.work-order-item.repository',
        exportName: 'workOrderItemHooks',
        key: 'workOrderItems',
        name: 'item de ordem de serviço',
      },
      {
        modulePath: '../work-order-result.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.work-order-result.repository',
        exportName: 'workOrderResultHooks',
        key: 'workOrderResults',
        name: 'relatório de ordem de serviço',
      },
      {
        modulePath: '../work-order-result-item.hooks',
        repoPath:
          '@/src/infra/repositories/drizzle/drizzle.work-order-result-item.repository',
        exportName: 'workOrderResultItemHooks',
        key: 'workOrderResultItems',
        name: 'item de resultado de ordem de serviço',
        gender: 'M',
        namedExport: 'DrizzleWorkOrderResultItemRepository',
      },
    ]

    const repoInstances = new Map<string, any[]>()

    for (const definition of definitions) {
      const instances: any[] = []
      repoInstances.set(definition.repoPath, instances)

      vi.doMock(definition.repoPath, () => {
        class MockRepository {
          constructor() {
            instances.push(this)
          }
        }

        const exports: Record<string, any> = { __esModule: true }
        if (definition.namedExport) {
          exports[definition.namedExport] = MockRepository
        }
        exports.default = MockRepository
        return exports
      })
    }

    for (const definition of definitions) {
      const module = await import(definition.modulePath)
      expect(module[definition.exportName]).toBe(createdHooks)

      const call = createRepositoryHooks.mock.calls.at(-1) as
        | unknown[]
        | undefined
      expect(call).toBeDefined()
      const [repoInstance, keyArg, nameArg, genderArg] = call as [
        unknown,
        string,
        string,
        'M' | 'F' | undefined,
      ]

      expect(keyArg).toBe(definition.key)
      expect(nameArg).toBe(definition.name)
      if (definition.gender) {
        expect(genderArg).toBe(definition.gender)
      } else {
        expect(genderArg).toBeUndefined()
      }

      const instances = repoInstances.get(definition.repoPath) ?? []
      expect(instances).toHaveLength(1)
      expect(repoInstance).toBe(instances[0])
    }
  })
})
