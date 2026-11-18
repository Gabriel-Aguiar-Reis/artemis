import {
  computeResultTotal,
  isFinalStatus,
  isKnownStatus,
  normalizePaymentState,
  resolveResultStatus,
  roundMoney,
} from '@/src/domain/entities/work-order/work-order-rules'
import { WorkOrderStatus } from '@/src/domain/entities/work-order/work-order.entity'
import { describe, expect, it } from 'vitest'

describe('work-order-rules', () => {
  it('resolveResultStatus: nothing exchanged or added is FAILED', () => {
    expect(
      resolveResultStatus({ scheduled: 2, exchanged: 0, added: 0, removed: 1 })
    ).toBe(WorkOrderStatus.FAILED)
  })

  it('resolveResultStatus: collected or incomplete exchange is PARTIAL', () => {
    expect(
      resolveResultStatus({ scheduled: 2, exchanged: 2, added: 0, removed: 1 })
    ).toBe(WorkOrderStatus.PARTIAL)
    expect(
      resolveResultStatus({ scheduled: 3, exchanged: 2, added: 0, removed: 0 })
    ).toBe(WorkOrderStatus.PARTIAL)
  })

  it('resolveResultStatus: everything exchanged is COMPLETED, and so is only added', () => {
    expect(
      resolveResultStatus({ scheduled: 2, exchanged: 2, added: 1, removed: 0 })
    ).toBe(WorkOrderStatus.COMPLETED)
    expect(
      resolveResultStatus({ scheduled: 0, exchanged: 0, added: 3, removed: 0 })
    ).toBe(WorkOrderStatus.COMPLETED)
  })

  it('roundMoney rounds to cents', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(NaN)).toBe(0)
  })

  it('computeResultTotal sums exchanged and added with exact cents', () => {
    expect(
      computeResultTotal(
        [{ quantity: 3, priceSnapshot: 0.1 }],
        [{ quantity: 1, priceSnapshot: 0.2 }]
      )
    ).toBe(0.5)
  })

  it('normalizePaymentState keeps paid and installments consistent', () => {
    expect(
      normalizePaymentState({
        installments: 3,
        paidInstallments: 3,
        isPaid: false,
      })
    ).toEqual({ installments: 3, paidInstallments: 3, isPaid: true })
    expect(
      normalizePaymentState({
        installments: 3,
        paidInstallments: 1,
        isPaid: true,
      })
    ).toEqual({ installments: 3, paidInstallments: 3, isPaid: true })
    expect(
      normalizePaymentState({
        installments: 2,
        paidInstallments: 9,
        isPaid: false,
      })
    ).toEqual({ installments: 2, paidInstallments: 2, isPaid: true })
    expect(
      normalizePaymentState({
        installments: 0,
        paidInstallments: -1,
        isPaid: false,
      })
    ).toEqual({ installments: 1, paidInstallments: 0, isPaid: false })
  })

  it('recognizes final and unknown statuses', () => {
    expect(isFinalStatus(WorkOrderStatus.COPIED)).toBe(true)
    expect(isFinalStatus(WorkOrderStatus.PENDING)).toBe(false)
    expect(isKnownStatus('completed')).toBe(false)
    expect(isKnownStatus('COMPLETED')).toBe(true)
  })
})
