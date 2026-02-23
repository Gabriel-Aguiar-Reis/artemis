import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { category } from '@/src/infra/db/drizzle/schema/drizzle.category.schema'
import { customer } from '@/src/infra/db/drizzle/schema/drizzle.customer.schema'
import { itineraryWorkOrder } from '@/src/infra/db/drizzle/schema/drizzle.itinerary-work-order.schema'
import { itinerary } from '@/src/infra/db/drizzle/schema/drizzle.itinerary.schema'
import { license } from '@/src/infra/db/drizzle/schema/drizzle.license.schema'
import { paymentOrder } from '@/src/infra/db/drizzle/schema/drizzle.payment-order.schema'
import { product } from '@/src/infra/db/drizzle/schema/drizzle.product.schema'
import { workOrderItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-item.schema'
import { workOrderResultItem } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result-item.schema'
import { workOrderResult } from '@/src/infra/db/drizzle/schema/drizzle.work-order-result.schema'
import { workOrder } from '@/src/infra/db/drizzle/schema/drizzle.work-order.schema'

const tableStores = new Map<any, { rows: any[]; inserted: any[] }>()
const fileContents = new Map<string, string>()

function ensureStore(table: any) {
  if (!tableStores.has(table)) {
    tableStores.set(table, { rows: [], inserted: [] })
  }
  return tableStores.get(table)!
}

const dbMock = {
  select: vi.fn(() => ({
    from(table: any) {
      return {
        all() {
          const rows = ensureStore(table).rows
          return rows.map((row) => JSON.parse(JSON.stringify(row)))
        },
        where(condition: any) {
          return {
            limit() {
              return {
                get() {
                  const value = condition?.value ?? condition
                  return ensureStore(table).rows.find((row) => row.id === value)
                },
              }
            },
          }
        },
      }
    },
  })),
  insert: vi.fn((table: any) => ({
    values(value: any) {
      return {
        run() {
          const store = ensureStore(table)
          store.inserted.push(JSON.parse(JSON.stringify(value)))
          store.rows.push(JSON.parse(JSON.stringify(value)))
          return { changes: 1 }
        },
      }
    },
  })),
}

vi.mock('@/src/infra/db/drizzle/drizzle-client', () => ({
  db: dbMock,
}))

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<any>('drizzle-orm')
  return {
    ...actual,
    eq: (_: unknown, value: unknown) => ({ value }),
  }
})

class MockDirectory {
  constructor(public uri: string) {}
}

class MockFile {
  public uri: string

  constructor(uriOrDirectory: MockDirectory | string, filename?: string) {
    if (typeof uriOrDirectory === 'string') {
      // Called as new File(uri)
      this.uri = uriOrDirectory
    } else {
      // Called as new File(directory, filename)
      this.uri = `${uriOrDirectory.uri}${filename}`
    }
  }

  async text() {
    if (!fileContents.has(this.uri)) {
      throw new Error('Missing file contents')
    }
    return fileContents.get(this.uri)!
  }

  async create() {
    // No-op for tests
  }

  async write(contents: string) {
    fileContents.set(this.uri, contents)
  }
}

const fsLegacyModule: any = {
  cacheDirectory: '/cache/',
  documentDirectory: '/docs/',
}
fsLegacyModule.__esModule = true
fsLegacyModule.default = fsLegacyModule

vi.mock('expo-file-system/legacy', () => fsLegacyModule)

const fsModule: any = {
  File: MockFile,
}
fsModule.__esModule = true
fsModule.default = fsModule

vi.mock('expo-file-system', () => fsModule)

const sharingModule: any = {
  isAvailableAsync: vi.fn(async () => true),
  shareAsync: vi.fn(async () => undefined),
}
sharingModule.__esModule = true
sharingModule.default = sharingModule

vi.mock('expo-sharing', () => sharingModule)

const documentPickerModule: any = {
  getDocumentAsync: vi.fn(),
}
documentPickerModule.__esModule = true
documentPickerModule.default = documentPickerModule

vi.mock('expo-document-picker', () => documentPickerModule)

type DumpModule = typeof import('@/src/application/services/dump.service')

const tableMap = [
  { key: 'category' as const, table: category },
  { key: 'product' as const, table: product },
  { key: 'customer' as const, table: customer },
  { key: 'itinerary' as const, table: itinerary },
  { key: 'itineraryWorkOrder' as const, table: itineraryWorkOrder },
  { key: 'license' as const, table: license },
  { key: 'paymentOrder' as const, table: paymentOrder },
  { key: 'workOrder' as const, table: workOrder },
  { key: 'workOrderItem' as const, table: workOrderItem },
  { key: 'workOrderResult' as const, table: workOrderResult },
  { key: 'workOrderResultItem' as const, table: workOrderResultItem },
]

const sampleDump = {
  version: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  tables: {
    category: [
      { id: 'cat-existing', name: 'Existing Category' },
      { id: 'cat-new', name: 'New Category' },
    ],
    product: [
      { id: 'prod-existing', sku: 'EXIST', categoryId: 'cat-existing' },
      { id: 'prod-new', sku: 'NEW', categoryId: 'cat-existing' },
    ],
    customer: [
      { id: 'cust-existing', storeName: 'Store A' },
      { id: 'cust-new', storeName: 'Store B' },
    ],
    itinerary: [
      { id: 'it-existing', name: 'Route A' },
      { id: 'it-new', name: 'Route B' },
    ],
    itineraryWorkOrder: [
      {
        id: 'iwo-existing',
        itineraryId: 'it-existing',
        workOrderId: 'wo-existing',
      },
      { id: 'iwo-new', itineraryId: 'it-new', workOrderId: 'wo-new' },
    ],
    license: [
      { id: 'lic-existing', code: 'EXIST', isAdmin: false },
      { id: 'lic-new', code: 'NEW', isAdmin: false },
    ],
    paymentOrder: [
      {
        id: 'pay-existing',
        method: 'Pix',
        totalValue: 100,
        installments: 1,
        paidInstallments: 1,
        isPaid: true,
      },
      {
        id: 'pay-new',
        method: 'Card',
        totalValue: 200,
        installments: 2,
        paidInstallments: 1,
        isPaid: false,
      },
    ],
    workOrder: [
      {
        id: 'wo-existing',
        customerId: 'cust-existing',
        scheduledDate: '2025-02-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
        status: 'PENDING',
      },
      {
        id: 'wo-new',
        customerId: 'cust-new',
        scheduledDate: '2025-03-01',
        createdAt: '2025-02-01',
        updatedAt: '2025-02-02',
        status: 'PENDING',
      },
    ],
    workOrderItem: [
      {
        id: 'woi-existing',
        workOrderId: 'wo-existing',
        productId: 'prod-existing',
        quantity: 1,
      },
      {
        id: 'woi-new',
        workOrderId: 'wo-new',
        productId: 'prod-new',
        quantity: 2,
      },
    ],
    workOrderResult: [
      { id: 'wor-existing', totalValue: 80 },
      { id: 'wor-new', totalValue: 120 },
    ],
    workOrderResultItem: [
      {
        id: 'wori-existing',
        resultId: 'wor-existing',
        productId: 'prod-existing',
        quantity: 1,
        type: 'EXCHANGED',
        salePrice: 80,
      },
      {
        id: 'wori-new',
        resultId: 'wor-new',
        productId: 'prod-new',
        quantity: 1,
        type: 'ADDED',
        salePrice: 120,
      },
    ],
  },
}

function setTableRows(table: any, rows: any[]) {
  const store = ensureStore(table)
  store.rows = rows.map((row) => JSON.parse(JSON.stringify(row)))
  store.inserted = []
}

function seedExistingRows() {
  tableStores.clear()
  for (const { key, table } of tableMap) {
    const [existing] = sampleDump.tables[key]
    setTableRows(table, existing ? [existing] : [])
  }
}

function seedFullRows() {
  tableStores.clear()
  for (const { key, table } of tableMap) {
    setTableRows(table, sampleDump.tables[key])
  }
}

let dumpModule: DumpModule
let buildDumpJsonString: DumpModule['buildDumpJsonString']
let saveDumpJsonToTempAndShare: DumpModule['saveDumpJsonToTempAndShare']
let pickDumpJson: DumpModule['pickDumpJson']
let importDumpFromPickedFile: DumpModule['importDumpFromPickedFile']
let importDumpFromJsonString: DumpModule['importDumpFromJsonString']

beforeAll(async () => {
  dumpModule = await import('@/src/application/services/dump.service')
  buildDumpJsonString = dumpModule.buildDumpJsonString
  saveDumpJsonToTempAndShare = dumpModule.saveDumpJsonToTempAndShare
  pickDumpJson = dumpModule.pickDumpJson
  importDumpFromPickedFile = dumpModule.importDumpFromPickedFile
  importDumpFromJsonString = dumpModule.importDumpFromJsonString
})

beforeEach(() => {
  vi.clearAllMocks()
  fileContents.clear()
  fsLegacyModule.cacheDirectory = '/cache/'
  fsLegacyModule.documentDirectory = '/docs/'
})

describe('dump.service', () => {
  it('buildDumpJsonString aggregates all table data', async () => {
    seedFullRows()

    const json = await buildDumpJsonString()
    const parsed = JSON.parse(json)

    expect(parsed.version).toBe(1)
    expect(parsed.tables.category).toHaveLength(2)
    expect(parsed.tables.workOrderResultItem[1].id).toBe('wori-new')
  })

  it('saveDumpJsonToTempAndShare writes file and triggers sharing when available', async () => {
    seedFullRows()
    sharingModule.isAvailableAsync.mockResolvedValueOnce(true)

    const path = await saveDumpJsonToTempAndShare()
    const savedJson = fileContents.get(path)!
    const parsed = JSON.parse(savedJson)

    expect(path).toBe('/cache/artemis-dump.json')
    expect(parsed.tables.category[0].id).toBe('cat-existing')
    expect(sharingModule.shareAsync).toHaveBeenCalledWith(
      '/cache/artemis-dump.json',
      {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: 'Exportar dump JSON',
      }
    )
  })

  it('saveDumpJsonToTempAndShare throws when no directory is available', async () => {
    seedFullRows()
    fsLegacyModule.cacheDirectory = null
    fsLegacyModule.documentDirectory = null
    sharingModule.isAvailableAsync.mockResolvedValueOnce(false)

    await expect(saveDumpJsonToTempAndShare()).rejects.toThrow(
      'No writable directory available'
    )
  })

  it('pickDumpJson returns null when selection is canceled', async () => {
    documentPickerModule.getDocumentAsync.mockResolvedValueOnce({
      canceled: true,
    })

    const result = await pickDumpJson()

    expect(result).toBeNull()
  })

  it('pickDumpJson returns the selected uri', async () => {
    documentPickerModule.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://selected.json' }],
    })

    const result = await pickDumpJson()

    expect(result).toBe('file://selected.json')
  })

  it('importDumpFromPickedFile reads disk and inserts missing rows', async () => {
    seedExistingRows()
    const fileUri = 'file://dump.json'
    fileContents.set(fileUri, JSON.stringify(sampleDump))

    const result = await importDumpFromPickedFile(fileUri)

    expect(result.tables.category[1].id).toBe('cat-new')
    for (const { key, table } of tableMap) {
      const store = ensureStore(table)
      const [, newRecord] = sampleDump.tables[key]
      expect(store.inserted.some((row) => row.id === newRecord.id)).toBe(true)
    }
  })

  it('importDumpFromJsonString skips inserts when rows already exist', async () => {
    seedFullRows()

    const result = await importDumpFromJsonString(JSON.stringify(sampleDump))

    expect(result.tables.paymentOrder[0].id).toBe('pay-existing')
    for (const { table } of tableMap) {
      const store = ensureStore(table)
      expect(store.inserted).toHaveLength(0)
    }
  })
})
