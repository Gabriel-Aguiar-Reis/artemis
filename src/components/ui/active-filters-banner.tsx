import { Button } from '@/src/components/ui/button'
import { Icon } from '@/src/components/ui/icon'
import { Text } from '@/src/components/ui/text'
import { Link, LinkProps } from 'expo-router'
import { FilterX } from 'lucide-react-native'
import * as React from 'react'
import { View } from 'react-native'

type FilterChip = {
  label: string
  value: string
}

type ActiveFiltersBannerProps = {
  filters: FilterChip[]
  clearFiltersHref: LinkProps['href']
}

export const ActiveFiltersBanner = ({
  filters,
  clearFiltersHref,
}: ActiveFiltersBannerProps) => {
  if (filters.length === 0) return null

  return (
    <View className="rounded-lg border-b border-border bg-muted/50 mx-4 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium">Filtros ativos:</Text>
          <View className="mt-1 flex-row flex-wrap gap-2">
            {filters.map((filter, index) => (
              <View
                key={index}
                className="rounded-full bg-primary/10 px-3 py-1"
              >
                <Text className="text-xs">
                  {filter.label}: {filter.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Link href={clearFiltersHref} asChild>
          <Button size="icon" variant="ghost">
            <Icon as={FilterX} className="text-muted-foreground" />
          </Button>
        </Link>
      </View>
    </View>
  )
}
