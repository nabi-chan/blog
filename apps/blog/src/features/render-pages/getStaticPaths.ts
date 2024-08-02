import type { PostOrPage } from '@tryghost/content-api'
import { content } from 'Libs/ghost/content'
import { isEmpty } from 'lodash-es'
import type { GetStaticPaths } from 'next'

const toSlugArray = (entity: PostOrPage) => {
  const list = entity.slug
    .replace('index', '')
    .split('/')
    .filter((v) => !isEmpty(v))
  return !isEmpty(list) ? list : undefined
}

const toPathParams = (slug?: string[]) => ({ params: { slug } })

export const getStaticPaths = (async () => {
  const posts = await content.posts.browse()
  const pages = await content.pages.browse()

  const paths = [...posts.map(toSlugArray), ...pages.map(toSlugArray)]

  return {
    paths: paths.map(toPathParams),
    fallback: false,
  }
}) satisfies GetStaticPaths
