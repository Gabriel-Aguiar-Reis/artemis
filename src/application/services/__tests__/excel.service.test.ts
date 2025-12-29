import {
  copyAssetToCacheAsync,
  shareFileAsync,
} from '@/src/application/services/excel.service'
import { Asset } from 'expo-asset'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import { beforeEach, describe, expect, it, Mock, vitest } from 'vitest'

vitest.mock('expo-sharing')
vitest.mock('expo-asset')
vitest.mock('react-native', () => ({
  Alert: {
    alert: vitest.fn(),
  },
}))

describe('ExcelService', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  describe('copyAssetToCacheAsync', () => {
    it('should copy asset and return localUri', async () => {
      const mockAsset = {
        localUri: 'file:///path/to/asset.xlsx',
        downloadAsync: vitest.fn().mockResolvedValue(undefined),
      }

      ;(Asset.fromModule as Mock).mockReturnValue(mockAsset)

      const result = await copyAssetToCacheAsync(12345)

      expect(Asset.fromModule).toHaveBeenCalledWith(12345)
      expect(mockAsset.downloadAsync).toHaveBeenCalled()
      expect(result).toBe('file:///path/to/asset.xlsx')
    })

    it('should throw an error if localUri is not available', async () => {
      const mockAsset = {
        localUri: null,
        downloadAsync: vitest.fn().mockResolvedValue(undefined),
      }

      ;(Asset.fromModule as Mock).mockReturnValue(mockAsset)

      await expect(copyAssetToCacheAsync(12345)).rejects.toThrow(
        'Falha ao resolver localUri do asset.'
      )
    })

    it('should download the asset before returning', async () => {
      const mockAsset = {
        localUri: 'file:///asset.xlsx',
        downloadAsync: vitest.fn().mockResolvedValue(undefined),
      }

      ;(Asset.fromModule as Mock).mockReturnValue(mockAsset)

      await copyAssetToCacheAsync(99999)

      expect(mockAsset.downloadAsync).toHaveBeenCalledTimes(1)
    })
  })

  describe('shareFileAsync', () => {
    it('should share file when available', async () => {
      ;(Sharing.isAvailableAsync as Mock).mockResolvedValue(true)
      ;(Sharing.shareAsync as Mock).mockResolvedValue(undefined)

      await shareFileAsync('file:///path/to/file.xlsx')

      expect(Sharing.isAvailableAsync).toHaveBeenCalled()
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///path/to/file.xlsx',
        {
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Salvar template Excel',
          UTI: 'com.microsoft.excel.xlsx',
        }
      )
    })

    it('should show alert when sharing is not available', async () => {
      ;(Sharing.isAvailableAsync as Mock).mockResolvedValue(false)

      await shareFileAsync('file:///path/to/file.xlsx')

      expect(Sharing.isAvailableAsync).toHaveBeenCalled()
      expect(Sharing.shareAsync).not.toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledWith(
        'Compartilhamento indisponível',
        'O compartilhamento não está disponível neste dispositivo. O arquivo foi copiado para o cache do app.'
      )
    })

    it('should use correct mimeType for Excel', async () => {
      ;(Sharing.isAvailableAsync as Mock).mockResolvedValue(true)
      ;(Sharing.shareAsync as Mock).mockResolvedValue(undefined)

      await shareFileAsync('test.xlsx')

      const callArgs = (Sharing.shareAsync as Mock).mock.calls[0][1]
      expect(callArgs.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(callArgs.UTI).toBe('com.microsoft.excel.xlsx')
    })
  })
})
