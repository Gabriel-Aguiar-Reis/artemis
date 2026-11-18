import {
  logError,
  logInfo,
  logWarning,
} from '@/src/application/services/error-logging.service'

/**
 * Wrapper around console.log that also persists logs to the database.
 *
 * Usage:
 * ```ts
 * import logger from '@/src/lib/logger'
 *
 * logger.log('Informational message', 'Context')
 * logger.warn('Important warning', 'Context')
 * logger.error('Critical error', error, 'Context')
 * ```
 */
const logger = {
  /**
   * Logs an info message
   */
  log: (message: string, context?: string, metadata?: Record<string, any>) => {
    console.log(message)
    logInfo(message, context, metadata).catch((err) => {
      console.error('Failed to persist info log:', err)
    })
  },

  /**
   * Logs a warning message
   */
  warn: (message: string, context?: string, metadata?: Record<string, any>) => {
    console.warn(message)
    logWarning(message, context, metadata).catch((err) => {
      console.error('Failed to persist warning log:', err)
    })
  },

  /**
   * Logs an error message
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
