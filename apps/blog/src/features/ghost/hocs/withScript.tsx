import Head from 'next/head'
import type { ComponentType } from 'react'
import type { PageProps } from 'src/pages/[[...slug]]'
import parse from 'html-react-parser'

export const withScript =
  <Props extends PageProps>(Component: ComponentType<Props>) =>
  (props: Props) => {
    return (
      <>
        <Head>{parse(props.ghost_head)}</Head>
        <Component {...props} />
        {parse(props.ghost_foot)}
      </>
    )
  }
