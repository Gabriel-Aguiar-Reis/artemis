import { WhatsAppService } from '@/src/application/services/whatsapp.service'
import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { PaymentOrder } from '@/src/domain/entities/payment-order/payment-order.entity'
import {
  WorkOrderResultItem,
  WorkOrderResultItemType,
} from '@/src/domain/entities/work-order-result-item/work-order-result-item.entity'
import { WorkOrderResult } from '@/src/domain/entities/work-order-result/work-order-result.entity'
import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { UUID } from '@/src/lib/utils'
import { Linking } from 'react-native'
import { beforeEach, describe, expect, it, Mock, vitest } from 'vitest'

describe('WhatsAppService', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  describe('sendWorkOrderMessage', () => {
    const createMockCustomer = (overrides = {}) => {
      return {
        contactName: 'João Silva',
        storeName: 'Loja Teste',
        getMainNumber: vitest.fn(() => ({ value: '+55 11 99999-9999' })),
        isActiveWhatsApp: vitest.fn(() => true),
        ...overrides,
      } as any as Customer
    }

    const createMockWorkOrder = (customerOverrides = {}) => {
      return {
        customer: createMockCustomer(customerOverrides),
        scheduledDate: new Date('2024-12-29'),
        products: [],
        totalAmountForProducts: 0,
        result: null,
        paymentOrder: null,
      } as any as WorkOrder
    }

    it('should throw an error when customer does not have active WhatsApp', () => {
      const customer = createMockCustomer({ isActiveWhatsApp: () => false })
      const workOrder = createMockWorkOrder({ isActiveWhatsApp: () => false })
      workOrder.customer = customer

      expect(() => {
        WhatsAppService.sendWorkOrderMessage(workOrder, false)
      }).toThrow('O cliente não possui WhatsApp ativo.')
    })

    it('should throw an error when customer does not have a phone number', () => {
      const customer = createMockCustomer({ getMainNumber: () => null })
      const workOrder = createMockWorkOrder({ getMainNumber: () => null })
      workOrder.customer = customer

      expect(() => {
        WhatsAppService.sendWorkOrderMessage(workOrder, false)
      }).toThrow('O cliente não possui um número de telefone válido.')
    })

    it('should open WhatsApp with visit notification message', () => {
      const workOrder = createMockWorkOrder()
      ;(Linking.openURL as Mock).mockResolvedValue(true)

      WhatsAppService.sendWorkOrderMessage(workOrder, true)

      expect(Linking.openURL).toHaveBeenCalled()
      const url = (Linking.openURL as Mock).mock.calls[0][0]
      expect(url).toContain('wa.me/5511999999999')
      expect(url).toContain('visita%20est%C3%A1%20confirmada')
    })

    it('should open WhatsApp with work order summary', () => {
      const workOrder = {
        customer: createMockCustomer(),
        scheduledDate: new Date('2024-12-29'),
        products: [
          {
            productName: 'Produto 1',
            quantity: 2,
            salePrice: 50.0,
            total: 100.0,
          } as any,
        ],
        totalAmountForProducts: 100.0,
        result: null,
      } as any as WorkOrder

      ;(Linking.openURL as Mock).mockResolvedValue(true)

      WhatsAppService.sendWorkOrderMessage(workOrder, false)

      expect(Linking.openURL).toHaveBeenCalled()
      const url = (Linking.openURL as Mock).mock.calls[0][0]
      expect(url).toContain('wa.me/5511999999999')
      expect(url).toContain('Ordem%20de%20Servi%C3%A7o')
    })

    it('should remove non-numeric characters from the phone number', () => {
      const workOrder = createMockWorkOrder()
      ;(Linking.openURL as Mock).mockResolvedValue(true)

      WhatsAppService.sendWorkOrderMessage(workOrder, false)

      const url = (Linking.openURL as Mock).mock.calls[0][0]
      expect(url).toContain('wa.me/5511999999999')
      expect(url).not.toContain('+')
      expect(url).not.toContain(' ')
      expect(url).not.toContain('-')
    })

    it('should not duplicate country code if number already has it', () => {
      // Simula um número que veio de planilha com código do país
      const customer = createMockCustomer({
        getMainNumber: () => ({ value: '5511987654321' }),
      })
      const workOrder = createMockWorkOrder()
      workOrder.customer = customer
      ;(Linking.openURL as Mock).mockResolvedValue(true)

      WhatsAppService.sendWorkOrderMessage(workOrder, false)

      const url = (Linking.openURL as Mock).mock.calls[0][0]
      // Deve ter exatamente 13 dígitos (55 + DDD + número)
      expect(url).toContain('wa.me/5511987654321')
      expect(url).not.toContain('wa.me/555511987654321') // Não duplicar
    })

    it('should log an error when failing to open WhatsApp', async () => {
      const workOrder = createMockWorkOrder()
      const error = new Error('Failed to open URL')
      ;(Linking.openURL as Mock).mockRejectedValue(error)

      const consoleSpy = vitest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await new Promise<void>((resolve) => {
        process.once('unhandledRejection', () => resolve())
        WhatsAppService.sendWorkOrderMessage(workOrder, false)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Erro:', error)

      consoleSpy.mockRestore()
    })

    it('should include report details when result is present', () => {
      const workOrder = createMockWorkOrder()
      const resultId = 'result-1' as UUID
      const added = WorkOrderResultItem.fromDTO({
        id: 'item-added' as UUID,
        productId: 'product-1' as UUID,
        resultId,
        productName: 'Produto Novo',
        salePrice: 15,
        quantity: 2,
        type: WorkOrderResultItemType.ADDED,
      })
      const exchanged = WorkOrderResultItem.fromDTO({
        id: 'item-exchanged' as UUID,
        productId: 'product-2' as UUID,
        resultId,
        productName: 'Produto Trocado',
        salePrice: 30,
        quantity: 1,
        type: WorkOrderResultItemType.EXCHANGED,
      })
      workOrder.result = new WorkOrderResult(resultId, 0, [exchanged], [added])

      const message = (WhatsAppService as any).buildWorkOrderMessage(
        workOrder,
        false
      ) as string

      expect(message).toContain('Relatório de Visita')
      expect(message).toContain('Produto Novo')
      expect(message).toContain('Produto Trocado')
      expect(message).toContain('Total do Relatório')
    })

    it('should include payment information with installments', () => {
      const workOrder = createMockWorkOrder()
      const paymentOrder = new PaymentOrder(
        'payment-1' as UUID,
        'Cartão',
        450,
        3
      )
      paymentOrder.payInstallments(1)
      workOrder.paymentOrder = paymentOrder

      const message = (WhatsAppService as any).buildWorkOrderMessage(
        workOrder,
        false
      ) as string

      expect(message).toContain('Pagamento')
      expect(message).toContain('Parcelas: 3x de R$ 150,00')
      expect(message).toContain('Pago: R$ 150,00')
      expect(message).toContain('Restante: R$ 300,00')
    })

    it('should skip installments line when only one payment', () => {
      const workOrder = createMockWorkOrder()
      const paymentOrder = new PaymentOrder('payment-2' as UUID, 'Pix', 120, 1)
      paymentOrder.setAsPaid()
      workOrder.paymentOrder = paymentOrder

      const message = (WhatsAppService as any).buildWorkOrderMessage(
        workOrder,
        false
      ) as string

      expect(message).toContain('Pagamento')
      expect(message).not.toContain('Parcelas:')
      expect(message).toContain('Pago: R$ 120,00')
      expect(message).toContain('Restante: R$ 0,00')
    })
  })
})
