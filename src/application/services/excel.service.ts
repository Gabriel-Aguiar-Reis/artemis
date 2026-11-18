import { Asset } from 'expo-asset'
import * as Sharing from 'expo-sharing'
import { Alert as RNAlert } from 'react-native'

export async function copyAssetToCacheAsync(
  assetModule: number
): Promise<string> {
  // Uses expo-asset's Asset to get the localUri
  const assetObj = Asset.fromModule(assetModule)
  await assetObj.downloadAsync() // Ensures the asset has a localUri on the device

  if (!assetObj.localUri) {
    throw new Error('Falha ao resolver localUri do asset.')
  }

  // Returns the localUri directly - Sharing can work with it
  return assetObj.localUri
}

export async function shareFileAsync(localPath: string) {
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    // Fallback: sharing not available
    RNAlert.alert(
      'Compartilhamento indisponível',
      'O compartilhamento não está disponível neste dispositivo. O arquivo foi copiado para o cache do app.'
    )
    return
  }
  await Sharing.shareAsync(localPath, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Salvar template Excel',
    UTI: 'com.microsoft.excel.xlsx',
  })
}
