import { success } from '@/src/components/ui/toasts/success'
import { ReactNode } from 'react'
import { ToastConfig, ToastConfigParams } from 'react-native-toast-message'

export type Toast = {
  (params: ToastConfigParams<any>): ReactNode
}

export const toastConfig: ToastConfig = {
  success,
}
