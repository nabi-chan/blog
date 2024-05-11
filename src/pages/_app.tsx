import '@/styles/globals.css'
import '@channel.io/bezier-react/styles.css'

import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import NiceModal from '@ebay/nice-modal-react'
import { ThemeProvider } from '@/provider/ThemeProvider/ThemeProvider'

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, pageProps: P) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = (page: ReactElement) =>
    Component.getLayout?.(page, pageProps) ?? page

  return (
    <ThemeProvider defaultTheme="light">
      <NiceModal.Provider>
        {getLayout(<Component {...pageProps} />)}
      </NiceModal.Provider>
    </ThemeProvider>
  )
}
