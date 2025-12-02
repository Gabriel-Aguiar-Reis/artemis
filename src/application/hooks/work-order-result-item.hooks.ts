import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import { DrizzleWorkOrderResultItemRepository } from '@/src/infra/repositories/drizzle/drizzle.work-order-result-item.repository'

const workOrderResultItemRepo = new DrizzleWorkOrderResultItemRepository()
export const workOrderResultItemHooks = createRepositoryHooks(
  workOrderResultItemRepo,
  'workOrderResultItems',
  'item de resultado de ordem de serviço',
  'M'
)
