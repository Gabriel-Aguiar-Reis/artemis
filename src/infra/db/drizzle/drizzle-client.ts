import * as schema from '@/src/infra/db/drizzle/schema'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'

let expoDb: SQLiteDatabase | null = null
let drizzleInstance: ReturnType<typeof drizzle> | null = null

export function getExpoDb() {
  if (!expoDb) {
    try {
      // enableChangeListener desligado: ninguém usa useLiveQuery e o listener
      // custa um callback por linha alterada (pesado em importações em lote).
      expoDb = openDatabaseSync('artemis.db')
      // WAL: leituras não bloqueiam escritas e cada commit faz menos fsync.
      // synchronous=NORMAL é seguro com WAL (pode perder só o último commit
      // numa queda de energia, nunca corrompe o banco).
      expoDb.execSync('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;')
      if (__DEV__) console.log('Database opened successfully')
      // NÃO habilitar foreign keys aqui - será feito APÓS migrations
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
  // Fechar conexão se existir
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
 * Com WAL, o SQLite mantém `artemis.db-wal` e `artemis.db-shm` ao lado do
 * banco. O deleteDatabaseSync do expo-sqlite apaga só o arquivo principal; um
 * -wal que sobrar (ex.: reset após crash) poderia ser reaplicado no banco
 * novo. Remove os dois, ignorando se não existirem.
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
    if (__DEV__) console.warn('Não foi possível remover arquivos WAL:', error)
  }
}

export function deleteDatabaseAndReset() {
  try {
    // Resetar e fechar conexões
    resetDrizzleClient()

    // Pequeno delay para garantir que a conexão foi fechada
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        try {
          // Deletar o arquivo do banco
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
