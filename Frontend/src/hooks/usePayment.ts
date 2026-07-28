import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import apiClient from '@/lib/apiClient'
import { QUERY_KEYS } from '@/lib/queryKeys'
import { toast } from 'sonner'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function usePayment() {
  const queryClient = useQueryClient()
  const isProcessingRef = useRef(false)

  const initiatePayment = useCallback(
    async (bookingId: string, bookingReference: string) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      try {
        toast.loading('Preparing payment...')

        // 1. Create Razorpay order
        const { data } = await apiClient.post('/api/payments/create-order', { bookingId })
        const { order } = data

        // 2. Load Razorpay script
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          toast.error('Failed to load payment gateway. Please try again.')
          return
        }

        toast.dismiss()

        // 3. Open checkout
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency ?? 'INR',
          name: 'माँ वैष्णवी टूरिज़्म',
          description: `Yatra Booking - ${bookingReference}`,
          order_id: order.id,
          theme: { color: '#E97B22' },
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            try {
              await apiClient.post('/api/payments/verify', {
                bookingId,
                ...response,
              })
              await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.booking(bookingId),
              })
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings })
              toast.success('Payment successful! Booking confirmed. 🙏')
            } catch {
              toast.error('Payment verification failed. Contact support if amount was deducted.')
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled')
            },
          },
        })
        rzp.open()
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to initiate payment'
        toast.error(message)
      } finally {
        isProcessingRef.current = false
      }
    },
    [queryClient],
  )

  return { initiatePayment }
}
