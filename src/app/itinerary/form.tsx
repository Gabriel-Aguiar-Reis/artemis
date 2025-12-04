import { itineraryHooks } from '@/src/application/hooks/itinerary.hooks'
import { ItineraryForm } from '@/src/components/ui/forms/itinerary-form'
import { ItineraryInsertDTO } from '@/src/domain/validations/itinerary.schema'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Toast from 'react-native-toast-message'

type ItineraryFormData = {
  dateRange: {
    startDate: Date | undefined
    endDate: Date | undefined
  }
}

export default function ItineraryFormScreen() {
  const { mutate: addItinerary, isPending } = itineraryHooks.addItinerary()
  const { data: activeItinerary } = itineraryHooks.getActiveItinerary()

  const form = useForm<ItineraryFormData>({
    defaultValues: {
      dateRange: {
        startDate: undefined,
        endDate: undefined,
      },
    },
    mode: 'onChange',
  })

  // Verificar se já existe itinerário ativo
  useEffect(() => {
    if (activeItinerary) {
      Toast.show({
        type: 'error',
        text1: 'Itinerário ativo encontrado',
        text2: 'Finalize o itinerário atual antes de criar um novo',
      })
      setTimeout(() => {
        router.back()
      }, 2000)
    }
  }, [activeItinerary])

  const onSubmit = form.handleSubmit((data: ItineraryFormData) => {
    if (!data.dateRange.startDate || !data.dateRange.endDate) {
      Toast.show({
        type: 'error',
        text1: 'Período obrigatório',
        text2: 'Selecione um período para criar o itinerário',
      })
      return
    }

    const itineraryData: ItineraryInsertDTO = {
      initialItineraryDate: data.dateRange.startDate.toISOString(),
      finalItineraryDate: data.dateRange.endDate.toISOString(),
      isFinished: false,
    }

    addItinerary(itineraryData)
    router.back()
  })

  // Não renderizar o form se já houver itinerário ativo
  if (activeItinerary) {
    return null
  }

  return (
    <ItineraryForm
      title="Novo Itinerário"
      onSubmit={onSubmit}
      errors={form.formState.errors}
      control={form.control}
      submitLabel="Criar Itinerário"
      loading={isPending}
      dateRangeName="dateRange"
    />
  )
}
