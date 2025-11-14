import { Linking } from 'react-native'
import { WorkOrder } from '../models'

export class WhatsAppService {
  static sendWorkOrderMessage(workOrder: WorkOrder): void {
    const customer = workOrder.customer

    if (!customer.isActiveWhatsApp()) {
      throw new Error('Customer does not have WhatsApp enabled')
    }

    // Remove caracteres não numéricos do telefone
    const phoneNumber = customer.phoneNumber.value.replace(/\D/g, '')

    // Monta a mensagem
    const message = this.buildWorkOrderMessage(workOrder)

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    // Monta o link do WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    // Abre o link
    Linking.openURL(whatsappUrl).catch((err) => {
      console.error('Failed to open WhatsApp', err)
      throw new Error('Failed to open WhatsApp')
    })
  }

  private static buildWorkOrderMessage(workOrder: WorkOrder): string {
    const customer = workOrder.customer
    const scheduledDate = workOrder.scheduledDate.toLocaleDateString('pt-BR')
    const scheduledTime = workOrder.scheduledDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    let message = `Olá ${customer.contactName}!\n\n`
    message += `📋 *Ordem de Serviço #${workOrder.id.slice(0, 8)}*\n\n`
    message += `🏪 Loja: ${customer.storeName}\n`
    message += `📅 Data agendada: ${scheduledDate} às ${scheduledTime}\n\n`

    if (workOrder.products.length > 0) {
      message += `*Produtos:*\n`
      workOrder.products.forEach((product) => {
        message += `• ${product.productName} - ${product.quantity}x R$ ${product.salePrice.toFixed(2)} = R$ ${product.total.toFixed(2)}\n`
      })
      message += `\n*Total: R$ ${workOrder.totalAmount.toFixed(2)}*\n\n`
    }

    message += `💳 *Pagamento:*\n`
    message += `Método: ${workOrder.paymentOrder.method}\n`
    message += `Parcelas: ${workOrder.paymentOrder.installments}x de R$ ${workOrder.paymentOrder.installmentValue.toFixed(2)}\n`
    message += `Pago: R$ ${workOrder.paymentOrder.paidValue.toFixed(2)}\n`
    message += `Restante: R$ ${workOrder.paymentOrder.remainingValue.toFixed(2)}\n\n`

    message += `Qualquer dúvida, estou à disposição! 😊`

    return message
  }
}
