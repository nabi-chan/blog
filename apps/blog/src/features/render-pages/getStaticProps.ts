import type { GetStaticProps, InferGetStaticPropsType } from 'next'

export const getStaticProps = (async () => {
  return {
    props: {},
  }
}) satisfies GetStaticProps

export type PageProps = InferGetStaticPropsType<typeof getStaticProps>
