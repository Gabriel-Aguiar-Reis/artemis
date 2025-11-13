export interface AddProductDto {
  name: string
  categoryId: string
  salePrice: number
  expiration: string
  isActive?: boolean
}
