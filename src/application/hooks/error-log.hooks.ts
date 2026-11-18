import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleErrorLogRepository from '@/src/infra/repositories/drizzle/drizzle.error-log.repository'

const errorLogRepo = new DrizzleErrorLogRepository()

export const errorLogHooks = createRepositoryHooks(
  errorLogRepo,
  'errorLogs',
  'log de erro',
  'M'
)
