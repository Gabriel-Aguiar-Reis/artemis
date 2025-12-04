import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function getExpoDb() {
  if (!expoDb) {
    expoDb = openDatabaseSync('artemis.db')
    // Habilitar foreign keys para suportar cascade delete
    expoDb.execSync('PRAGMA foreign_keys = ON;')
  }
  return expoDb
}

export function initDrizzleClient() {
  const database = getExpoDb()
  if (!drizzleInstance) {
    drizzleInstance = drizzle(database, { schema })
  }
  return drizzleInstance
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!drizzleInstance) {
      initDrizzleClient()
    }
    return drizzleInstance![prop as keyof typeof drizzleInstance]
  },
})
