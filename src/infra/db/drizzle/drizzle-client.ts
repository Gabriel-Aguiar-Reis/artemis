import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function getExpoDb() {
  if (!expoDb) {
    try {
      expoDb = openDatabaseSync('artemis.db', { enableChangeListener: true })
      console.log('Database opened successfully')
    } catch (error) {
      console.error('Error opening database:', error)
      throw error
    }
  }
  return expoDb
}

export function enableForeignKeys() {
  const db = getExpoDb()
  try {
    db.execSync('PRAGMA foreign_keys = ON;')
    console.log('Foreign keys enabled')
  } catch (error) {
    console.error('Error enabling foreign keys:', error)
  }
}

export function initDrizzleClient() {
  if (!drizzleInstance) {
    const database = getExpoDb()
    drizzleInstance = drizzle(database, { schema })
    console.log('Drizzle client initialized')
  }
  return drizzleInstance
}

export function resetDrizzleClient() {
  drizzleInstance = null
  expoDb = null
  console.log('Drizzle client reset')
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!drizzleInstance) {
      initDrizzleClient()
    }
    return drizzleInstance![prop as keyof typeof drizzleInstance]
  },
})
