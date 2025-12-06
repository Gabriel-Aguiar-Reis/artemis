import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzlePaymentOrderRepository from '@/src/infra/repositories/drizzle/drizzle.payment-order.repository'

const paymentOrderRepo = new DrizzlePaymentOrderRepository()
export const paymentOrderHooks = createRepositoryHooks(
  paymentOrderRepo,
  'paymentOrders',
  'pedido de pagamento'
)
