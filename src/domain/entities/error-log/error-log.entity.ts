import { ErrorLogLevel } from '@/src/infra/db/drizzle/schema'
import { UUID } from '@/src/lib/utils'

export type ErrorLogSerializableDTO = {
  id: UUID
  timestamp: number
  level: ErrorLogLevel
  message: string
  stackTrace: string | null
  context: string | null
  metadata: string | null
}

export class ErrorLog {
  constructor(
    public id: UUID,
    public timestamp: number,
    public level: ErrorLogLevel,
    public message: string,
    public stackTrace: string | null = null,
    public context: string | null = null,
    public metadata: string | null = null
  ) {
    if (!message || message.trim().length === 0) {
      throw new Error('A mensagem do log é obrigatória.')
    }

    if (!['error', 'warning', 'info'].includes(level)) {
      throw new Error('Nível de log inválido. Use: error, warning ou info.')
    }

    if (timestamp <= 0) {
      throw new Error('Timestamp inválido.')
    }
  }

  toDTO(): ErrorLogSerializableDTO {
    return {
      id: this.id,
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      stackTrace: this.stackTrace,
      context: this.context,
      metadata: this.metadata,
    }
  }

  static fromDTO(dto: ErrorLogSerializableDTO): ErrorLog {
    return new ErrorLog(
      dto.id,
      dto.timestamp,
      dto.level,
      dto.message,
      dto.stackTrace,
      dto.context,
      dto.metadata
    )
  }
}
