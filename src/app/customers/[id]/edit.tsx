import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { UUID } from '@/src/lib/utils'
import { useLocalSearchParams } from 'expo-router'

export default function CustomersEditScreen() {
  const params = useLocalSearchParams<{ id: UUID }>()

  const { data: customer, isLoading } = customerHooks.getCustomer(params.id)

  return <></>
}
