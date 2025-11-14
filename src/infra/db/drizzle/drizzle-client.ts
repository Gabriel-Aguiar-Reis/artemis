import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function getExpoDb() {
  if (!expoDb) {
    expoDb = openDatabaseSync('artemis.db')
  }
  return expoDb
}

export function initDrizzleClient() {
  const database = getExpoDb()
  if (!drizzleInstance) {
    drizzleInstance = drizzle(database, { schema })
  }
  useDrizzleStudio(database)
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
