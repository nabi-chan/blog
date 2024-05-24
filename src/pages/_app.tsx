import '@/styles/globals.css'
import '@channel.io/bezier-react/styles.css'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import NiceModal from '@ebay/nice-modal-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { startsWith } from 'lodash'
import Head from 'next/head'
import { ThemeProvider } from '@/provider/ThemeProvider/ThemeProvider'
import { Font } from '@/components/Font'

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, pageProps: P) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const beforeSendEvent = <T extends unknown>(event: { url: string } & T) => {
  if (startsWith(event.url, '/nabi')) {
    return null
  }
  return event
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = (page: ReactElement) =>
    Component.getLayout?.(page, pageProps) ?? page

  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          href="/favicon.png"
        />
        <link
          rel="icon"
          href="/favicon.png"
        />
      </Head>
      <QueryClientProvider client={new QueryClient()}>
        <ThemeProvider defaultTheme="light">
          <NiceModal.Provider>
            <Font>{getLayout(<Component {...pageProps} />)}</Font>
          </NiceModal.Provider>
        </ThemeProvider>
      </QueryClientProvider>
      <Analytics beforeSend={beforeSendEvent} />
      <SpeedInsights beforeSend={beforeSendEvent} />
    </>
  )
}
