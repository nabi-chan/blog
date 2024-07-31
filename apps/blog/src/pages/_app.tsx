import '@channel.io/bezier-react/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider as BezierToastProvider } from '@channel.io/bezier-react'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { Provider as NiceModalProvider } from '@ebay/nice-modal-react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GlobalStyle } from 'Components/GlobalStyle'
import ClientErrorBoundary from 'Components/Error/ClientErrorBoundary'
import { ThemeProvider } from 'Providers/ThemeProvider/ThemeProvider'
import { Font } from 'Components/Font'

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <>
      <ThemeProvider defaultTheme="light">
        <ClientErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <NiceModalProvider>
              <Font>
                <Component {...pageProps} />
              </Font>
            </NiceModalProvider>
            <BezierToastProvider />
            <GlobalStyle />
            <ReactQueryDevtools />
          </QueryClientProvider>
        </ClientErrorBoundary>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
