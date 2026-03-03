import { createRepositoryHooks } from '@/src/application/hooks/create-repository-hooks'
import DrizzleProductRepository, {
  ProductFilters,
} from '@/src/infra/repositories/drizzle/drizzle.product.repository'
import { useQuery } from '@tanstack/react-query'

const productRepo = new DrizzleProductRepository()
export const productHooks = createRepositoryHooks(
  productRepo,
  'products',
  'produto'
)

export { ProductFilters }

// Hook customizado para getProductsWithCategory com filtros
export const useProductsWithCategoryFiltered = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', 'with-category', filters],
    queryFn: () => productRepo.getProductsWithCategory(filters),
    staleTime: 1000 * 30, // 30 segundos
  })
}
