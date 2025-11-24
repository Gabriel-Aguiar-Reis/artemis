import {
  Address,
  AddressSerializableDTO,
} from '@/src/domain/entities/customer/value-objects/address.vo'
import { Coordinates } from '@/src/domain/entities/customer/value-objects/coordinates.vo'

export class GeocodingService {
  static async getCoordinatesFromAddress(
    address: Omit<AddressSerializableDTO, 'coordinates'>
  ): Promise<Coordinates> {
    const formattedAddress = encodeURIComponent(
      `${address.streetName}, ${address.streetNumber}, ${address.city}, ${address.state}, ${address.zipCode}`
    )

    const url = `https://nominatim.openstreetmap.org/search?q=${formattedAddress}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'artemis/1.0' } })
    const data = await res.json()
    console.log('GeocodingService data:', data)

    if (!data || data.length === 0) {
      throw new Error('Endereço não encontrado na API de geocodificação.')
    }

    return Coordinates.fromDTO({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    })
  }

  static async getAddressByZipCode(
    zipCode: string
  ): Promise<AddressSerializableDTO> {
    const formattedZip = encodeURIComponent(zipCode)
    const url = `https://brasilapi.com.br/api/cep/v2/${formattedZip}`
    const res = await fetch(url, { headers: { 'User-Agent': 'artemis/1.0' } })
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
      coordinates: { latitude: 0, longitude: 0 },
    })
  }
}
