import { Linking } from 'react-native'
import { WorkOrderMapItem } from '../models'

export class MapsService {
  /**
   * Gera um link do Google Maps com múltiplos waypoints
   * @param items - Array de WorkOrderMapItem para incluir na rota
   * @returns URL do Google Maps
   */
  static generateGoogleMapsLink(items: WorkOrderMapItem[]): string {
    if (items.length === 0) {
      throw new Error('At least one item is required to generate a route')
    }

    if (items.length === 1) {
      const coord = items[0].workOrder.customer.storeAddress.coordinates
      return `https://www.google.com/maps/search/?api=1&query=${coord.latitude},${coord.longitude}`
    }

    // Primeiro ponto (origem)
    const origin = items[0].workOrder.customer.storeAddress.coordinates

    // Último ponto (destino)
    const destination =
      items[items.length - 1].workOrder.customer.storeAddress.coordinates

    // Pontos intermediários (waypoints)
    const waypoints = items
      .slice(1, -1)
      .map((item) => {
        const coord = item.workOrder.customer.storeAddress.coordinates
        return `${coord.latitude},${coord.longitude}`
      })
      .join('|')

    let url = `https://www.google.com/maps/dir/?api=1`
    url += `&origin=${origin.latitude},${origin.longitude}`
    url += `&destination=${destination.latitude},${destination.longitude}`

    if (waypoints) {
      url += `&waypoints=${waypoints}`
    }

    url += `&travelmode=driving`

    return url
  }

  /**
   * Abre o Google Maps com a rota especificada
   * @param items - Array de WorkOrderMapItem para incluir na rota
   */
  static openGoogleMapsRoute(items: WorkOrderMapItem[]): void {
    const url = this.generateGoogleMapsLink(items)

    Linking.openURL(url).catch((err) => {
      console.error('Failed to open Google Maps', err)
      throw new Error('Failed to open Google Maps')
    })
  }

  /**
   * Gera um link do Google Maps para um trecho específico do itinerário
   * @param items - Array completo de WorkOrderMapItem
   * @param startIndex - Índice inicial (inclusivo)
   * @param endIndex - Índice final (inclusivo)
   */
  static generatePartialRouteLink(
    items: WorkOrderMapItem[],
    startIndex: number,
    endIndex: number
  ): string {
    if (startIndex < 0 || endIndex >= items.length || startIndex > endIndex) {
      throw new Error('Invalid range for partial route')
    }

    const partialItems = items.slice(startIndex, endIndex + 1)
    return this.generateGoogleMapsLink(partialItems)
  }
}
