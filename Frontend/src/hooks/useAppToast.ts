import { toast } from 'sonner'

/**
 * F.1: Shared toast helper so all pages use identical call signatures,
 * making it easy to swap the toast library in one place.
 */
export function useAppToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    warning: (msg: string) => toast.warning(msg),
    loading: (msg: string) => toast.loading(msg),
    dismiss: (id?: string | number) => toast.dismiss(id),
  }
}
