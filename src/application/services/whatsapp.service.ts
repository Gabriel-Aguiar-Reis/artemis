import { WorkOrder } from '@/src/domain/entities/work-order/work-order.entity'
import { Linking } from 'react-native'

export class WhatsAppService {
  static sendWorkOrderMessage(
    workOrder: WorkOrder,
    notifyVisit: boolean
  ): void {
    const customer = workOrder.customer

    const phone = customer.getMainNumber()

    if (!customer.isActiveWhatsApp()) {
      throw new Error('O cliente não possui WhatsApp ativo.')
    }

    if (!phone) {
      throw new Error('O cliente não possui um número de telefone válido.')
    }

    // Remove caracteres não numéricos do telefone
    const phoneNumber = phone.value.replace(/\D/g, '')

    // Monta a mensagem
    const message = this.buildWorkOrderMessage(workOrder, notifyVisit)

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    // Monta o link do WhatsApp
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodedMessage}`

    // Abre o link
    Linking.openURL(whatsappUrl).catch((err) => {
      console.error('Erro:', err)
      throw new Error('Falha ao abrir o WhatsApp')
    })
  }

  private static buildWorkOrderMessage(
    workOrder: WorkOrder,
    notifyVisit: boolean
  ): string {
    let message = `Olá, ${workOrder.customer.contactName}, tudo bem?\n\n`

    const customer = workOrder.customer
    const scheduledDate = workOrder.scheduledDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    if (notifyVisit) {
      message += `A minha visita está confirmada para o dia *${scheduledDate}*.\n\n`
      message += `Qualquer dúvida, estou à disposição!`
      return message
    }

    message += `📋 Segue o resumo da *Ordem de Serviço* realizada:\n\n`
    message += `🏪 Loja: ${customer.storeName}\n`
    message += `📅 Data agendada: ${scheduledDate}\n\n`

    if (workOrder.products && workOrder.products.length > 0) {
      message += `*Produtos Agendados:*\n`
      workOrder.products.forEach((product) => {
        message += `• ${product.productName} - ${product.quantity}x R$ ${product.salePrice.toLocaleString(
          'pt-BR',
          {
            minimumFractionDigits: 2,
          }
        )} = R$ ${product.total.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}\n`
      })
      message += `\n*Total: R$ ${workOrder.totalAmountForProducts.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 2,
        }
      )}*\n\n`
    }

    const result = workOrder.result

    if (result) {
      message += '*Relatório de Visita:*\n'
      result.addedProducts?.forEach((item) => {
        message += `• Adicionado: ${item.productSnapshot.productName} - ${item.quantity}x R$ ${item.priceSnapshot.toLocaleString(
          'pt-BR',
          {
            minimumFractionDigits: 2,
          }
        )} = R$ ${(item.priceSnapshot * item.quantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}\n`
      })
      result.exchangedProducts?.forEach((item) => {
        message += `• Trocado: ${item.productSnapshot.productName} - ${item.quantity}x R$ ${item.priceSnapshot.toLocaleString(
          'pt-BR',
          {
            minimumFractionDigits: 2,
          }
        )} = R$ ${(item.priceSnapshot * item.quantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })}\n`
      })
      message += `\n*Total do Relatório: R$ ${result.totalValue?.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 2,
        }
      )}*\n\n`
    }

    const paymentOrder = workOrder.paymentOrder
    if (paymentOrder) {
      message += `💳 *Pagamento:*\n`
      message += `Método: ${paymentOrder.method}\n`
      if (paymentOrder.installments && paymentOrder.installments > 1) {
        message += `Parcelas: ${paymentOrder.installments}x de R$ ${(
          paymentOrder.totalValue / paymentOrder.installments
        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      message += `Pago: R$ ${paymentOrder.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      message += `Restante: R$ ${paymentOrder.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
    }
    message += `Qualquer dúvida, estou à disposição!`
    return message
  }
}
