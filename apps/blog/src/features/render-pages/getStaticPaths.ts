import type { GetStaticPaths } from 'next'

export const getStaticPaths = (async () => {
  return {
    paths: [],
    fallback: false,
  }
}) satisfies GetStaticPaths
