'use client'

import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/lib/actions/categories'

export const categoriesKeys = ['categories'] as const

type Category = Awaited<ReturnType<typeof getCategories>>[number]

export function useCategories(initial: Category[]) {
  return useQuery<Category[]>({
    queryKey: categoriesKeys,
    queryFn: () => getCategories(),
    initialData: initial,
    staleTime: 30_000,
  })
}
