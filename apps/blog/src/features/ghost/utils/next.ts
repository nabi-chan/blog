import type { PostOrPage } from '@tryghost/content-api'
import { isEmpty } from 'lodash-es'

export const toPathParams = (slug?: string[]) => ({ params: { slug } })

export const toSlugArray = (entity: PostOrPage) => {
  const list = entity.slug
    .replace('index', '')
    .split('/')
    .filter((v) => !isEmpty(v))
  return !isEmpty(list) ? list : undefined
}
