import { Asset } from 'expo-asset'
import * as Sharing from 'expo-sharing'
import { Alert as RNAlert } from 'react-native'

export async function copyAssetToCacheAsync(
  assetModule: number
): Promise<string> {
  // Usa Asset do expo-asset para obter o localUri
  const assetObj = Asset.fromModule(assetModule)
  await assetObj.downloadAsync() // Garante que o asset tem localUri no device

  if (!assetObj.localUri) {
    throw new Error('Falha ao resolver localUri do asset.')
  }

  // Retorna o localUri diretamente - o Sharing pode trabalhar com ele
  return assetObj.localUri
}

export async function shareFileAsync(localPath: string) {
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    // Fallback: compartilhamento não disponível
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
