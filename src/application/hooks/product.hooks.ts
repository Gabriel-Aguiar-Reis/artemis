import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleProductRepository from '@/src/infra/repositories/drizzle/drizzle.product.repository'

const productRepo = new DrizzleProductRepository()
export const productHooks = createRepositoryHooks(
  productRepo,
  'products',
  'produto'
)
