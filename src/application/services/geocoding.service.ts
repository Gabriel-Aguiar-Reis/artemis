import {
  Address,
  AddressSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/address.vo'

export class GeocodingService {
  static async getAddressByZipCode(
    zipCode: string
  ): Promise<AddressSerializableDTO> {
    const cleanedZip = zipCode.replace(/[-\s]/g, '')
    const formattedZip = encodeURIComponent(cleanedZip)
    const url = `https://brasilapi.com.br/api/cep/v2/${formattedZip}`

    let res: Response
    try {
      res = await fetch(url)
    } catch (err) {
      console.error('GeocodingService fetch error:', err)
      throw new Error('Falha na requisição de CEP. Verifique conexão ou CORS.')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('GeocodingService bad response:', res.status, text)
      throw new Error(`API de CEP retornou erro: ${res.status}`)
    }
    const data = await res.json()
    console.log('GeocodingService data:', data)

    if (!data || data.length === 0) {
      throw new Error('Endereço não encontrado na API de geocodificação.')
    }

    return Address.fromDTO({
      streetName: data.street,
      streetNumber: 0,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.cep,
    })
  }
}
