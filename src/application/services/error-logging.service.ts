import { ErrorLogLevel } from '@/src/infra/db/drizzle/schema'
import DrizzleErrorLogRepository from '@/src/infra/repositories/drizzle/drizzle.error-log.repository'
import Constants from 'expo-constants'
import { File } from 'expo-file-system'
import * as FS from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import uuid from 'react-native-uuid'

const errorLogRepo = new DrizzleErrorLogRepository()

export type ErrorLogDump = {
  version: number
  createdAt: string
  appVersion: string
  deviceInfo: {
    platform: string
    osVersion: string | undefined
  }
  logs: Array<{
    id: string
    timestamp: number
    timestampISO: string
    level: ErrorLogLevel
    message: string
    stackTrace: string | null
    context: string | null
    metadata: any
  }>
}

/**
 * Logs an error message to the database
 */
export async function logError(
  message: string,
  error?: Error | unknown,
  context?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const stackTrace = error instanceof Error ? (error.stack ?? null) : null
    const errorMessage =
      error instanceof Error ? `${message}: ${error.message}` : message

    await errorLogRepo.addLog({
      id: uuid.v4() as string,
      timestamp: Date.now(),
      level: 'error',
      message: errorMessage,
      stackTrace,
      context: context ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (err) {
    // We cannot let a logging failure break the application
    console.error('Failed to save error log:', err)
  }
}

/**
 * Logs a warning message to the database
 */
export async function logWarning(
  message: string,
  context?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await errorLogRepo.addLog({
      id: uuid.v4() as string,
      timestamp: Date.now(),
      level: 'warning',
      message,
      stackTrace: null,
      context: context ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (err) {
    console.error('Failed to save warning log:', err)
  }
}

/**
 * Logs an info message to the database
 */
export async function logInfo(
  message: string,
  context?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await errorLogRepo.addLog({
      id: uuid.v4() as string,
      timestamp: Date.now(),
      level: 'info',
      message,
      stackTrace: null,
      context: context ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (err) {
    console.error('Failed to save info log:', err)
  }
}

/**
 * Builds the JSON string with all logs
 */
export async function buildLogDumpJsonString(): Promise<string> {
  const logs = await errorLogRepo.getAllLogs()

  const dump: ErrorLogDump = {
    version: 1,
    createdAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    deviceInfo: {
      platform: Constants.platform?.ios ? 'ios' : 'android',
      osVersion:
        Constants.platform?.ios?.buildNumber ??
        Constants.platform?.android?.versionCode?.toString(),
    },
    logs: logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      timestampISO: new Date(log.timestamp).toISOString(),
      level: log.level,
      message: log.message,
      stackTrace: log.stackTrace,
      context: log.context,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
  }

  return JSON.stringify(dump, null, 2)
}

/**
 * Saves the logs to a temporary file and shares it via the native system
 */
export async function saveLogDumpAndShare(): Promise<string> {
  const json = await buildLogDumpJsonString()

  const baseDir = FS.cacheDirectory ?? FS.documentDirectory
  if (!baseDir) {
    throw new Error('Nenhum diretório gravável disponível')
  }

  const targetPath = `${baseDir}artemis-logs.json`
  const file = new File(targetPath)
  if (file.exists) {
    file.delete()
  }
  file.create()
  file.write(json)

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(targetPath, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Exportar logs JSON',
    })
  }

  return targetPath
}

/**
 * Removes logs older than the specified timestamp
 */
export async function cleanupOldLogs(daysToKeep: number = 7): Promise<void> {
  try {
    const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    await errorLogRepo.deleteOldLogs(cutoffTimestamp)
  } catch (err) {
    console.error('Failed to clear old logs:', err)
  }
}

/**
 * Removes all logs from the database
 */
export async function clearAllLogs(): Promise<void> {
  await errorLogRepo.clearAllLogs()
}
