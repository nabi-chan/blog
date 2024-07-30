import Head from 'next/head'
import type { PropsWithChildren } from 'react'

export interface BaseLayoutProps {
  title?: string
  description?: string
  image?: string

  noindex?: boolean
}

export function BaseLayout({
  title = '고양이집',
  description = '이것저것 들어있는 나비의 홈페이지 ^_^b',
  image,

  noindex = false,

  children,
}: PropsWithChildren<BaseLayoutProps>) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={description}
        />

        <meta
          name="og:title"
          content={title}
        />
        <meta
          name="og:description"
          content={description}
        />
        {image && (
          <meta
            name="og:image"
            content={image}
          />
        )}
        <meta
          name="og:sitename"
          content="고양이집"
        />

        {noindex && (
          <>
            <meta
              name="robots"
              content="noindex, nofollow"
            />
            <meta
              name="googlebot"
              content="noindex, nofollow"
            />
          </>
        )}
      </Head>
      {children}
    </>
  )
}
