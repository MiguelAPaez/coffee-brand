import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CartProvider } from '@/hooks/useCart'
import { AppRoutes } from '@/routes'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  </StrictMode>,
)
