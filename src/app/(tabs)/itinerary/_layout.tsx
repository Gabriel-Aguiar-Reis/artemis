import { TabStack } from '@/src/components/ui/tab-stack'

export default function Layout() {
  return (
    <TabStack
      title="Itinerário"
      screens={[
        { name: 'history', title: 'Histórico de Itinerários' },
        { name: '[id]/details', title: 'Detalhes do Itinerário' },
      ]}
    />
  )
}
