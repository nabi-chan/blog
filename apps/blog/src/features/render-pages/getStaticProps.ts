import type { Params } from '@tryghost/content-api'
import { content } from 'Libs/ghost/content'
import { isObject, map, noop, pick } from 'lodash-es'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { badRequestAssert } from 'Server/errors/BadRequestAssertionError'
import { unExpectedValueAssert } from 'Server/errors/UnExpectedValueAssertionError'

export const getStaticProps = (async (context) => {
  try {
    unExpectedValueAssert(
      typeof context.params?.slug !== 'string',
      'slug should be array or undefined'
    )

    const payload: Params & { slug: string } = {
      include: ['authors', 'tags'],
      slug: (context.params?.slug ?? ['index']).join('/'),
    }

    // prevent throwing error when content not found
    const page = await content.pages.read(payload).catch(noop)
    const post = await content.posts.read(payload).catch(noop)

    const pageOrPost = page ?? post
    badRequestAssert(
      isObject(pageOrPost),
      'not found page / post for slug : ' + payload.slug
    )

    return {
      // cache for 1 hour
      revalidate: 60 * 60,
      props: {
        title: pageOrPost.title,
        description: pageOrPost.excerpt,
        tags: pageOrPost.tags,
        authors: map(pageOrPost.authors, (v) =>
          pick(v, ['name', 'slug', 'profile_image', 'bio'])
        ),
        content: pageOrPost.html,
      },
    }
  } catch {
    return {
      notFound: true,
      revalidate: true,
    }
  }
}) satisfies GetStaticProps

export type PageProps = InferGetStaticPropsType<typeof getStaticProps>
