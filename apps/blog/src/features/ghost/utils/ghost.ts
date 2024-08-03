import type { Nullable, Tag, Author } from '@tryghost/content-api'

export const pickTag = (tag?: Nullable<Tag>) => ({
  name: tag?.name ?? '',
  slug: tag?.slug ?? '',
  description: tag?.description ?? '',
  accent_color: tag?.accent_color ?? '',
})

export const pickAuthor = (author?: Nullable<Author>) => ({
  name: author?.name ?? '',
  slug: author?.slug ?? '',
  description: author?.bio ?? '',
  profile_image: author?.profile_image ?? '',
  bio: author?.bio ?? '',
})
