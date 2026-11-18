import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleCategoryRepository, {
  CategoryFilters,
} from '@/src/infra/repositories/drizzle/drizzle.category.repository'
import { useQuery } from '@tanstack/react-query'

const categoryRepo = new DrizzleCategoryRepository()
export const categoryHooks = createRepositoryHooks(
  categoryRepo,
  'categories',
  'categoria',
  'F'
)

export const useCategoriesFiltered = (filters?: CategoryFilters) => {
  return useQuery({
    queryKey: ['categories', 'filtered', filters],
    queryFn: () => categoryRepo.getCategories(filters),
    staleTime: 1000 * 30,
  })
}
