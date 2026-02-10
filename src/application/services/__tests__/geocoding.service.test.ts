import { GeocodingService } from '@/src/application/services/geocoding.service'
import { beforeEach, describe, expect, it, Mock, vitest } from 'vitest'

global.fetch = vitest.fn()

describe('GeocodingService', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  describe('getAddressByZipCode', () => {
    it('should return a valid address from a ZIP code', async () => {
      const mockData = {
        cep: '01310-100',
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      }

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await GeocodingService.getAddressByZipCode('01310-100')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://brasilapi.com.br/api/cep/v2/01310100'
      )
      expect(result.streetName).toBe('Avenida Paulista')
      expect(result.neighborhood).toBe('Bela Vista')
      expect(result.city).toBe('São Paulo')
      expect(result.state).toBe('SP')
      expect(result.zipCode).toBe('01310-100')
    })

    it('should remove hyphens and spaces from the ZIP code before the request', async () => {
      const mockData = {
        cep: '12345-678',
        street: 'Rua Teste',
        neighborhood: 'Centro',
        city: 'Test City',
        state: 'TS',
      }

      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await GeocodingService.getAddressByZipCode('12345 - 678')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://brasilapi.com.br/api/cep/v2/12345678'
      )
    })

    it('should throw an error when the request fails', async () => {
      ;(global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        GeocodingService.getAddressByZipCode('12345-678')
      ).rejects.toThrow(
        'Falha na requisição de CEP. Verifique conexão ou CORS.'
      )
    })

    it('should throw an error when the API returns an invalid response', async () => {
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      })

      await expect(
        GeocodingService.getAddressByZipCode('00000-000')
      ).rejects.toThrow('API de CEP retornou erro: 404')
    })

    it('should handle an invalid response without body text', async () => {
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('boom')
        },
      })

      await expect(
        GeocodingService.getAddressByZipCode('99999-999')
      ).rejects.toThrow('API de CEP retornou erro: 500')
    })

    it('should throw an error when data is empty', async () => {
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await expect(
        GeocodingService.getAddressByZipCode('12345-678')
      ).rejects.toThrow('Endereço não encontrado na API de geocodificação.')
    })

    it('should throw an error when data is null', async () => {
      ;(global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      })

      await expect(
        GeocodingService.getAddressByZipCode('12345-678')
      ).rejects.toThrow('Endereço não encontrado na API de geocodificação.')
    })
  })
})
