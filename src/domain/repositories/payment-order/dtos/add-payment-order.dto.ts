export interface AddPaymentOrderDto {
  method: string
  totalValue: number
  installments?: number
}
