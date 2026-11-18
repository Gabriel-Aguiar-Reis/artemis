/**
 * Banco SQLite REAL para testes de integração dos repositórios.
 *
 * Usa `node:sqlite` por baixo de um client que imita a API síncrona do
 * expo-sqlite (prepareSync/executeSync/...), e o driver drizzle
 * `drizzle-orm/expo-sqlite` de verdade. Assim os testes exercitam o mesmo
 * caminho do app, inclusive a semântica de db.transaction (BEGIN/COMMIT
 * síncronos) que os mocks escondiam.
 *
 * Uso num teste:
 *   vi.mock('@/src/infra/db/drizzle/drizzle-client', async () =>
 *     (await import('@/src/test/sqlite-test-db')).drizzleClientMock()
 *   )
 */
import * as schema from '@/src/infra/db/drizzle/schema'
// Caminho do arquivo de propósito: o vitest.config tem alias de
// 'drizzle-orm/expo-sqlite' para um mock, e aqui queremos o driver real.
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { drizzle } from '../../node_modules/drizzle-orm/expo-sqlite/driver.js'

// node:sqlite via require: o bundler do vitest não conhece o esquema `node:`
// para esse módulo ainda experimental.
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

/** Instância compartilhada pelo arquivo de teste (criada sob demanda). */
export function getTestDb() {
  if (!current) current = createTestDb()
  return current
}

/** Apaga todas as linhas (mantém o schema). Chamar no beforeEach. */
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

/** Substituto do módulo drizzle-client para vi.mock. */
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

/** Conta linhas de uma tabela (atalho para asserções). */
export function countRows(table: string): number {
  const { raw } = getTestDb()
  return Number(
    (raw.prepare(`SELECT count(*) AS n FROM "${table}"`).get() as any).n
  )
}
