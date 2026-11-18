import {
  logError,
  logInfo,
  logWarning,
} from '@/src/application/services/error-logging.service'

/**
 * Wrapper para console.log que também persiste logs no banco de dados.
 *
 * Uso:
 * ```ts
 * import logger from '@/src/lib/logger'
 *
 * logger.log('Mensagem informativa', 'Contexto')
 * logger.warn('Aviso importante', 'Contexto')
 * logger.error('Erro crítico', error, 'Contexto')
 * ```
 */
const logger = {
  /**
   * Registra mensagem de informação
   */
  log: (message: string, context?: string, metadata?: Record<string, any>) => {
    console.log(message)
    logInfo(message, context, metadata).catch((err) => {
      console.error('Failed to persist info log:', err)
    })
  },

  /**
   * Registra mensagem de aviso
   */
  warn: (message: string, context?: string, metadata?: Record<string, any>) => {
    console.warn(message)
    logWarning(message, context, metadata).catch((err) => {
      console.error('Failed to persist warning log:', err)
    })
  },

  /**
   * Registra mensagem de erro
   */
  error: (
    message: string,
    error?: Error | unknown,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    console.error(message, error)
    logError(message, error, context, metadata).catch((err) => {
      console.error('Failed to persist error log:', err)
    })
  },
}

export default logger
