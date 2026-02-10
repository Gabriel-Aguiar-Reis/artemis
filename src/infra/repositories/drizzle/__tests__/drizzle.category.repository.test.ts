import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { Category } from '@/src/domain/entities/category/category.entity'
import { category as categoryTable } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import DrizzleCategoryRepository from '@/src/infra/repositories/drizzle/drizzle.category.repository'
import uuid from 'react-native-uuid'

let helpers: typeof import('./db-mock')
let createDeleteChain: typeof import('./db-mock').createDeleteChain
let createInsertChain: typeof import('./db-mock').createInsertChain
let createSelectChain: typeof import('./db-mock').createSelectChain
let createUpdateChain: typeof import('./db-mock').createUpdateChain
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
  createDeleteChain = helpers.createDeleteChain
  createInsertChain = helpers.createInsertChain
  createSelectChain = helpers.createSelectChain
  createUpdateChain = helpers.createUpdateChain
  selectMock = helpers.selectMock
  insertMock = helpers.insertMock
  updateMock = helpers.updateMock
  deleteMock = helpers.deleteMock
  resetDbMocks = helpers.resetDbMocks
})

describe('DrizzleCategoryRepository', () => {
  let repository: DrizzleCategoryRepository

  beforeEach(() => {
    resetDbMocks()
    repository = new DrizzleCategoryRepository()
  })

  it('getCategories returns empty array when database has no rows', async () => {
    const selectChain = createSelectChain({ list: [] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCategories()

    expect(result).toEqual([])
    expect(selectMock).toHaveBeenCalledWith()
    expect(selectChain.chain.from).toHaveBeenCalledWith(categoryTable)
  })

  it('getCategories maps rows into Category entities', async () => {
    const rows = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Bebidas',
        isActive: true,
      },
    ]
    const selectChain = createSelectChain({ list: rows })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCategories()

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(Category)
    expect(result[0]?.name).toBe('Bebidas')
  })

  it('addCategory uses provided id when present', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)

    await repository.addCategory({
      id: '00000000-0000-0000-0000-000000000099',
      name: 'Present',
      isActive: false,
    } as any)

    expect(insertChain.values).toHaveBeenCalled()
    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: '00000000-0000-0000-0000-000000000099',
      name: 'Present',
      isActive: false,
    })
  })

  it('addCategory generates an id when missing', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)
    const generatedId = '00000000-0000-0000-0000-00000000aaaa'
    const uuidSpy = vi.spyOn(uuid, 'v4').mockReturnValue(generatedId as any)

    await repository.addCategory({ name: 'Gerada' } as any)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({ id: generatedId, name: 'Gerada' })
    expect(insertChain.onConflictDoNothing).toHaveBeenCalled()

    uuidSpy.mockRestore()
  })

  it('updateCategory throws when id is missing', async () => {
    await expect(
      repository.updateCategory({ name: 'Falha' } as any)
    ).rejects.toThrow('O ID da categoria é obrigatório para atualização.')
  })

  it('updateCategory throws when category cannot be found', async () => {
    const repo = new DrizzleCategoryRepository()
    vi.spyOn(repo, 'getCategory').mockResolvedValue(null as any)

    await expect(
      repo.updateCategory({ id: '00000000-0000-0000-0000-000000000001' } as any)
    ).rejects.toThrow('A categoria não foi encontrada.')
  })

  it('updateCategory persists merged data', async () => {
    const repo = new DrizzleCategoryRepository()
    const existing = new Category(
      '00000000-0000-0000-0000-000000000010' as any,
      'Origem',
      true
    )
    vi.spyOn(repo, 'getCategory').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCategory({
      id: existing.id,
      name: 'Atualizada',
      isActive: false,
    })

    expect(updateChain.set).toHaveBeenCalled()
    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: existing.id,
      name: 'Atualizada',
      isActive: false,
    })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('updateCategory preserves original name when not provided', async () => {
    const repo = new DrizzleCategoryRepository()
    const existing = new Category(
      '00000000-0000-0000-0000-000000000011' as any,
      'Nome Original',
      true
    )
    vi.spyOn(repo, 'getCategory').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCategory({
      id: existing.id,
      isActive: false,
    })

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: existing.id,
      name: 'Nome Original',
      isActive: false,
    })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('updateCategory preserves original isActive when not provided', async () => {
    const repo = new DrizzleCategoryRepository()
    const existing = new Category(
      '00000000-0000-0000-0000-000000000012' as any,
      'Categoria',
      false
    )
    vi.spyOn(repo, 'getCategory').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCategory({
      id: existing.id,
      name: 'Novo Nome',
    })

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: existing.id,
      name: 'Novo Nome',
      isActive: false,
    })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('deleteCategory issues delete query with eq condition', async () => {
    const deleteChain = createDeleteChain()
    deleteMock.mockReturnValue(deleteChain.chain)

    await repository.deleteCategory(
      '00000000-0000-0000-0000-000000000021' as any
    )

    expect(deleteChain.where).toHaveBeenCalled()
  })

  it('getCategory returns mapped entity when present', async () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Localizada',
      isActive: true,
    }
    const selectChain = createSelectChain({ single: row, where: [row] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCategory(row.id as any)

    expect(result).toBeInstanceOf(Category)
    expect(result?.name).toBe('Localizada')
    expect(selectChain.where.limit).toHaveBeenCalled()
  })

  it('getCategory throws when row cannot be found', async () => {
    const selectChain = createSelectChain({ single: null })
    selectMock.mockReturnValue(selectChain.chain)

    await expect(
      repository.getCategory('00000000-0000-0000-0000-000000000404' as any)
    ).rejects.toThrow('A categoria não foi encontrada.')
  })

  it('getActiveCategories filters by active flag', async () => {
    const rows = [
      {
        id: '00000000-0000-0000-0000-000000000501',
        name: 'Ativa',
        isActive: true,
      },
    ]
    const selectChain = createSelectChain({ where: rows })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getActiveCategories()

    expect(result).toHaveLength(1)
    expect(result[0]?.isActive).toBe(true)
  })

  it('updateDisableCategory throws when category is missing', async () => {
    const repo = new DrizzleCategoryRepository()
    vi.spyOn(repo, 'getCategory').mockResolvedValue(null as any)

    await expect(
      repo.updateDisableCategory('00000000-0000-0000-0000-000000000601' as any)
    ).rejects.toThrow('A categoria não foi encontrada.')
  })

  it('updateDisableCategory sets category as inactive', async () => {
    const repo = new DrizzleCategoryRepository()
    const categoryEntity = new Category(
      '00000000-0000-0000-0000-000000000602' as any,
      'Ativa',
      true
    )
    vi.spyOn(repo, 'getCategory').mockResolvedValue(categoryEntity)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateDisableCategory(categoryEntity.id)

    expect(categoryEntity.isActive).toBe(false)
    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({ isActive: false })
    expect(updateChain.where).toHaveBeenCalled()
  })
})
