import { describe, expect, it, vi } from 'vitest'

const setupReactQueryMocks = () => {
  const queryCalls: any[] = []
  const mutationCalls: any[] = []
  const invalidateQueries = vi.fn()

  const useQueryMock = vi.fn((options) => {
    queryCalls.push(options)
    return { data: undefined, options }
  })

  const useMutationMock = vi.fn((options) => {
    mutationCalls.push(options)
    return {
      mutate: (args: any) => options.mutationFn(args),
      mutateAsync: (args: any) => options.mutationFn(args),
      options,
    }
  })

  const useQueryClientMock = vi.fn(() => ({ invalidateQueries }))

  vi.doMock('@tanstack/react-query', () => ({
    useQuery: useQueryMock,
    useMutation: useMutationMock,
    useQueryClient: useQueryClientMock,
  }))

  return {
    queryCalls,
    mutationCalls,
    invalidateQueries,
    useQueryMock,
    useMutationMock,
    useQueryClientMock,
  }
}

describe('createRepositoryHooks', () => {
  it('wraps repository methods with TanStack Query hooks and handles success/error flows', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { queryCalls, mutationCalls, invalidateQueries } =
      setupReactQueryMocks()

    const getQueryKeysToInvalidate = vi
      .fn()
      .mockReturnValue(['workOrders', 'itineraries'])
    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { createRepositoryHooks } = await import('../create-repository-hooks')
    const { default: Toast } = await import('react-native-toast-message')

    const getSpy = vi.fn(async (id: string) => ({ id }))
    const updateSpy = vi.fn(async (payload: any) => ({
      ...payload,
      updated: true,
    }))

    class Repo {
      public addWorkOrder: any
      public deleteWorkOrder: any
      public someValue: number

      constructor() {
        this.addWorkOrder = vi.fn().mockResolvedValue('new-id')
        this.deleteWorkOrder = vi.fn().mockResolvedValue(undefined)
        this.someValue = 41
      }

      async getWorkOrder(id: string) {
        return getSpy(id)
      }

      async updateWorkOrder(data: any) {
        return updateSpy(data)
      }

      calculate(offset: number) {
        return this.someValue + offset
      }
    }

    const repo = new Repo()

    const hooks = createRepositoryHooks(repo, 'workOrders', 'OrdemServico', 'F')

    const queryResult = hooks.getWorkOrder('42')
    expect(queryCalls).toHaveLength(1)
    const queryOptions = queryCalls[0]
    expect(queryOptions.queryKey).toEqual(['workOrders', 'getWorkOrder', '42'])
    expect(queryOptions.staleTime).toBe(1000 * 30)
    await queryOptions.queryFn()
    expect(getSpy).toHaveBeenCalledWith('42')
    expect(queryResult).toBeDefined()

    const addHook = hooks.addWorkOrder()
    const updateHook = hooks.updateWorkOrder()
    const deleteHook = hooks.deleteWorkOrder()

    expect(addHook).toBeDefined()
    expect(updateHook).toBeDefined()
    expect(deleteHook).toBeDefined()

    expect(mutationCalls).toHaveLength(3)
    const [addOptions, updateOptions, deleteOptions] = mutationCalls

    await addOptions.mutationFn(['payload', true])
    expect(repo.addWorkOrder).toHaveBeenCalledWith('payload', true)

    await updateOptions.mutationFn({ id: '1' })
    expect(updateSpy).toHaveBeenCalledWith({ id: '1' })

    await deleteOptions.mutationFn({ id: '1' })
    expect(repo.deleteWorkOrder).toHaveBeenCalledWith({ id: '1' })

    addOptions.onSuccess?.()
    expect(getQueryKeysToInvalidate).toHaveBeenCalledWith('workOrders')
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['workOrders'],
      refetchType: 'all',
    })
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['itineraries'],
      refetchType: 'all',
    })
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem servico adicionada com sucesso!',
    })

    const error = new Error('boom')
    deleteOptions.onError?.(error)
    expect(Toast.show).toHaveBeenLastCalledWith({
      type: 'error',
      text1: 'Erro ao deletar ordem servico!',
      text2: 'boom',
    })

    updateOptions.onSuccess?.()
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Ordem servico atualizada com sucesso!',
    })
    expect(invalidateQueries).toHaveBeenCalledTimes(4)

    updateOptions.onError?.(error)
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Erro ao atualizar ordem servico!',
      text2: 'boom',
    })

    const result = hooks.calculate(1)
    expect(result).toBe(42)
  })

  it('uses default gender and skips non-function members', async () => {
    vi.resetModules()
    vi.clearAllMocks()
    const { mutationCalls, invalidateQueries } = setupReactQueryMocks()

    const getQueryKeysToInvalidate = vi.fn().mockReturnValue(['customers'])
    vi.doMock('../query-invalidation.config', () => ({
      getQueryKeysToInvalidate,
    }))

    const { createRepositoryHooks } = await import('../create-repository-hooks')
    const { default: Toast } = await import('react-native-toast-message')

    class Repo {
      private toggle = false

      get unstable() {
        this.toggle = !this.toggle
        return this.toggle ? () => 'first-call' : 99
      }

      async addCustomer(payload: { id: string }) {
        return { ...payload, created: true }
      }

      async deleteCustomer(id: string) {
        return { deleted: id }
      }
    }

    const repo = new Repo()
    const hooks = createRepositoryHooks(repo, 'customers', 'Cliente')

    const addHook = hooks.addCustomer()
    const deleteHook = hooks.deleteCustomer()

    expect(addHook).toBeDefined()
    expect(deleteHook).toBeDefined()

    const [addOptions, deleteOptions] = mutationCalls

    await addOptions.mutationFn({ id: '1' })
    expect(getQueryKeysToInvalidate).not.toHaveBeenCalled()

    addOptions.onSuccess?.()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['customers'],
      refetchType: 'all',
    })
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Cliente adicionado com sucesso!',
    })

    const error = new Error('fail')
    addOptions.onError?.(error)
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Erro ao adicionar cliente!',
      text2: 'fail',
    })

    deleteOptions.onSuccess?.()
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: 'Cliente deletado com sucesso!',
    })

    deleteOptions.onError?.(error)
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Erro ao deletar cliente!',
      text2: 'fail',
    })
  })

  it('falls back to error words when toast type is unknown', async () => {
    vi.resetModules()
    vi.clearAllMocks()

    const module = await import('../create-repository-hooks')
    const { __test__ } = module as unknown as {
      __test__: {
        formatToastText: (
          repo: string,
          action: 'add' | 'update' | 'delete',
          type: string,
          gender?: 'M' | 'F'
        ) => string
      }
    }

    const message = __test__.formatToastText(
      'ProdutoEspecial',
      'add',
      'warn' as any,
      'F'
    )

    expect(message).toBe('Erro ao adicionar produto especial!')

    const defaultGenderMessage = __test__.formatToastText(
      'ClienteVip',
      'update',
      'success'
    )

    expect(defaultGenderMessage).toBe('Cliente vip atualizado com sucesso!')
  })
})
