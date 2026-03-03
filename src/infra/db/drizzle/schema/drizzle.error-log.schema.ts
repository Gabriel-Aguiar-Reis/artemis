import { InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import uuid from 'react-native-uuid'

export type ErrorLogLevel = 'error' | 'warning' | 'info'

type ErrorLogModelShape = {
  id: string
  timestamp: number
  level: ErrorLogLevel
  message: string
  stackTrace: string | null
  context: string | null
  metadata: string | null
}

export const errorLog = sqliteTable('error_log', {
  id: text('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => String(uuid.v4())),
  timestamp: integer('timestamp', { mode: 'number' }).notNull(),
  level: text('level', { enum: ['error', 'warning', 'info'] }).notNull(),
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),
  context: text('context'),
  metadata: text('metadata'),
}) satisfies Record<keyof ErrorLogModelShape, any>

export type ErrorLogTable = InferSelectModel<typeof errorLog>
