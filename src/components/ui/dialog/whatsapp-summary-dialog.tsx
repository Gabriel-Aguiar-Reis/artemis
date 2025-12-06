import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { Text } from '@/src/components/ui/text'
import * as React from 'react'

type WhatsAppSummaryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function WhatsAppSummaryDialog({
  open,
  onOpenChange,
  title = 'Enviar resumo ao cliente?',
  description = 'Deseja enviar via WhatsApp o resumo desta ordem de serviço?',
  onConfirm,
  onCancel,
}: WhatsAppSummaryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Text>{title}</Text>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Text>{description}</Text>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onPress={() => {
              onOpenChange(false)
              onCancel?.()
            }}
          >
            <Text>Cancelar</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={onConfirm}>
            <Text>Enviar via WhatsApp</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
