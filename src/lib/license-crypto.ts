import * as Crypto from 'expo-crypto'
import uuid from 'react-native-uuid'

const SECRET_KEY = '73616E746F73657874696E746F726573'
const ADMIN_PASSWORD = 'sK9!vQ3#nT7@xL2%'

/**
 * Generates a unique 6-character code
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
 * Combines unique code and date in the format: CODE-DDMMYY
 */
export function generateUserActivationCode(uniqueCode: string): string {
  const dateStr = formatDateForLicense()
  return `${uniqueCode}-${dateStr}`
}

/**
 * Generates the license hash based on the unique code and block date
 * @param uniqueCode Device's unique code
 * @param blockDate Block date in YYYY-MM-DD format
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
 * Checks whether a license code is valid
 * @param inputCode Code entered by the user
 * @param uniqueCode Device's unique code
 * @param currentExpirationDate Current expiration date
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
  // Check whether it is the admin password
  if (inputCode === ADMIN_PASSWORD) {
    // Admin: lifetime license (until 2150)
    const adminExpiration = new Date('2150-01-01')
    return {
      valid: true,
      isAdmin: true,
      newExpirationDate: adminExpiration,
    }
  }

  // Compute the expected block date (90 days after the current expiration date)
  const newExpiration = new Date(currentExpirationDate)
  newExpiration.setDate(newExpiration.getDate() + 90)
  const blockDate = newExpiration.toISOString().split('T')[0]

  // Generate the expected hash
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
 * Generates a license code for a user (used by the admin)
 * @param userUniqueCode Unique code provided by the user
 * @param userBlockDateStr User's block date in DDMMYY format
 * @returns License code to send to the user
 */
export async function generateLicenseCodeForUser(
  userUniqueCode: string,
  userBlockDateStr: string
): Promise<string> {
  // Convert DDMMYY to YYYY-MM-DD
  const day = userBlockDateStr.slice(0, 2)
  const month = userBlockDateStr.slice(2, 4)
  const year = '20' + userBlockDateStr.slice(4, 6)

  // User's current date
  const userCurrentDate = new Date(`${year}-${month}-${day}`)

  // Add 90 days
  const newExpiration = new Date(userCurrentDate)
  newExpiration.setDate(newExpiration.getDate() + 90)
  const blockDate = newExpiration.toISOString().split('T')[0]

  return await generateLicenseHash(userUniqueCode, blockDate)
}
