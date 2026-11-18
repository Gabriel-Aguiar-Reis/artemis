import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function getExpoDb() {
  if (!expoDb) {
    try {
      // enableChangeListener disabled: nobody uses useLiveQuery and the listener
      // costs a callback per changed row (heavy in batch imports).
      expoDb = openDatabaseSync('artemis.db')
      // WAL: reads do not block writes and each commit does fewer fsyncs.
      // synchronous=NORMAL is safe with WAL (it may lose only the last commit
      // on a power loss, never corrupts the database).
      expoDb.execSync('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;')
      if (__DEV__) console.log('Database opened successfully')
      // Do NOT enable foreign keys here - it is done AFTER migrations
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
  // Close the connection if it exists
  if (expoDb) {
    try {
      expoDb.closeSync()
      console.log('Database connection closed')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }

  drizzleInstance = null
  expoDb = null
  console.log('Drizzle client reset')
}

/**
 * With WAL, SQLite keeps `artemis.db-wal` and `artemis.db-shm` next to the
 * database. expo-sqlite's deleteDatabaseSync only deletes the main file; a
 * leftover -wal (e.g. reset after a crash) could be replayed onto the new
 * database. Removes both, ignoring if they do not exist.
 */
export async function removeWalFiles(name = 'artemis.db') {
  try {
    const { defaultDatabaseDirectory } = require('expo-sqlite')
    const FS = require('expo-file-system/legacy')
    if (!defaultDatabaseDirectory) return
    const dir = String(defaultDatabaseDirectory).startsWith('file://')
      ? String(defaultDatabaseDirectory)
      : `file://${defaultDatabaseDirectory}`
    for (const suffix of ['-wal', '-shm']) {
      await FS.deleteAsync(`${dir}/${name}${suffix}`, { idempotent: true })
    }
  } catch (error) {
    if (__DEV__) console.warn('Could not remove WAL files:', error)
  }
}

export function deleteDatabaseAndReset() {
  try {
    // Reset and close connections
    resetDrizzleClient()

    // Small delay to make sure the connection was closed
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        try {
          // Delete the database file
          const { deleteDatabaseSync } = require('expo-sqlite')
          deleteDatabaseSync('artemis.db')
          if (__DEV__) console.log('Database deleted successfully')
          removeWalFiles().finally(() => resolve(true))
        } catch (error) {
          console.error('Error deleting database:', error)
          resolve(false)
        }
      }, 100)
    })
  } catch (error) {
    console.error('Error in deleteDatabaseAndReset:', error)
    return Promise.resolve(false)
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!drizzleInstance) {
      initDrizzleClient()
    }
    return drizzleInstance![prop as keyof typeof drizzleInstance]
  },
})
