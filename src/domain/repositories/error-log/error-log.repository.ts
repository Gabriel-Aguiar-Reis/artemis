import { ErrorLog } from '@/src/domain/entities/error-log/error-log.entity'
import { ErrorLogInsertDTO } from '@/src/domain/validations/error-log.schema'
import { ErrorLogLevel } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'

export abstract class ErrorLogRepository {
  abstract addLog: (dto: ErrorLogInsertDTO) => Promise<void>
  abstract getAllLogs: () => Promise<ErrorLog[]>
  abstract getLogsByLevel: (level: ErrorLogLevel) => Promise<ErrorLog[]>
  abstract getLogsByDateRange: (
    startTimestamp: number,
    endTimestamp: number
  ) => Promise<ErrorLog[]>
  abstract deleteOldLogs: (beforeTimestamp: number) => Promise<void>
  abstract clearAllLogs: () => Promise<void>
  abstract getLog: (id: UUID) => Promise<ErrorLog | null>
}
