export interface UpdatePaymentOrderDto {
  id: string
  method: string
  totalValue: number
  installments: number
  isPaid: boolean
  paidInstallments: number
}
