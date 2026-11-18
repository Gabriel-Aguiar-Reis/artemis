import { TabStack } from '@/src/components/ui/tab-stack'

export default function Layout() {
  return (
    <TabStack
      title="Ordens de Serviço"
      screens={[
        { name: '[id]/details' },
        { name: '[id]/payment' },
        { name: '[id]/products' },
        { name: '[id]/result' },
      ]}
    />
  )
}
