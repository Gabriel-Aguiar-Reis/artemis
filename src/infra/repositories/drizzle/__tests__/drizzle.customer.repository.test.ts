import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'
import { LandlinePhoneNumber } from '@/src/domain/entities/customer/value-objects/landline-phone-number.vo'
import { SmartphoneNumber } from '@/src/domain/entities/customer/value-objects/smartphone-number.vo'
import { customer as customerTable } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import DrizzleCustomerRepository from '@/src/infra/repositories/drizzle/drizzle.customer.repository'
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

describe('DrizzleCustomerRepository', () => {
  let repository: DrizzleCustomerRepository

  beforeEach(() => {
    resetDbMocks()
    repository = new DrizzleCustomerRepository()
  })

  const baseRow = {
    id: '00000000-0000-0000-0000-000000000111',
    storeName: 'Loja Azul',
    contactName: 'Ana',
    phoneNumber: '11999998888',
    phoneIsWhatsApp: 1,
    landlineNumber: '1133332222',
    landlineIsWhatsApp: 0,
    addressStreetName: 'Rua A',
    addressStreetNumber: '123',
    addressNeighborhood: 'Centro',
    addressCity: 'São Paulo',
    addressState: 'SP',
    addressZipCode: '01001000',
  }

  it('getCustomers returns empty array when no rows', async () => {
    const selectChain = createSelectChain({ list: [] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCustomers()

    expect(result).toEqual([])
    expect(selectChain.chain.from).toHaveBeenCalledWith(customerTable)
  })

  it('getCustomers maps database rows to domain entities', async () => {
    const selectChain = createSelectChain({ list: [baseRow] })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCustomers()

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(Customer)
    expect(result[0]?.storeName).toBe('Loja Azul')
  })

  it('addCustomer throws when address is incomplete', async () => {
    await expect(
      repository.addCustomer({
        storeName: 'Sem Endereço',
        contactName: 'João',
        addressStreetName: 'Rua 1',
      } as any)
    ).rejects.toThrow('Endereço incompleto para cadastro de cliente.')
  })

  it('addCustomer normalizes numbers and persists data', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)

    const uuidSpy = vi
      .spyOn(uuid, 'v4')
      .mockReturnValue('00000000-0000-0000-0000-00000000cafe' as any)

    await repository.addCustomer({
      id: '00000000-0000-0000-0000-00000000cafe',
      storeName: 'Tech',
      contactName: 'Bruno',
      addressStreetName: 'Rua B',
      addressStreetNumber: '55',
      addressNeighborhood: 'Bairro',
      addressCity: 'Campinas',
      addressState: 'SP',
      addressZipCode: '13000000',
      phoneNumber: '(11) 98888-7777',
      phoneIsWhatsApp: true,
      landlineNumber: '(11) 3456-7890',
      landlineIsWhatsApp: false,
    } as any)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      id: '00000000-0000-0000-0000-00000000cafe',
      storeName: 'Tech',
      contactName: 'Bruno',
      phoneNumber: '11988887777',
      landlineNumber: '1134567890',
      addressStreetName: 'Rua B',
    })
    expect(insertChain.onConflictDoNothing).toHaveBeenCalled()

    uuidSpy.mockRestore()
  })

  it('addCustomer works with only smartphone number', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)

    const uuidSpy = vi
      .spyOn(uuid, 'v4')
      .mockReturnValue('00000000-0000-0000-0000-00000000aaa1' as any)

    await repository.addCustomer({
      id: '00000000-0000-0000-0000-00000000aaa1',
      storeName: 'Store A',
      contactName: 'Contact A',
      addressStreetName: 'Rua X',
      addressStreetNumber: '100',
      addressNeighborhood: 'Centro',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressZipCode: '01000000',
      phoneNumber: '(11) 91111-2222',
      phoneIsWhatsApp: true,
    } as any)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      phoneNumber: '11911112222',
      phoneIsWhatsApp: true,
      landlineNumber: null,
      landlineIsWhatsApp: null,
    })

    uuidSpy.mockRestore()
  })

  it('addCustomer works with only landline number', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)

    const uuidSpy = vi
      .spyOn(uuid, 'v4')
      .mockReturnValue('00000000-0000-0000-0000-00000000aaa2' as any)

    await repository.addCustomer({
      id: '00000000-0000-0000-0000-00000000aaa2',
      storeName: 'Store B',
      contactName: 'Contact B',
      addressStreetName: 'Rua Y',
      addressStreetNumber: '200',
      addressNeighborhood: 'Bairro',
      addressCity: 'Rio de Janeiro',
      addressState: 'RJ',
      addressZipCode: '20000000',
      landlineNumber: '(21) 3333-4444',
      landlineIsWhatsApp: false,
    } as any)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      phoneNumber: null,
      phoneIsWhatsApp: null,
      landlineNumber: '2133334444',
      landlineIsWhatsApp: false,
    })

    uuidSpy.mockRestore()
  })

  it('addCustomer works without phone numbers', async () => {
    const insertChain = createInsertChain()
    insertMock.mockReturnValue(insertChain.chain)

    const uuidSpy = vi
      .spyOn(uuid, 'v4')
      .mockReturnValue('00000000-0000-0000-0000-00000000aaa3' as any)

    await repository.addCustomer({
      id: '00000000-0000-0000-0000-00000000aaa3',
      storeName: 'Store C',
      contactName: 'Contact C',
      addressStreetName: 'Rua Z',
      addressStreetNumber: '300',
      addressNeighborhood: 'Vila',
      addressCity: 'Curitiba',
      addressState: 'PR',
      addressZipCode: '80000000',
    } as any)

    const payload = (
      insertChain.values.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      storeName: 'Store C',
      contactName: 'Contact C',
      addressStreetName: 'Rua Z',
      phoneNumber: null,
      phoneIsWhatsApp: null,
      landlineNumber: null,
      landlineIsWhatsApp: null,
    })

    uuidSpy.mockRestore()
  })

  it('updateCustomer requires id', async () => {
    await expect(
      repository.updateCustomer({ storeName: 'Erro' } as any)
    ).rejects.toThrow('O ID do cliente é obrigatório para atualização.')
  })

  it('updateCustomer throws when original is missing', async () => {
    const repo = new DrizzleCustomerRepository()
    vi.spyOn(repo, 'getCustomer').mockResolvedValue(null as any)

    await expect(
      repo.updateCustomer({ id: baseRow.id } as any)
    ).rejects.toThrow('O cliente que você está tentando atualizar não existe.')
  })

  it('updateCustomer merges data and persists', async () => {
    const repo = new DrizzleCustomerRepository()
    const address = Address.fromDTO({
      streetName: 'Rua A',
      streetNumber: 10,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001000',
    })
    const phone = SmartphoneNumber.fromDTO({
      value: '11987654321',
      isWhatsApp: true,
    })
    const landline = LandlinePhoneNumber.fromDTO({
      value: '1134567890',
      isWhatsApp: false,
    })
    const existing = new Customer(
      baseRow.id as any,
      'Original',
      address,
      'Joana',
      phone,
      landline
    )
    vi.spyOn(repo, 'getCustomer').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCustomer({
      id: baseRow.id,
      storeName: 'Atualizada',
      phoneNumber: '(11) 90000-0000',
      phoneIsWhatsApp: false,
    })

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      storeName: 'Atualizada',
      phoneNumber: '11900000000',
      phoneIsWhatsApp: false,
    })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('deleteCustomer issues delete query', async () => {
    const deleteChain = createDeleteChain()
    deleteMock.mockReturnValue(deleteChain.chain)

    await repository.deleteCustomer(baseRow.id as any)

    expect(deleteChain.where).toHaveBeenCalled()
  })

  it('getCustomer returns mapped entity', async () => {
    const selectChain = createSelectChain({ single: baseRow })
    selectMock.mockReturnValue(selectChain.chain)

    const result = await repository.getCustomer(baseRow.id as any)

    expect(result).toBeInstanceOf(Customer)
    expect(result?.storeName).toBe('Loja Azul')
  })

  it('getCustomer throws when not found', async () => {
    const selectChain = createSelectChain({ single: null })
    selectMock.mockReturnValue(selectChain.chain)

    await expect(
      repository.getCustomer('00000000-0000-0000-0000-000000000999' as any)
    ).rejects.toThrow('O cliente não foi encontrado.')
  })

  it('updateCustomer updates address when provided', async () => {
    const repo = new DrizzleCustomerRepository()
    const address = Address.fromDTO({
      streetName: 'Rua A',
      streetNumber: 10,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001000',
    })
    const phone = SmartphoneNumber.fromDTO({
      value: '11987654321',
      isWhatsApp: true,
    })
    const existing = new Customer(
      baseRow.id as any,
      'Original',
      address,
      'Joana',
      phone,
      undefined
    )
    vi.spyOn(repo, 'getCustomer').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCustomer({
      id: baseRow.id,
      addressStreetName: 'Rua Nova',
      addressStreetNumber: '999',
      addressNeighborhood: 'Bairro Novo',
      addressCity: 'Rio de Janeiro',
      addressState: 'RJ',
      addressZipCode: '20000000',
    })

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      addressStreetName: 'Rua Nova',
      addressStreetNumber: '999',
      addressNeighborhood: 'Bairro Novo',
      addressCity: 'Rio de Janeiro',
      addressState: 'RJ',
      addressZipCode: '20000000',
    })
    expect(updateChain.where).toHaveBeenCalled()
  })

  it('updateCustomer updates landline when provided', async () => {
    const repo = new DrizzleCustomerRepository()
    const address = Address.fromDTO({
      streetName: 'Rua A',
      streetNumber: 10,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001000',
    })
    const phone = SmartphoneNumber.fromDTO({
      value: '11987654321',
      isWhatsApp: true,
    })
    const existing = new Customer(
      baseRow.id as any,
      'Original',
      address,
      'Joana',
      phone,
      undefined
    )
    vi.spyOn(repo, 'getCustomer').mockResolvedValue(existing)

    const updateChain = createUpdateChain()
    updateMock.mockReturnValue(updateChain.chain)

    await repo.updateCustomer({
      id: baseRow.id,
      landlineNumber: '(21) 2222-3333',
      landlineIsWhatsApp: true,
    })

    const payload = (
      updateChain.set.mock.calls[0] as unknown[] | undefined
    )?.[0]
    expect(payload).toMatchObject({
      landlineNumber: '2122223333',
      landlineIsWhatsApp: true,
    })
    expect(updateChain.where).toHaveBeenCalled()
  })
})
