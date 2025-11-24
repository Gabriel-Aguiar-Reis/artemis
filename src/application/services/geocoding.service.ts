import { Address } from '@/src/domain/entities/customer/value-objects/address.vo'

export class GeocodingService {
  static async getCoordinatesFromAddress(
    address: Address
  ): Promise<{ lat: number; lng: number }> {
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

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
}
