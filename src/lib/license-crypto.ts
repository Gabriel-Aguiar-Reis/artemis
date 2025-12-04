import * as Crypto from 'expo-crypto'
import uuid from 'react-native-uuid'

const SECRET_KEY = '73616E746F73657874696E746F726573'
const ADMIN_PASSWORD = 'sK9!vQ3#nT7@xL2%'

/**
 * Gera um código único de 6 caracteres
 */
export function generateUniqueCode(): string {
  return String(uuid.v4()).replace(/-/g, '').slice(0, 6).toUpperCase()
}

/**
 * Formata a data atual no formato DDMMYY
 */
export function formatDateForLicense(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}${month}${year}`
}

/**
 * Combina código único e data no formato: CODIGO-DDMMYY
 */
export function generateUserActivationCode(uniqueCode: string): string {
  const dateStr = formatDateForLicense()
  return `${uniqueCode}-${dateStr}`
}

/**
 * Gera o hash de licença baseado no código único e data de bloqueio
 * @param uniqueCode Código único do dispositivo
 * @param blockDate Data de bloqueio no formato YYYY-MM-DD
 */
export async function generateLicenseHash(
  uniqueCode: string,
  blockDate: string
): Promise<string> {
  const data = `${uniqueCode}-${blockDate}-${SECRET_KEY}`
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  )
  return hash.slice(0, 16).toUpperCase()
}

/**
 * Valida se um código de licença é válido
 * @param inputCode Código inserido pelo usuário
 * @param uniqueCode Código único do dispositivo
 * @param currentExpirationDate Data de expiração atual
 * @returns { valid: boolean, isAdmin: boolean, newExpirationDate: Date | null }
 */
export async function validateLicenseCode(
  inputCode: string,
  uniqueCode: string,
  currentExpirationDate: Date
): Promise<{
  valid: boolean
  isAdmin: boolean
  newExpirationDate: Date | null
}> {
  // Verificar se é senha de admin
  if (inputCode === ADMIN_PASSWORD) {
    // Admin: licença vitalícia (até 2150)
    const adminExpiration = new Date('2150-01-01')
    return {
      valid: true,
      isAdmin: true,
      newExpirationDate: adminExpiration,
    }
  }

  // Calcular a data de bloqueio esperada (90 dias a partir da data atual de expiração)
  const newExpiration = new Date(currentExpirationDate)
  newExpiration.setDate(newExpiration.getDate() + 90)
  const blockDate = newExpiration.toISOString().split('T')[0]

  // Gerar hash esperado
  const expectedHash = await generateLicenseHash(uniqueCode, blockDate)

  if (inputCode === expectedHash) {
    return {
      valid: true,
      isAdmin: false,
      newExpirationDate: newExpiration,
    }
  }

  return {
    valid: false,
    isAdmin: false,
    newExpirationDate: null,
  }
}

/**
 * Gera um código de licença para um usuário (usado pelo admin)
 * @param userUniqueCode Código único fornecido pelo usuário
 * @param userBlockDateStr Data de bloqueio do usuário no formato DDMMYY
 * @returns Código de licença para enviar ao usuário
 */
export async function generateLicenseCodeForUser(
  userUniqueCode: string,
  userBlockDateStr: string
): Promise<string> {
  // Converter DDMMYY para YYYY-MM-DD
  const day = userBlockDateStr.slice(0, 2)
  const month = userBlockDateStr.slice(2, 4)
  const year = '20' + userBlockDateStr.slice(4, 6)

  // Data atual do usuário
  const userCurrentDate = new Date(`${year}-${month}-${day}`)

  // Adicionar 90 dias
  const newExpiration = new Date(userCurrentDate)
  newExpiration.setDate(newExpiration.getDate() + 90)
  const blockDate = newExpiration.toISOString().split('T')[0]

  return await generateLicenseHash(userUniqueCode, blockDate)
}
