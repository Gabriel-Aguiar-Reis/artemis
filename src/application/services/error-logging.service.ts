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
 * Registra uma mensagem de erro no banco de dados
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
    // Não podemos permitir que falha no log quebre a aplicação
    console.error('Falha ao salvar log de erro:', err)
  }
}

/**
 * Registra uma mensagem de warning no banco de dados
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
    console.error('Falha ao salvar log de warning:', err)
  }
}

/**
 * Registra uma mensagem de info no banco de dados
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
    console.error('Falha ao salvar log de info:', err)
  }
}

/**
 * Constrói a string JSON com todos os logs
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
 * Salva os logs em arquivo temporário e compartilha via sistema nativo
 */
export async function saveLogDumpAndShare(): Promise<string> {
  const json = await buildLogDumpJsonString()

  const baseDir = FS.cacheDirectory ?? FS.documentDirectory
  if (!baseDir) {
    throw new Error('Nenhum diretório gravável disponível')
  }

  const targetPath = `${baseDir}artemis-logs.json`
  const file = new File(targetPath)
  await file.create()
  await file.write(json)

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
 * Remove logs mais antigos que o timestamp especificado
 */
export async function cleanupOldLogs(daysToKeep: number = 7): Promise<void> {
  try {
    const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    await errorLogRepo.deleteOldLogs(cutoffTimestamp)
  } catch (err) {
    console.error('Falha ao limpar logs antigos:', err)
  }
}

/**
 * Remove todos os logs do banco
 */
export async function clearAllLogs(): Promise<void> {
  await errorLogRepo.clearAllLogs()
}
