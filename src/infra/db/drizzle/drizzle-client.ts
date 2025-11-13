import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function initDrizzleClient() {
  if (!expoDb) {
    expoDb = openDatabaseSync('artemis.db')
  }
  if (!drizzleInstance) {
    drizzleInstance = drizzle(expoDb, { schema })
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
