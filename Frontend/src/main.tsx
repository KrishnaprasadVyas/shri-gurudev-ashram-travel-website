import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          {/* Phase 8 #8: Redesigned Toast Notifications with white cards & gold/green/red/blue accents */}
          <Toaster
            position="top-right"
            theme="light"
            toastOptions={
              {
                style: {
                  background: '#FFFFFF',
                  border: '1px solid #E8DDC7',
                  color: '#4B3621',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  boxShadow: '0 12px 40px rgba(90, 70, 20, 0.15)',
                  fontSize: '14px',
                  fontFamily: `'Inter', 'Plus Jakarta Sans', sans-serif`,
                },
                success: {
                  style: {
                    border: '1px solid rgba(46, 125, 50, 0.35)',
                    background: '#FFFDF8',
                    color: '#2E7D32',
                    fontWeight: '600',
                  },
                },
                error: {
                  style: {
                    border: '1px solid rgba(178, 58, 47, 0.35)',
                    background: '#FFFDF8',
                    color: '#B23A2F',
                    fontWeight: '600',
                  },
                },
                info: {
                  style: {
                    border: '1px solid rgba(37, 99, 235, 0.35)',
                    background: '#FFFDF8',
                    color: '#2563EB',
                    fontWeight: '600',
                  },
                },
              } as any
            }
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
