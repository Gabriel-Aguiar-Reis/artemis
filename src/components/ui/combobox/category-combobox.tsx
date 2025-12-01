import { categoryHooks } from '@/src/application/hooks/category.hooks'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { Icon } from '@/src/components/ui/icon'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { Category } from '@/src/domain/entities/category/category.entity'
import { cn } from '@/src/lib/utils'
import { FlashList } from '@shopify/flash-list'
import { Check, ChevronDown, FolderTree, Search, X } from 'lucide-react-native'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

type CategoryComboboxProps = {
  selectedCategoryId: string
  onCategoryChange: (categoryId: string) => void
  label?: string
  placeholder?: string
}

export function CategoryCombobox({
  selectedCategoryId,
  onCategoryChange,
  label = 'Categoria',
  placeholder = 'Selecione uma categoria',
}: CategoryComboboxProps) {
  const { data: categories = [], isLoading } = categoryHooks.getCategories()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  const isSelected = (categoryId: string) => {
    return selectedCategoryId === categoryId
  }

  const toggleCategory = (category: Category) => {
    onCategoryChange(category.id)
    setOpen(false)
  }

  const selectedCategoryText = useMemo(() => {
    if (!selectedCategoryId) return placeholder
    const category = categories.find((c) => c.id === selectedCategoryId)
    return category?.name || placeholder
  }, [selectedCategoryId, categories, placeholder])

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const selected = isSelected(item.id)

    return (
      <View className="min-h-[60px] w-full">
        <Pressable
          onPress={() => toggleCategory(item)}
          className={cn(
            'p-4 border-b border-border w-full',
            selected && 'bg-accent/50'
          )}
        >
          <View className="flex-row justify-between items-center w-full">
            <View className="flex-1 flex-row items-center gap-3">
              <Icon as={FolderTree} size={18} className="text-primary" />
              <View className="flex-1">
                <Text className="font-semibold text-base">{item.name}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View
                    className={cn(
                      'h-2 w-2 rounded-full',
                      item.isActive ? 'bg-green-500' : 'bg-gray-400'
                    )}
                  />
                  <Text className="text-xs text-muted-foreground">
                    {item.isActive ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
              </View>
            </View>

            {selected && (
              <View className="bg-primary rounded-full p-1">
                <Icon
                  as={Check}
                  size={16}
                  className="text-primary-foreground"
                />
              </View>
            )}
          </View>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="gap-2">
      {label && <Text className="text-sm font-medium">{label}</Text>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Pressable
            className={cn(
              'flex-row items-center justify-between h-12 px-4 rounded-md',
              'border border-input bg-background',
              'active:bg-accent'
            )}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Icon
                as={FolderTree}
                size={20}
                className="text-muted-foreground"
              />
              <Text
                className={cn(
                  'flex-1',
                  !selectedCategoryId && 'text-muted-foreground'
                )}
                numberOfLines={1}
              >
                {selectedCategoryText}
              </Text>
            </View>
            <Icon
              as={ChevronDown}
              size={20}
              className="text-muted-foreground"
            />
          </Pressable>
        </DialogTrigger>

        <DialogContent className="w-80 h-3/4 max-w-[90%]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <View className="flex-1 w-full">
            <View className="relative mb-4 w-full">
              <Icon
                as={Search}
                className="text-muted-foreground absolute left-3 top-2.5 z-10"
                size={20}
              />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="pl-10 pr-10 w-full"
              />
              {searchQuery !== '' && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5"
                >
                  <Icon as={X} className="text-muted-foreground" size={20} />
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground">
                  Carregando categorias...
                </Text>
              </View>
            ) : filteredCategories.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  {searchQuery
                    ? 'Nenhuma categoria encontrada com esse nome'
                    : 'Nenhuma categoria cadastrada'}
                </Text>
              </View>
            ) : (
              <View className="flex-1 w-full">
                <FlashList
                  data={filteredCategories}
                  renderItem={renderCategoryItem}
                />
              </View>
            )}
          </View>

          <DialogFooter className="flex-row gap-2">
            <DialogClose asChild className="flex-1">
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </DialogClose>
            <DialogClose asChild className="flex-1">
              <Button>
                <Text>Confirmar</Text>
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}
