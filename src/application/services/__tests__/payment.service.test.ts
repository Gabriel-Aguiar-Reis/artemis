import { PaymentService } from '@/src/application/services/payment.service'
import { CustomerMapper } from '@/src/domain/entities/customer/mapper/customer.mapper'
import { PaymentOrderMapper } from '@/src/domain/entities/payment-order/mapper/payment-order.mapper'
import {
  WorkOrder,
  WorkOrderStatus,
} from '@/src/domain/entities/work-order/work-order.entity'
import { workOrder } from '@/src/infra/db/drizzle/schema'
import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest'

const CONTINUE = Symbol('continue')

function createMockTx() {
  const tx: any = {
    __whereResults: [] as any[],
    __limitResults: [] as any[],
    select: vitest.fn(() => tx),
    from: vitest.fn(() => tx),
    leftJoin: vitest.fn(() => tx),
    update: vitest.fn(() => tx),
    set: vitest.fn(() => tx),
  }

  tx.where = vitest.fn(() => {
    const result = tx.__whereResults.length
      ? tx.__whereResults.shift()
      : CONTINUE
    return result === CONTINUE ? tx : result
  })

  tx.limit = vitest.fn(() => {
    return tx.__limitResults.length ? tx.__limitResults.shift() : []
  })

  return tx
}

describe('PaymentService', () => {
  let mockTx: any

  afterEach(() => {
    vitest.restoreAllMocks()
  })

  beforeEach(() => {
    vitest.clearAllMocks()
    mockTx = createMockTx()
  })

  describe('finalizePayment', () => {
    it('should throw an error when work order is not found', async () => {
      mockTx.__whereResults = [CONTINUE]
      mockTx.__limitResults = [[]]

      await expect(
        PaymentService.finalizePayment(mockTx, 'payment-123')
      ).rejects.toThrow(
        'Ordem de serviço vinculada à ordem de pagamento não encontrada.'
      )
    })

    it('should throw an error when customer is not found', async () => {
      mockTx.__whereResults = [CONTINUE, CONTINUE]
      mockTx.__limitResults = [
        [{ id: 'wo-1', customerId: 'c-1', paymentOrderId: 'p-1' }],
        [],
      ]

      await expect(
        PaymentService.finalizePayment(mockTx, 'payment-123')
      ).rejects.toThrow('Cliente vinculado à ordem de serviço não encontrado.')
    })

    it('should throw an error when items are not found', async () => {
      mockTx.__whereResults = [CONTINUE, CONTINUE, []]
      mockTx.__limitResults = [
        [{ id: 'wo-1', customerId: 'c-1', paymentOrderId: 'p-1' }],
        [{ id: 'c-1', name: 'Customer' }],
      ]

      await expect(
        PaymentService.finalizePayment(mockTx, 'payment-123')
      ).rejects.toThrow('Itens da ordem de serviço não encontrados.')
    })

    it('should throw an error when items response is null', async () => {
      mockTx.__whereResults = [CONTINUE, CONTINUE, null]
      mockTx.__limitResults = [
        [{ id: 'wo-1', customerId: 'c-1', paymentOrderId: 'p-1' }],
        [{ id: 'c-1', name: 'Customer' }],
      ]

      await expect(
        PaymentService.finalizePayment(mockTx, 'payment-123')
      ).rejects.toThrow('Itens da ordem de serviço não encontrados.')
    })

    it('should throw an error when payment order is not found', async () => {
      mockTx.__whereResults = [
        CONTINUE,
        CONTINUE,
        [
          {
            item: { id: 'i-1', productId: 'p-1', quantity: 1 },
            product: { name: 'Product' },
          },
        ],
        CONTINUE,
      ]
      mockTx.__limitResults = [
        [{ id: 'wo-1', customerId: 'c-1', paymentOrderId: 'p-1' }],
        [{ id: 'c-1', name: 'Customer' }],
        [],
      ]

      await expect(
        PaymentService.finalizePayment(mockTx, 'payment-123')
      ).rejects.toThrow(
        'Ordem de pagamento não encontrada para a ordem de serviço.'
      )
    })

    it('should finalize payment and update work order status', async () => {
      const itemsData = [
        {
          item: {
            id: 'i-1',
            productId: 'p-1',
            quantity: 1,
          },
          product: {
            name: 'Product',
            salePrice: 25,
          },
        },
      ]

      mockTx.__whereResults = [CONTINUE, CONTINUE, itemsData, CONTINUE]

      mockTx.__limitResults = [
        [
          {
            id: 'wo-1',
            customerId: 'c-1',
            paymentOrderId: 'po-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            scheduledDate: '2024-01-02T00:00:00.000Z',
            visitDate: null,
            notes: null,
          },
        ],
        [
          {
            id: 'c-1',
            storeName: 'Store',
            contactName: 'Contact',
            phoneNumber: null,
            phoneIsWhatsApp: null,
            landlineNumber: null,
            landlineIsWhatsApp: null,
            addressStreetName: 'Street',
            addressStreetNumber: '123',
            addressNeighborhood: 'Neighborhood',
            addressCity: 'City',
            addressState: 'ST',
            addressZipCode: '12345678',
          },
        ],
        [
          {
            id: 'po-1',
            method: 'cash',
            totalValue: 50,
            installments: 1,
            isPaid: false,
            paidInstallments: 0,
          },
        ],
      ]

      const customerSpy = vitest
        .spyOn(CustomerMapper, 'toDomain')
        .mockReturnValue({ id: 'c-1' } as any)

      const paymentOrderSpy = vitest
        .spyOn(PaymentOrderMapper, 'toDomain')
        .mockReturnValue({ id: 'po-1' } as any)

      const workOrderInstance = {
        finalizeAfterPayment: vitest
          .fn()
          .mockReturnValue(WorkOrderStatus.COMPLETED),
      } as any

      const workOrderSpy = vitest
        .spyOn(WorkOrder, 'fromDTO')
        .mockReturnValue(workOrderInstance)

      await PaymentService.finalizePayment(mockTx, 'po-1')

      expect(workOrderInstance.finalizeAfterPayment).toHaveBeenCalled()
      expect(mockTx.update).toHaveBeenCalledWith(workOrder)
      expect(mockTx.set).toHaveBeenCalledWith({
        status: WorkOrderStatus.COMPLETED,
      })
      expect(mockTx.where).toHaveBeenCalled()

      customerSpy.mockRestore()
      paymentOrderSpy.mockRestore()
      workOrderSpy.mockRestore()
    })

    it('should finalize payment using fallback values when optional fields missing', async () => {
      vitest.useFakeTimers()
      const now = new Date('2024-02-01T12:00:00.000Z')
      vitest.setSystemTime(now)

      mockTx.__whereResults = [
        CONTINUE,
        CONTINUE,
        [
          {
            item: {
              id: 'i-2',
              productId: 'p-2',
              quantity: 2,
            },
            product: undefined,
          },
        ],
        CONTINUE,
      ]

      mockTx.__limitResults = [
        [
          {
            id: 'wo-2',
            customerId: 'c-2',
            paymentOrderId: 'po-2',
            createdAt: undefined,
            updatedAt: undefined,
            scheduledDate: null,
            visitDate: '2024-02-05',
            notes: 'Remember to call',
          },
        ],
        [
          {
            id: 'c-2',
            storeName: 'Another Store',
          },
        ],
        [
          {
            id: 'po-2',
            method: 'card',
            totalValue: 100,
            installments: 1,
            isPaid: false,
            paidInstallments: 0,
          },
        ],
      ]

      const customerSpy = vitest
        .spyOn(CustomerMapper, 'toDomain')
        .mockReturnValue({ id: 'c-2' } as any)

      const paymentOrderSpy = vitest
        .spyOn(PaymentOrderMapper, 'toDomain')
        .mockReturnValue({ id: 'po-2' } as any)

      const workOrderInstance = {
        finalizeAfterPayment: vitest
          .fn()
          .mockReturnValue(WorkOrderStatus.COMPLETED),
      } as any

      const workOrderSpy = vitest
        .spyOn(WorkOrder, 'fromDTO')
        .mockReturnValue(workOrderInstance)

      try {
        await PaymentService.finalizePayment(mockTx, 'po-2')

        const dto = workOrderSpy.mock.calls[0][0]
        expect(dto.createdAt).toBe(now.toISOString())
        expect(dto.updatedAt).toBe(now.toISOString())
        expect(dto.products).toBeDefined()
        expect(dto.products?.[0]).toEqual({
          id: 'i-2',
          productId: 'p-2',
          quantity: 2,
          productName: '',
          salePrice: 0,
        })
        expect(dto.visitDate).toBe('2024-02-05')
        expect(dto.notes).toBe('Remember to call')
      } finally {
        vitest.useRealTimers()
        customerSpy.mockRestore()
        paymentOrderSpy.mockRestore()
        workOrderSpy.mockRestore()
      }
    })
  })
})
