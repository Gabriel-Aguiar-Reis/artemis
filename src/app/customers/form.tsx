import { customerHooks } from '@/src/application/hooks/customer.hooks'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Text } from '@/src/components/ui/text'
import { zodResolver } from '@hookform/resolvers/zod'
import { router, Stack } from 'expo-router'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, Switch, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

const customerSchema = z.object({
  storeName: z.string().min(1, 'Digite o nome da loja'),
  contactName: z.string().min(1, 'Digite o nome do contato'),
  phoneNumber: z.string().min(1, 'Digite o telefone'),
  phoneIsWhatsApp: z.boolean(),
  landlineNumber: z.string().optional(),
  streetName: z.string().min(1, 'Digite o nome da rua'),
  streetNumber: z.string().min(1, 'Digite o número'),
  neighborhood: z.string().min(1, 'Digite o bairro'),
  city: z.string().min(1, 'Digite a cidade'),
  zipCode: z.string().min(1, 'Digite o CEP'),
  latitude: z.string().min(1, 'Digite a latitude'),
  longitude: z.string().min(1, 'Digite a longitude'),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export default function CustomerFormScreen() {
  const { mutate: addCustomer } = customerHooks.addCustomer()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      storeName: '',
      contactName: '',
      phoneNumber: '',
      phoneIsWhatsApp: true,
      landlineNumber: '',
      streetName: '',
      streetNumber: '',
      neighborhood: '',
      city: '',
      zipCode: '',
      latitude: '',
      longitude: '',
    },
  })

  const onSubmit = (data: CustomerFormValues) => {
    addCustomer({
      storeName: data.storeName,
      contactName: data.contactName,
      phoneNumber: {
        value: data.phoneNumber,
        isWhatsApp: data.phoneIsWhatsApp,
      },
      landlineNumber: data.landlineNumber
        ? {
            value: data.landlineNumber,
            isWhatsApp: false,
          }
        : undefined,
      storeAddress: {
        streetName: data.streetName,
        streetNumber: parseInt(data.streetNumber),
        neighborhood: data.neighborhood,
        city: data.city,
        zipCode: data.zipCode,
        coordinates: {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        },
      },
    })
    router.back()
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ title: 'Novo Cliente' }} />
      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          <View>
            <Text className="mb-2 font-medium">Nome da Loja</Text>
            <Controller
              control={control}
              name="storeName"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: Mercado Central"
                />
              )}
            />
            {errors.storeName && (
              <Text className="mt-1 text-red-500">
                {errors.storeName.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Nome do Contato</Text>
            <Controller
              control={control}
              name="contactName"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: João Silva"
                />
              )}
            />
            {errors.contactName && (
              <Text className="mt-1 text-red-500">
                {errors.contactName.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Telefone</Text>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="(11) 98765-4321"
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phoneNumber && (
              <Text className="mt-1 text-red-500">
                {errors.phoneNumber.message}
              </Text>
            )}
            <View className="mt-2 flex-row items-center">
              <Controller
                control={control}
                name="phoneIsWhatsApp"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
              <Text className="ml-2">Tem WhatsApp</Text>
            </View>
          </View>

          <View>
            <Text className="mb-2 font-medium">Telefone Fixo (opcional)</Text>
            <Controller
              control={control}
              name="landlineNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="(11) 3456-7890"
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>

          <Text className="mt-4 text-lg font-semibold">Endereço</Text>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="mb-2 font-medium">Rua</Text>
              <Controller
                control={control}
                name="streetName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="Rua das Flores"
                  />
                )}
              />
              {errors.streetName && (
                <Text className="mt-1 text-red-500">
                  {errors.streetName.message}
                </Text>
              )}
            </View>
            <View className="w-20">
              <Text className="mb-2 font-medium">Nº</Text>
              <Controller
                control={control}
                name="streetNumber"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="123"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          <View>
            <Text className="mb-2 font-medium">Bairro</Text>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="Centro"
                />
              )}
            />
            {errors.neighborhood && (
              <Text className="mt-1 text-red-500">
                {errors.neighborhood.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">Cidade</Text>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="São Paulo"
                />
              )}
            />
            {errors.city && (
              <Text className="mt-1 text-red-500">{errors.city.message}</Text>
            )}
          </View>

          <View>
            <Text className="mb-2 font-medium">CEP</Text>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  placeholder="01234-567"
                  keyboardType="numeric"
                />
              )}
            />
            {errors.zipCode && (
              <Text className="mt-1 text-red-500">
                {errors.zipCode.message}
              </Text>
            )}
          </View>

          <Text className="mt-4 text-lg font-semibold">Coordenadas</Text>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="mb-2 font-medium">Latitude</Text>
              <Controller
                control={control}
                name="latitude"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="-23.550520"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.latitude && (
                <Text className="mt-1 text-red-500">
                  {errors.latitude.message}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-medium">Longitude</Text>
              <Controller
                control={control}
                name="longitude"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="-46.633308"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.longitude && (
                <Text className="mt-1 text-red-500">
                  {errors.longitude.message}
                </Text>
              )}
            </View>
          </View>

          <Button onPress={handleSubmit(onSubmit)} className="mt-4">
            <Text>Salvar Cliente</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
