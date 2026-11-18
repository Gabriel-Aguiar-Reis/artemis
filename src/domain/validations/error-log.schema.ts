import { errorLog } from '@/src/infra/db/drizzle/schema'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import z from 'zod'

const errorLogSchemaWithoutId = {
  timestamp: () => z.number().positive('Timestamp deve ser positivo.'),
  level: () =>
    z.enum(['error', 'warning', 'info'], {
      message: 'Nível inválido. Use: error, warning ou info.',
    }),
  message: () => z.string().min(1, 'A mensagem do log é obrigatória.'),
  stackTrace: () => z.string().nullable().optional(),
  context: () => z.string().nullable().optional(),
  metadata: () => z.string().nullable().optional(),
}

const errorLogSchema = {
  id: () => z.uuid('UUID inválido.'),
  ...errorLogSchemaWithoutId,
}

export const errorLogSelectSchema = createSelectSchema(errorLog, errorLogSchema)

export type ErrorLogSelectDTO = z.infer<typeof errorLogSelectSchema>

export const errorLogInsertSchema = createInsertSchema(errorLog, errorLogSchema)

export type ErrorLogInsertDTO = z.infer<typeof errorLogInsertSchema>

export const errorLogUpdateSchema = createUpdateSchema(
  errorLog,
  errorLogSchemaWithoutId
)

export type ErrorLogUpdateDTO = z.infer<typeof errorLogUpdateSchema>
