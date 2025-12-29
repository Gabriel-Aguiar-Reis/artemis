import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import React, { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vitest } from 'vitest'

// Mock do repositório
vitest.mock('@/src/infra/repositories/drizzle/drizzle.category.repository')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }

  return Wrapper
}

describe('Category Hooks', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  describe('getCategories', () => {
    it('should have getCategories function', () => {
      expect(categoryHooks).toHaveProperty('getCategories')
      expect(typeof categoryHooks.getCategories).toBe('function')
    })

    it('should be a React Query query', () => {
      const { result } = renderHook(() => categoryHooks.getCategories(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('isError')
      expect(result.current).toHaveProperty('refetch')
    })
  })

  describe('getCategory', () => {
    it('should have getCategory function', () => {
      expect(categoryHooks).toHaveProperty('getCategory')
      expect(typeof categoryHooks.getCategory).toBe('function')
    })

    it('should accept an ID as a parameter', () => {
      const testId = '123e4567-e89b-12d3-a456-426614174000'

      const { result } = renderHook(() => categoryHooks.getCategory(testId), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('isLoading')
    })
  })

  describe('addCategory', () => {
    it('should have addCategory function', () => {
      expect(categoryHooks).toHaveProperty('addCategory')
      expect(typeof categoryHooks.addCategory).toBe('function')
    })

    it('should be a React Query mutation', () => {
      const { result } = renderHook(() => categoryHooks.addCategory(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('mutate')
      expect(result.current).toHaveProperty('mutateAsync')
      expect(result.current).toHaveProperty('isPending')
      expect(result.current).toHaveProperty('isError')
      expect(result.current).toHaveProperty('isSuccess')
    })
  })

  describe('updateCategory', () => {
    it('should have updateCategory function', () => {
      expect(categoryHooks).toHaveProperty('updateCategory')
      expect(typeof categoryHooks.updateCategory).toBe('function')
    })

    it('should be a React Query mutation', () => {
      const { result } = renderHook(() => categoryHooks.updateCategory(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('mutate')
      expect(result.current).toHaveProperty('mutateAsync')
    })
  })

  describe('deleteCategory', () => {
    it('should have deleteCategory function', () => {
      expect(categoryHooks).toHaveProperty('deleteCategory')
      expect(typeof categoryHooks.deleteCategory).toBe('function')
    })

    it('should be a React Query mutation', () => {
      const { result } = renderHook(() => categoryHooks.deleteCategory(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('mutate')
      expect(result.current).toHaveProperty('mutateAsync')
    })
  })

  describe('getActiveCategories', () => {
    it('should have getActiveCategories function', () => {
      expect(categoryHooks).toHaveProperty('getActiveCategories')
      expect(typeof categoryHooks.getActiveCategories).toBe('function')
    })

    it('should be a React Query query', () => {
      const { result } = renderHook(() => categoryHooks.getActiveCategories(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('isLoading')
    })
  })

  describe('updateDisableCategory', () => {
    it('should have updateDisableCategory function', () => {
      expect(categoryHooks).toHaveProperty('updateDisableCategory')
      expect(typeof categoryHooks.updateDisableCategory).toBe('function')
    })

    it('should be a React Query mutation', () => {
      const { result } = renderHook(
        () => categoryHooks.updateDisableCategory(),
        {
          wrapper: createWrapper(),
        }
      )

      expect(result.current).toHaveProperty('mutate')
      expect(result.current).toHaveProperty('mutateAsync')
    })
  })

  describe('Verification of all generated hooks', () => {
    it('should have all expected hooks', () => {
      const expectedHooks = [
        'getCategories',
        'getCategory',
        'addCategory',
        'updateCategory',
        'deleteCategory',
        'getActiveCategories',
        'updateDisableCategory',
      ]

      expectedHooks.forEach((hookName) => {
        expect(categoryHooks).toHaveProperty(hookName)
        expect(typeof (categoryHooks as any)[hookName]).toBe('function')
      })
    })
  })
})
