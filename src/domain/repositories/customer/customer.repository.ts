import { Customer } from '@/src/domain/entities/customer/customer.entity'
import {
  CustomerInsertDTO,
  CustomerUpdateDTO,
} from '@/src/domain/validations/customer.schema'
import { UUID } from 'crypto'

export abstract class CustomerRepository {
  abstract getCustomers: () => Promise<Customer[]>
  abstract addCustomer: (dto: CustomerInsertDTO) => Promise<void>
  abstract updateCustomer: (dto: CustomerUpdateDTO) => Promise<void>
  abstract deleteCustomer: (id: UUID) => Promise<void>
  abstract getCustomer: (id: UUID) => Promise<Customer | null>
}
