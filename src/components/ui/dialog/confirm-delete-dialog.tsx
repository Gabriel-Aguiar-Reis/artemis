import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog'
import { Button } from '@/src/components/ui/button'
import { Text } from '@/src/components/ui/text'
import { ReactNode } from 'react'
import { ActivityIndicator } from 'react-native'

type ConfirmDeleteDialogProps = {
  children?: ReactNode
  title: string
  /** Texto extra de alerta (ex.: OS já paga). */
  warning?: string
  /** Pode ser async: o botão fica desabilitado enquanto isPending. */
  handleDelete: () => void | Promise<unknown>
  isPending?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const ConfirmDeleteDialog = ({
  children,
  title,
  warning,
  handleDelete,
  isPending = false,
  open,
  onOpenChange,
}: ConfirmDeleteDialogProps) => {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Não permite fechar enquanto a exclusão está em andamento
        if (isPending && !next) return
        onOpenChange?.(next)
      }}
    >
      {children && <AlertDialogTrigger>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {warning ? `${warning} ` : ''}Tem certeza que deseja excluir? Esta
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            <Text>Cancelar</Text>
          </AlertDialogCancel>
          {/* Button comum (não o Action do primitive) para o dialog só fechar
              quando o chamador decidir, após o resultado da exclusão. */}
          <Button
            variant="destructive"
            onPress={() => {
              void handleDelete()
            }}
            disabled={isPending}
            accessibilityLabel="Confirmar exclusão"
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : null}
            <Text>Excluir</Text>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
