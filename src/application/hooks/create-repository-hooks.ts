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
    // Example: Category added successfully!
    return `${resourceNameCapitalized} ${actionWord} com sucesso!`
  } else {
    // Example: Error adding category!
    return `Erro ao ${actionWord} ${resourceName.toLowerCase()}!`
  }
}

/** Master data changes rarely and every mutation invalidates it: longer cache. */
const REFERENCE_DATA_KEYS: QueryKey[] = ['customers', 'products', 'categories']
const DEFAULT_STALE_TIME = 1000 * 30
const REFERENCE_STALE_TIME = 1000 * 60 * 5

const DELETE_IN_USE_MESSAGES: Partial<Record<QueryKey, string>> = {
  customers: 'Este cliente possui ordens de serviço e não pode ser excluído.',
  products: 'Este produto está em ordens de serviço e não pode ser excluído.',
  categories: 'Esta categoria possui produtos e não pode ser excluída.',
}

/**
 * Converts technical SQLite errors into friendly messages
 * (e.g. FK restrict when deleting a record that is still referenced).
 */
const friendlyErrorMessage = (error: Error, key: QueryKey): string => {
  if (/FOREIGN KEY constraint failed/i.test(error?.message ?? '')) {
    return (
      DELETE_IN_USE_MESSAGES[key] ??
      'Este registro está em uso e não pode ser excluído.'
    )
  }
  return error?.message
}

export const __test__ = {
  friendlyErrorMessage,
  formatToastText,
  actionWords,
}

export function createRepositoryHooks<TRepo extends Record<string, any>>(
  repo: TRepo,
  key: QueryKey,
  repoName: string,
  gender: 'M' | 'F' = 'M'
) {
  const hookified: Record<string, any> = {}

  // Get methods from the instance and the prototype
  const methods = new Set<string>()

  // Prototype (class) methods
  Object.getOwnPropertyNames(Object.getPrototypeOf(repo)).forEach((name) => {
    if (name !== 'constructor' && typeof repo[name] === 'function') {
      methods.add(name)
    }
  })

  // Instance methods
  Object.keys(repo).forEach((name) => {
    if (typeof repo[name] === 'function') {
      methods.add(name)
    }
  })

  for (const name of methods) {
    const fn = repo[name]
    if (typeof fn !== 'function') continue

    // Read methods -> useQuery
    if (name.startsWith('get')) {
      hookified[name] = (
        ...args: any[]
      ): UseQueryResult<Awaited<ReturnType<typeof fn>>, Error> =>
        useQuery({
          queryKey: [key, name, ...args],
          queryFn: () => fn.apply(repo, args),
          staleTime: REFERENCE_DATA_KEYS.includes(key)
            ? REFERENCE_STALE_TIME
            : DEFAULT_STALE_TIME,
        })
      continue
    }

    // Write methods -> useMutation
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
            // Invalidate the main query and all its dependencies
            const keysToInvalidate = getQueryKeysToInvalidate(key)

            // Immediate refetch only for mounted (active) queries; the others
            // are marked stale and reload when mounted.
            keysToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries({
                queryKey: [queryKey],
                refetchType: 'active',
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
              text2: friendlyErrorMessage(error, key),
            })
          },
        })
      }
      continue
    }

    // Other methods are returned as-is
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
