import { ErrorLog } from '@/src/domain/entities/error-log/error-log.entity'
import { ErrorLogLevel } from '@/src/infra/db/drizzle/schema'
import { ErrorLogTable } from '@/src/infra/db/drizzle/schema/drizzle.error-log.schema'
import { UUID } from '@/src/lib/utils'

export class ErrorLogMapper {
  static toDomain(table: ErrorLogTable): ErrorLog {
    return ErrorLog.fromDTO({
      id: table.id as UUID,
      timestamp: table.timestamp,
      level: table.level as ErrorLogLevel,
      message: table.message,
      stackTrace: table.stackTrace,
      context: table.context,
      metadata: table.metadata,
    })
  }

  static toPersistence(entity: ErrorLog): ErrorLogTable {
    return {
      id: entity.id,
      timestamp: entity.timestamp,
      level: entity.level,
      message: entity.message,
      stackTrace: entity.stackTrace,
      context: entity.context,
      metadata: entity.metadata,
    }
  }
}
