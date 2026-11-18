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
  /** Extra warning text (e.g. work order already paid). */
  warning?: string
  /** Can be async: the button stays disabled while isPending. */
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
        // Do not allow closing while deletion is in progress
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
          {/* Plain Button (not the primitive's Action) so the dialog only closes
              when the caller decides, after the deletion result. */}
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
