import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { Link, Stack } from 'expo-router'
import {
  ClipboardList,
  FolderTree,
  MapPin,
  MoonStarIcon,
  Package,
  SunIcon,
  Users,
} from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme()

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4"
    >
      {colorScheme === 'dark' ? (
        <SunIcon size={20} color={'white'} />
      ) : (
        <MoonStarIcon size={20} />
      )}
    </Button>
  )
}

const SCREEN_OPTIONS = {
  title: 'Artemis',
  headerRight: () => <ThemeToggle />,
}

interface MenuItemProps {
  title: string
  description: string
  href: any
  icon: React.ReactNode
}

function MenuItem({ title, description, href, icon }: MenuItemProps) {
  return (
    <Link href={href} asChild>
      <Button
        variant="outline"
        className="h-auto flex-row items-start justify-start p-4"
      >
        <View className="flex-1 flex-row gap-3">
          <View className="mt-1">{icon}</View>
          <View className="flex-1">
            <Text className="text-lg font-semibold">{title}</Text>
            <Text className="text-sm text-muted-foreground">{description}</Text>
          </View>
        </View>
      </Button>
    </Link>
  )
}

export default function Screen() {
  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={SCREEN_OPTIONS} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-6">
          <View className="mb-4">
            <Text className="text-3xl font-bold">Bem-vindo ao Artemis</Text>
            <Text className="mt-2 text-muted-foreground">
              Sistema de gerenciamento de rotas e ordens de serviço
            </Text>
          </View>

          <MenuItem
            title="Clientes"
            description="Cadastre e gerencie seus clientes"
            href="/customers"
            icon={
              <Users
                size={24}
                color={
                  useColorScheme().colorScheme === 'dark' ? 'white' : undefined
                }
              />
            }
          />

          <MenuItem
            title="Categorias"
            description="Organize produtos por categorias"
            href="/categories"
            icon={
              <FolderTree
                size={24}
                color={
                  useColorScheme().colorScheme === 'dark' ? 'white' : undefined
                }
              />
            }
          />

          <MenuItem
            title="Produtos"
            description="Gerencie seu catálogo de produtos"
            href="/products"
            icon={
              <Package
                size={24}
                color={
                  useColorScheme().colorScheme === 'dark' ? 'white' : undefined
                }
              />
            }
          />

          <MenuItem
            title="Ordens de Serviço"
            description="Crie e acompanhe ordens de serviço"
            href="/work-orders"
            icon={
              <ClipboardList
                size={24}
                color={
                  useColorScheme().colorScheme === 'dark' ? 'white' : undefined
                }
              />
            }
          />

          <MenuItem
            title="Itinerário"
            description="Planeje suas rotas de visita"
            href="/itinerary"
            icon={
              <MapPin
                size={24}
                color={
                  useColorScheme().colorScheme === 'dark' ? 'white' : undefined
                }
              />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
