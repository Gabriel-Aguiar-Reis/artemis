/**
 * REAL SQLite database for repository integration tests.
 *
 * Uses `node:sqlite` under a client that mimics the synchronous API of the real
 * expo-sqlite (prepareSync/executeSync/...), and the drizzle driver
 * `drizzle-orm/expo-sqlite`. This way the tests exercise the same
 * path as the app, including the semantics of db.transaction (synchronous
 * BEGIN/COMMIT) that the mocks hid.
 *
 * Usage in a test:
 *   vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
 *     (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
 *   )
 */
import * as schema from '@/src/infra/db/drizzle/schema'
// File path on purpose: vitest.config aliases
// 'drizzle-orm/expo-sqlite' to a mock, and here we want the real driver.
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { drizzle } from '../../node_modules/drizzle-orm/expo-sqlite/driver.js'

// node:sqlite via require: the vitest bundler does not know the `node:` scheme
// for this still-experimental module.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (file: string) => any
}

const MIGRATIONS_DIR = path.resolve(__dirname, '../infra/db/drizzle')

const norm = (v: unknown) =>
  v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v

function makeExpoLikeClient(raw: any) {
  return {
    prepareSync(sql: string) {
      const stmt = raw.prepare(sql)
      const isRead =
        /^\s*(select|with|pragma)\b/i.test(sql) || /\breturning\b/i.test(sql)
      return {
        executeSync(params: unknown[] = []) {
          const p = params.map(norm)
          if (isRead) {
            return {
              changes: 0,
              lastInsertRowId: 0,
              getAllSync: () => stmt.all(...p),
              getFirstSync: () => stmt.get(...p) ?? null,
            }
          }
          const r = stmt.run(...p)
          return {
            changes: Number(r.changes),
            lastInsertRowId: Number(r.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          }
        },
        executeForRawResultSync(params: unknown[] = []) {
          const p = params.map(norm)
          stmt.setReturnArrays(true)
          return { getAllSync: () => stmt.all(...p) }
        },
        finalizeSync() {},
      }
    },
    execSync(sql: string) {
      raw.exec(sql)
    },
    closeSync() {},
  }
}

function applyMigrations(raw: any) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    for (const stmt of sql.split('--> statement-breakpoint')) {
      if (stmt.trim()) raw.exec(stmt)
    }
  }
}

function createTestDb() {
  const raw = new DatabaseSync(':memory:')
  applyMigrations(raw)
  raw.exec('PRAGMA foreign_keys = ON;')
  const client = makeExpoLikeClient(raw)
  const db = drizzle(client as any, { schema })
  return { raw, db }
}

let current: ReturnType<typeof createTestDb> | null = null

/** Shared instance per test file (created on demand). */
export function getTestDb() {
  if (!current) current = createTestDb()
  return current
}

/** Deletes all rows (keeps the schema). Call in beforeEach. */
export function resetTestDb() {
  const { raw } = getTestDb()
  raw.exec('PRAGMA foreign_keys = OFF;')
  const tables = raw
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
    )
    .all() as { name: string }[]
  for (const { name } of tables) raw.exec(`DELETE FROM "${name}"`)
  raw.exec('PRAGMA foreign_keys = ON;')
}

/** Replacement for the drizzle-client module for vi.mock. */
export function drizzleClientMock() {
  const { db } = getTestDb()
  return {
    db,
    getExpoDb: () => getTestDb().raw,
    enableForeignKeys: () => undefined,
    initDrizzleClient: () => db,
    resetDrizzleClient: () => undefined,
    deleteDatabaseAndReset: async () => true,
  }
}

/** Counts rows of a table (shortcut for assertions). */
export function countRows(table: string): number {
  const { raw } = getTestDb()
  return Number(
    (raw.prepare(`SELECT count(*) AS n FROM "${table}"`).get() as any).n
  )
}
