import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleWorkOrderResultRepository from '@/src/infra/repositories/drizzle/drizzle.work-order-result.repository'

const resultRepo = new DrizzleWorkOrderResultRepository()
export const workOrderResultHooks = createRepositoryHooks(
  resultRepo,
  'workOrderResults',
  'relatório de ordem de serviço'
)
