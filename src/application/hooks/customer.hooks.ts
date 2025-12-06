import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleCustomerRepository from '@/src/infra/repositories/drizzle/drizzle.customer.repository'

const customerRepo = new DrizzleCustomerRepository()
export const customerHooks = createRepositoryHooks(
  customerRepo,
  'customers',
  'cliente'
)
