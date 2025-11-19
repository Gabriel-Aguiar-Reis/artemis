import { UUID } from 'crypto'

export type PaymentOrderSerializableDTO = {
  id: UUID
  method: string
  totalValue: number
  installments: number
  isPaid: boolean
  paidInstallments: number
}

export class PaymentOrder {
  constructor(
    public id: UUID,
    public method: string,
    public totalValue: number,
    public installments: number = 1,
    public isPaid: boolean = false,
    public paidInstallments: number = 0
  ) {
    if (installments < 1)
      throw new Error('O número de parcelas deve ser ao menos 1.')
    if (totalValue < 0) throw new Error('O valor total não pode ser negativo.')
  }

  payInstallments(count: number = 1) {
    if (this.isPaid) {
      throw new Error('O pagamento já foi concluído.')
    }

    if (this.paidInstallments + count > this.installments) {
      throw new Error(
        'Não é possível pagar mais parcelas do que o total definido.'
      )
    }

    this.paidInstallments += count

    if (this.paidInstallments >= this.installments) {
      this.setAsPaid()
    }
  }

  setAsPaid() {
    this.isPaid = true
    this.paidInstallments = this.installments
  }

  updateTotalValue(newValue: number) {
    if (newValue < 0) {
      throw new Error('O valor total não pode ser negativo.')
    }
    this.totalValue = newValue
  }

  get remainingInstallments(): number {
    return this.installments - this.paidInstallments
  }

  get installmentValue(): number {
    return this.totalValue / this.installments
  }

  toDTO(): PaymentOrderSerializableDTO {
    return {
      id: this.id,
      method: this.method,
      totalValue: this.totalValue,
      installments: this.installments,
      isPaid: this.isPaid,
      paidInstallments: this.paidInstallments,
    }
  }

  static fromDTO(dto: PaymentOrderSerializableDTO): PaymentOrder {
    return new PaymentOrder(
      dto.id,
      dto.method,
      dto.totalValue,
      dto.installments,
      dto.isPaid,
      dto.paidInstallments
    )
  }

  get paidValue(): number {
    return this.installmentValue * this.paidInstallments
  }

  get remainingValue(): number {
    return this.totalValue - this.paidValue
  }
}
