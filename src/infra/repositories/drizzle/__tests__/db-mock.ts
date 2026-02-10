import { vi } from 'vitest'

export type SelectChainOptions<TList = unknown[], TSingle = unknown> = {
  list?: TList
  where?: TList
  single?: TSingle
}

export type SelectChain<TList = unknown[], TSingle = unknown> = {
  chain: any
  from: any
  where: any
  limit: any
}

export function createSelectChain<TList = unknown[], TSingle = unknown>(
  options: SelectChainOptions<TList, TSingle> = {}
): SelectChain<TList, TSingle> {
  const list = options.list ?? ([] as TList)
  const whereResult = options.where ?? list
  const single =
    options.single ??
    ((Array.isArray(whereResult) ? (whereResult as any)[0] : null) as TSingle)

  const limit = {
    get: vi.fn(() => single),
    then: (resolve: (value: TList) => void) =>
      resolve(
        Array.isArray(whereResult) ? (whereResult as TList) : (list as TList)
      ),
  }

  const where = {
    limit: vi.fn(() => limit),
    then: (resolve: (value: TList) => void) => resolve(whereResult),
  }

  const from = {
    where: vi.fn(() => where),
    limit: vi.fn(() => limit),
    get: vi.fn(() => single),
    then: (resolve: (value: TList) => void) => resolve(list),
  }

  const chain = {
    from: vi.fn(() => from),
  }

  return { chain, from, where, limit }
}

export function createInsertChain() {
  const onConflictDoNothing = vi.fn(() => undefined)
  const values = vi.fn(() => ({ onConflictDoNothing }))
  return { chain: { values }, values, onConflictDoNothing }
}

export function createUpdateChain() {
  const where = vi.fn(() => undefined)
  const set = vi.fn(() => ({ where }))
  return { chain: { set }, set, where }
}

export function createDeleteChain() {
  const where = vi.fn(() => undefined)
  return { chain: { where }, where }
}

export const selectMock = vi.fn()
export const insertMock = vi.fn()
export const updateMock = vi.fn()
export const deleteMock = vi.fn()
export const transactionMock = vi.fn()

export function resetDbMocks() {
  selectMock.mockReset()
  insertMock.mockReset()
  updateMock.mockReset()
  deleteMock.mockReset()
  transactionMock.mockReset()
}

export const dbMock = {
  select: (...args: unknown[]) =>
    (selectMock as unknown as (...inner: unknown[]) => unknown)(...args),
  insert: (...args: unknown[]) =>
    (insertMock as unknown as (...inner: unknown[]) => unknown)(...args),
  update: (...args: unknown[]) =>
    (updateMock as unknown as (...inner: unknown[]) => unknown)(...args),
  delete: (...args: unknown[]) =>
    (deleteMock as unknown as (...inner: unknown[]) => unknown)(...args),
  transaction: (...args: unknown[]) =>
    (transactionMock as unknown as (...inner: unknown[]) => unknown)(...args),
}
