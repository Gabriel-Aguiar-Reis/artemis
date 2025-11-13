import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleWorkOrderRepository from '@/src/infra/repositories/drizzle/drizzle.work-order.repository'

const workOrderRepo = new DrizzleWorkOrderRepository()
export const workOrderHooks = createRepositoryHooks(workOrderRepo, 'workOrders')
