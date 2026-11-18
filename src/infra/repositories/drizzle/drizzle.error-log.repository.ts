import { ErrorLog } from '@/src/domain/entities/error-log/error-log.entity'
import { ErrorLogMapper } from '@/src/domain/entities/error-log/mapper/error-log.mapper'
import { ErrorLogRepository } from '@/src/domain/repositories/error-log/error-log.repository'
import { ErrorLogInsertDTO } from '@/src/domain/validations/error-log.schema'
import { db } from '@/src/infra/db/drizzle/drizzle-client'
import { errorLog, ErrorLogLevel } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'
import { and, eq, gte, lt, lte } from 'drizzle-orm'
import uuid from 'react-native-uuid'

export default class DrizzleErrorLogRepository implements ErrorLogRepository {
  async addLog(dto: ErrorLogInsertDTO): Promise<void> {
    const id = dto.id ? (dto.id as UUID) : (uuid.v4() as UUID)
    const log = new ErrorLog(
      id,
      dto.timestamp,
      dto.level,
      dto.message,
      dto.stackTrace ?? null,
      dto.context ?? null,
      dto.metadata ?? null
    )
    const data = ErrorLogMapper.toPersistence(log)
    await db.insert(errorLog).values(data).onConflictDoNothing()
  }

  async getAllLogs(): Promise<ErrorLog[]> {
    const rows = await db.select().from(errorLog)
    if (rows.length === 0) {
      return []
    }
    return rows.map(ErrorLogMapper.toDomain)
  }

  async getLogsByLevel(level: ErrorLogLevel): Promise<ErrorLog[]> {
    const rows = await db
      .select()
      .from(errorLog)
      .where(eq(errorLog.level, level))
    return rows.map(ErrorLogMapper.toDomain)
  }

  async getLogsByDateRange(
    startTimestamp: number,
    endTimestamp: number
  ): Promise<ErrorLog[]> {
    const rows = await db
      .select()
      .from(errorLog)
      .where(
        and(
          gte(errorLog.timestamp, startTimestamp),
          lte(errorLog.timestamp, endTimestamp)
        )
      )
    return rows.map(ErrorLogMapper.toDomain)
  }

  async deleteOldLogs(beforeTimestamp: number): Promise<void> {
    await db.delete(errorLog).where(lt(errorLog.timestamp, beforeTimestamp))
  }

  async clearAllLogs(): Promise<void> {
    await db.delete(errorLog)
  }

  async getLog(id: UUID): Promise<ErrorLog | null> {
    const row = db
      .select()
      .from(errorLog)
      .where(eq(errorLog.id, id))
      .limit(1)
      .get()

    if (!row) return null
    return ErrorLogMapper.toDomain(row)
  }
}
