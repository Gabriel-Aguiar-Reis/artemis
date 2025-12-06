import {
  getQueryKeysToInvalidate,
  QueryKey,
} from '@/src/application/hooks/query-invalidation.config'
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import Toast from 'react-native-toast-message'

type actionWordsType = {
  [key in 'success' | 'error']: {
    M: {
      add: string
      update: string
      delete: string
    }
    F: {
      add: string
      update: string
      delete: string
    }

    case: 'capitalized' | 'lower'
  }
}

const actionWords: actionWordsType = {
  success: {
    M: {
      add: 'adicionado',
      update: 'atualizado',
      delete: 'deletado',
    },
    F: {
      add: 'adicionada',
      update: 'atualizada',
      delete: 'deletada',
    },
    case: 'capitalized',
  },
  error: {
    M: {
      add: 'adicionar',
      update: 'atualizar',
      delete: 'deletar',
    },
    F: {
      add: 'adicionar',
      update: 'atualizar',
      delete: 'deletar',
    },

    case: 'lower',
  },
}

const formatToastText = (
  repoName: string,
  action: 'add' | 'update' | 'delete',
  type: 'success' | 'error',
  gender: 'M' | 'F' = 'M'
) => {
  const genderWords = actionWords[type]
    ? actionWords[type]
    : actionWords['error']
  const actionWord = genderWords[gender][action]
  const resourceName = repoName
    .replace(/^(add|update|delete)/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
  const resourceNameCapitalized =
    resourceName.charAt(0).toUpperCase() + resourceName.slice(1).toLowerCase()

  if (type === 'success') {
    // Exemplo: Categoria adicionada com sucesso!
    return `${resourceNameCapitalized} ${actionWord} com sucesso!`
  } else {
    // Exemplo: Erro ao adicionar categoria!
    return `Erro ao ${actionWord} ${resourceName.toLowerCase()}!`
  }
}

export function createRepositoryHooks<TRepo extends Record<string, any>>(
  repo: TRepo,
  key: QueryKey,
  repoName: string,
  gender: 'M' | 'F' = 'M'
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
          staleTime: 1000 * 30, // 30 segundos
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
          onSuccess: () => {
            // Invalida a query principal e todas suas dependências
            const keysToInvalidate = getQueryKeysToInvalidate(key)

            // Invalida e força refetch imediato de todas as queries
            keysToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries({
                queryKey: [queryKey],
                refetchType: 'all', // Força refetch de todas as queries (ativas e inativas)
              })
            })

            Toast.show({
              type: 'success',
              text1: formatToastText(
                repoName,
                name.startsWith('add')
                  ? 'add'
                  : name.startsWith('update')
                    ? 'update'
                    : 'delete',
                'success',
                gender
              ),
            })
          },
          onError: (error: Error) => {
            Toast.show({
              type: 'error',
              text1: formatToastText(
                repoName,
                name.startsWith('add')
                  ? 'add'
                  : name.startsWith('update')
                    ? 'update'
                    : 'delete',
                'error',
                gender
              ),
              text2: error.message,
            })
          },
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
