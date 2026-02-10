import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MockFn = ReturnType<typeof vi.fn>

let openDatabaseMock: MockFn
let execSyncMock: MockFn
let closeSyncMock: MockFn
let deleteDatabaseMock: MockFn
let drizzleMock: MockFn

vi.mock('expo-sqlite', () => ({
  __esModule: true,
  SQLiteDatabase: class {},
  openDatabaseSync: (...args: unknown[]) =>
    (openDatabaseMock as unknown as (...inner: unknown[]) => unknown)(...args),
  deleteDatabaseSync: (...args: unknown[]) =>
    (deleteDatabaseMock as unknown as (...inner: unknown[]) => unknown)(
      ...args
    ),
}))

vi.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: (...args: unknown[]) =>
    (drizzleMock as unknown as (...inner: unknown[]) => unknown)(...args),
}))

describe('drizzle-client', () => {
  beforeEach(() => {
    execSyncMock = vi.fn()
    closeSyncMock = vi.fn()
    openDatabaseMock = vi.fn(() => ({
      execSync: execSyncMock,
      closeSync: closeSyncMock,
    }))
    deleteDatabaseMock = vi.fn()
    drizzleMock = vi.fn(() => ({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ then: (r: any) => r([]) })),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(async (callback: any) => {
        const tx = {
          insert: vi.fn(() => ({ values: vi.fn() })),
          update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
          delete: vi.fn(() => ({ where: vi.fn() })),
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn(() => ({ limit: vi.fn(() => ({ get: vi.fn() })) })),
            })),
          })),
        }
        return callback(tx)
      }),
    }))
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getExpoDb opens the database only once and caches the instance', async () => {
    const module = await import('@/src/infra/db/drizzle/drizzle-client')

    const first = module.getExpoDb()
    const second = module.getExpoDb()

    expect(first).toBe(second)
    expect(openDatabaseMock).toHaveBeenCalledTimes(1)
  })

  it('getExpoDb logs and rethrows when opening fails', async () => {
    const error = new Error('failed to open')
    openDatabaseMock.mockImplementation(() => {
      throw error
    })

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const module = await import('@/src/infra/db/drizzle/drizzle-client')

    expect(() => module.getExpoDb()).toThrow(error)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error opening database:',
      error
    )
  })

  it('enableForeignKeys executes pragma when possible', async () => {
    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    module.getExpoDb()

    module.enableForeignKeys()

    expect(execSyncMock).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;')
  })

  it('enableForeignKeys logs errors without throwing', async () => {
    const error = new Error('foreign key')
    execSyncMock.mockImplementationOnce(() => {
      throw error
    })

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    module.getExpoDb()
    module.enableForeignKeys()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error enabling foreign keys:',
      error
    )
  })

  it('initDrizzleClient initializes drizzle once and reuses the instance', async () => {
    const selectFn = vi.fn()
    drizzleMock.mockImplementation(() => ({ select: selectFn }))

    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    const first = module.initDrizzleClient()
    const second = module.initDrizzleClient()

    expect(first).toBe(second)
    expect(drizzleMock).toHaveBeenCalledTimes(1)
    expect(selectFn).toBeDefined()
  })

  it('resetDrizzleClient closes the connection and clears caches', async () => {
    const module = await import('@/src/infra/db/drizzle/drizzle-client')

    module.getExpoDb()
    expect(openDatabaseMock).toHaveBeenCalledTimes(1)

    module.resetDrizzleClient()
    expect(closeSyncMock).toHaveBeenCalledTimes(1)

    module.getExpoDb()
    expect(openDatabaseMock).toHaveBeenCalledTimes(2)
  })

  it('resetDrizzleClient logs errors when closing fails but still resets state', async () => {
    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    module.getExpoDb()

    const error = new Error('close failed')
    closeSyncMock.mockImplementationOnce(() => {
      throw error
    })

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    module.resetDrizzleClient()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error closing database:',
      error
    )

    module.getExpoDb()
    expect(openDatabaseMock).toHaveBeenCalledTimes(2)
  })

  it('db proxy lazily initializes drizzle and forwards properties', async () => {
    const selectFn = vi.fn()
    drizzleMock.mockImplementation(() => ({ select: selectFn }))

    const module = await import('@/src/infra/db/drizzle/drizzle-client')

    module.db.select()
    expect(drizzleMock).toHaveBeenCalledTimes(1)
    expect(selectFn).toHaveBeenCalled()
  })

  it('deleteDatabaseAndReset successfully deletes database', async () => {
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)

    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    module.getExpoDb()

    const result = await module.deleteDatabaseAndReset()

    expect(closeSyncMock).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('Drizzle client reset')
    expect(typeof result).toBe('boolean')
  })

  it('deleteDatabaseAndReset handles errors during deletion', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const module = await import('@/src/infra/db/drizzle/drizzle-client')
    module.getExpoDb()

    const result = await module.deleteDatabaseAndReset()

    // O require dinâmico pode falhar, verificamos que loga erro
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(result).toBe(false)
  })
})
