import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleWorkOrderItemRepository from '@/src/infra/repositories/drizzle/drizzle.work-order-item.repository'

const workOrderItemRepo = new DrizzleWorkOrderItemRepository()
export const workOrderItemHooks = createRepositoryHooks(
  workOrderItemRepo,
  'workOrderItems',
  'item de ordem de serviço'
)
