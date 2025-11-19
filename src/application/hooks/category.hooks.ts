import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleCategoryRepository from '@/src/infra/repositories/drizzle/drizzle.category.repository'

const categoryRepo = new DrizzleCategoryRepository()
export const categoryHooks = createRepositoryHooks(
  categoryRepo,
  'categories',
  'categoria',
  'F'
)
