import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { License } from '@/src/domain/entities/license/license.entity'
import { license as licenseTable } from '@/src/infra/db/drizzle/schema/drizzle.license.schema'
import DrizzleLicenseRepository from '@/src/infra/repositories/drizzle/drizzle.license.repository'
import uuid from 'react-native-uuid'

let helpers: typeof import('./db-mock')
let createSelectChain: typeof import('./db-mock').createSelectChain
let createInsertChain: typeof import('./db-mock').createInsertChain
let createUpdateChain: typeof import('./db-mock').createUpdateChain
let createDeleteChain: typeof import('./db-mock').createDeleteChain
let selectMock: typeof import('./db-mock').selectMock
let insertMock: typeof import('./db-mock').insertMock
let updateMock: typeof import('./db-mock').updateMock
let deleteMock: typeof import('./db-mock').deleteMock
let resetDbMocks: typeof import('./db-mock').resetDbMocks

vi.mock('@/src/infra/db/drizzle/drizzle-client', async () => {
  const mod = await import('./db-mock')
  return {
    db: mod.dbMock,
  }
})

beforeAll(async () => {
  helpers = await import('./db-mock')
  createSelectChain = helpers.createSelectChain
  createInsertChain = helpers.createInsertChain
  createUpdateChain = helpers.createUpdateChain
  createDeleteChain = helpers.createDeleteChain
  selectMock = helpers.selectMock
  insertMock = helpers.insertMock
  updateMock = helpers.updateMock
  deleteMock = helpers.deleteMock
  resetDbMocks = helpers.resetDbMocks
})

describe('DrizzleLicenseRepository', () => {
  let repository: DrizzleLicenseRepository

  beforeEach(() => {
    resetDbMocks()
    repository = new DrizzleLicenseRepository()
  })

  it('getLicense returns null when no data exists', async () => {
    const selectChain = createSelectChain({ list: [] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getLicense()

    expect(result).toBeNull()
    expect(selectChain.chain.from).toHaveBeenCalledWith(licenseTable)
  })

  it('getLicense maps row into License entity', async () => {
    const row = {
      id: '00000000-0000-0000-0000-00000000abcd',
      uniqueCode: 'ABC123',
      expirationDate: '2025-12-31',
      isAdmin: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    const selectChain = createSelectChain({ list: [row] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getLicense()

    expect(result).toBeInstanceOf(License)
    expect(result?.id).toBe(row.id)
    expect(result?.uniqueCode).toBe('ABC123')
  })

  it('createLicense persists formatted data and returns domain entity', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)
    const uuidSpy = vi
      .spyOn(uuid, 'v4')
      .mockReturnValue('00000000-0000-0000-0000-00000000a1b2' as any)

    const repo = new DrizzleLicenseRepository()
    const expiration = new Date('2026-05-10T10:00:00Z')
    const result = await repo.createLicense('CODE-777', expiration, true)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: '00000000-0000-0000-0000-00000000a1b2',
      uniqueCode: 'CODE-777',
      expirationDate: '2026-05-10',
      isAdmin: true,
    })
    expect(result).toBeInstanceOf(License)
    expect(result.uniqueCode).toBe('CODE-777')

    uuidSpy.mockRestore()
  })

  it('updateLicense updates expiration date only when isAdmin missing', async () => {
    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repository.updateLicense(
      '00000000-0000-0000-0000-00000000cccc' as any,
      new Date('2027-01-01T00:00:00Z')
    )

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toEqual({ expirationDate: '2027-01-01' })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('updateLicense includes isAdmin when provided', async () => {
    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repository.updateLicense(
      '00000000-0000-0000-0000-00000000dddd' as any,
      new Date('2028-03-03T00:00:00Z'),
      false
    )

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toEqual({ expirationDate: '2028-03-03', isAdmin: false })
  })

  it('deleteLicense issues delete command', async () => {
    const deleteChain = createDeleteChain()
    deleteMock.mockReturnValue(deleteChain.chain)

    await repository.deleteLicense()

    expect(deleteChain.where).not.toHaveBeenCalled()
    expect(deleteMock).toHaveBeenCalledWith(licenseTable)
  })
})
