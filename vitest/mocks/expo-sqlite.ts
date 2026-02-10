export class SQLiteDatabase {}

export function openDatabaseSync() {
  return {
    execAsync: async () => undefined,
    getFirstAsync: async () => undefined,
  }
}

export default {
  SQLiteDatabase,
  openDatabaseSync,
}
