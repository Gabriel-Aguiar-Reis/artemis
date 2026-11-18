import { Customer } from '@/src/domain/entities/customer/customer.entity'
import {
  CustomerInsertDTO,
  CustomerUpdateDTO,
} from '@/src/domain/validations/customer.schema'
import { UUID } from '@/src/lib/utils'

export type PaginatedCustomers = {
  data: Customer[]
  hasMore: boolean
  totalCount: number
}

export type CustomerLight = {
  id: UUID
  storeName: string
  contactName: string
  city: string
  phone: string | null
}

export abstract class CustomerRepository {
  abstract getCustomers: () => Promise<Customer[]>
  abstract getCustomersPaginated: (
    page: number,
    pageSize: number
  ) => Promise<PaginatedCustomers>
  abstract searchCustomersLight: (
    term: string,
    limit?: number
  ) => Promise<CustomerLight[]>
  abstract addCustomer: (dto: CustomerInsertDTO) => Promise<void>
  abstract updateCustomer: (dto: CustomerUpdateDTO) => Promise<void>
  abstract deleteCustomer: (id: UUID) => Promise<void>
  abstract getCustomer: (id: UUID) => Promise<Customer | null>
}
