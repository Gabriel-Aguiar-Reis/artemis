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
          console.log('Database deleted successfully')
          resolve(true)
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
