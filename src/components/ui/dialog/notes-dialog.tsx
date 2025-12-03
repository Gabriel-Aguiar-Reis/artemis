import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/src/components/ui/alert-dialog'
import { Text } from '@/src/components/ui/text'
import { ReactNode } from 'react'

type NotesDialogProps = {
  children?: ReactNode
  title: string
  notes?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const NotesDialog = ({
  children,
  title,
  notes,
  open,
  onOpenChange,
}: NotesDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger>{children}</AlertDialogTrigger>}
      <AlertDialogContent className="max-w-[80%]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {notes || 'Nenhuma observação registrada.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onPress={() => onOpenChange?.(false)}>
            <Text>Fechar</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
