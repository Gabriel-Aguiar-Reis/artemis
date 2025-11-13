import { Customer } from '@/src/domain/entities/customer/customer.entity'
import { AddCustomerDto } from '@/src/domain/repositories/customer/dtos/add-customer.dto'
import { UpdateCustomerDto } from '@/src/domain/repositories/customer/dtos/update-customer.dto'
import { UUID } from 'crypto'

export abstract class CustomerRepository {
  abstract getCustomers: () => Promise<Customer[]>
  abstract addCustomer: (dto: AddCustomerDto) => Promise<void>
  abstract updateCustomer: (dto: UpdateCustomerDto) => Promise<void>
  abstract deleteCustomer: (id: UUID) => Promise<void>
  abstract getCustomer: (id: UUID) => Promise<Customer | null>
}
