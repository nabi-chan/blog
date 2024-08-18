import type { IconName } from '@channel.io/bezier-icons'
import type { Nullable, Tag, Author } from '@tryghost/content-api'

export const pickTag = (tag?: Nullable<Tag>) => ({
  id: tag?.id ?? '',
  icon: (tag?.meta_title ?? 'page') as IconName,
  internal: tag?.visibility === 'internal',
  name: (tag?.name ?? '').replace(/_/g, ' ').replace(/^#/g, ''),
  slug: tag?.slug ?? '',
  description: tag?.description ?? '',
})

export const pickAuthor = (author?: Nullable<Author>) => ({
  name: author?.name ?? '',
  slug: author?.slug ?? '',
  description: author?.bio ?? '',
  profile_image: author?.profile_image ?? '',
  bio: author?.bio ?? '',
})
