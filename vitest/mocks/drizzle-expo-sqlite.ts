type Chainable<T = unknown> = {
  from: (...args: any[]) => Chainable<T>
  where: (...args: any[]) => Chainable<T>
  limit: (...args: any[]) => Chainable<T>
  get: () => T
  values?: (...args: any[]) => Chainable<T>
  onConflictDoNothing?: (...args: any[]) => Chainable<T>
  set?: (...args: any[]) => Chainable<T>
}

function createChain<T>(value: T): Chainable<T> {
  const chain: Chainable<T> = {
    from: () => chain,
    where: () => chain,
    limit: () => chain,
    get: () => value,
  }

  chain.values = () => chain
  chain.onConflictDoNothing = () => chain
  chain.set = () => chain

  return chain
}

export function drizzle() {
  const defaultChain = createChain<any[]>([])
  return {
    select: () => defaultChain,
    insert: () => defaultChain,
    update: () => defaultChain,
    delete: () => defaultChain,
  }
}
