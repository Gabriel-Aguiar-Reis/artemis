import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'

export function createRepositoryHooks<TRepo extends Record<string, any>>(
  repo: TRepo,
  key: string
) {
  const hookified: Record<string, any> = {}

  // Pega métodos da instância e do protótipo
  const methods = new Set<string>()

  // Métodos do protótipo (classe)
  Object.getOwnPropertyNames(Object.getPrototypeOf(repo)).forEach((name) => {
    if (name !== 'constructor' && typeof repo[name] === 'function') {
      methods.add(name)
    }
  })

  // Métodos da instância
  Object.keys(repo).forEach((name) => {
    if (typeof repo[name] === 'function') {
      methods.add(name)
    }
  })

  for (const name of methods) {
    const fn = repo[name]
    if (typeof fn !== 'function') continue

    // Métodos de leitura -> useQuery
    if (name.startsWith('get')) {
      hookified[name] = (
        ...args: any[]
      ): UseQueryResult<Awaited<ReturnType<typeof fn>>, Error> =>
        useQuery({
          queryKey: [key, name, ...args],
          queryFn: () => fn.apply(repo, args),
          staleTime: 1000 * 60 * 5, // 5 minutos
        })
      continue
    }

    // Métodos de escrita -> useMutation
    if (
      name.startsWith('add') ||
      name.startsWith('update') ||
      name.startsWith('delete')
    ) {
      hookified[name] = (): UseMutationResult<
        Awaited<ReturnType<typeof fn>>,
        Error,
        any,
        unknown
      > => {
        const queryClient = useQueryClient()
        return useMutation({
          mutationFn: (args: any) =>
            fn.apply(repo, Array.isArray(args) ? args : [args]),
          onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
        })
      }
      continue
    }

    // Outros métodos são retornados normalmente
    hookified[name] = fn.bind(repo)
  }

  return hookified as {
    [K in keyof TRepo]: TRepo[K] extends (...args: infer A) => Promise<infer R>
      ? K extends `get${string}` | `list${string}`
        ? (...args: A) => UseQueryResult<R, Error>
        : K extends `add${string}` | `update${string}` | `delete${string}`
          ? () => UseMutationResult<
              R,
              Error,
              A extends [infer First] ? First : A,
              unknown
            >
          : TRepo[K]
      : TRepo[K]
  }
}
