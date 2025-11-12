import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

export const db = drizzle(openDatabaseSync('artemis.db'))
