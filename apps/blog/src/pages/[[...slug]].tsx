import type { Params } from '@tryghost/content-api'
import { admin, deserialize } from 'Libs/ghost/admin'
import { content } from 'Libs/ghost/content'
import { isEmpty, isObject, map, noop } from 'lodash-es'
import type {
  GetStaticProps,
  InferGetStaticPropsType,
  GetStaticPaths,
} from 'next'
import { badRequestAssert } from 'Server/errors/BadRequestAssertionError'
import { unExpectedValueAssert } from 'Server/errors/UnExpectedValueAssertionError'
import { Text } from '@channel.io/bezier-react'
import { toPathParams, toSlugArray } from 'Features/ghost/utils/next'
import { pickTag, pickAuthor } from 'Features/ghost/utils/ghost'
import { withSeo } from 'Features/seo'
import { withScript } from 'Features/ghost/hocs/withScript'

export const getStaticPaths = (async () => {
  const posts = await content.posts.browse()
  const pages = await content.pages.browse()

  const paths = [...posts.map(toSlugArray), ...pages.map(toSlugArray)]

  return {
    paths: paths.map(toPathParams),
    fallback: false,
  }
}) satisfies GetStaticPaths

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

    const _admin = deserialize(await admin.settings.fetch())
    const settings = await content.settings.browse()

    // prevent throwing error when content not found
    const page = await content.pages.read(payload).catch(noop)
    const post = await content.posts.read(payload).catch(noop)

    const pageOrPost = page ?? post
    badRequestAssert(
      isObject(pageOrPost),
      'not found page / post for slug : ' + payload.slug
    )

    const seo = {
      title:
        pageOrPost.meta_title ?? pageOrPost.title ?? settings.meta_title ?? '',
      description:
        pageOrPost.meta_description ??
        pageOrPost.excerpt ??
        settings.meta_description ??
        '',
      image: pageOrPost.feature_image ?? settings.cover_image ?? '',
    }

    return {
      // cache for 1 hour
      revalidate: 60 * 60,
      props: {
        isPost: !isEmpty(post),
        banner: _admin.announcement_content && {
          content: (_admin.announcement_content as string) ?? '',
          theme: (_admin.announcement_background as string) ?? '',
        },
        ghost_head: [
          pageOrPost.codeinjection_head,
          settings.codeinjection_head,
        ].join('\n'),
        ghost_foot: [
          pageOrPost.codeinjection_foot,
          settings.codeinjection_foot,
        ].join('\n'),
        seo: {
          ...seo,
          logo: settings.logo ?? '',
          opengraph: {
            sitename: settings.og_title ?? settings.title ?? '',
            title: pageOrPost.og_title ?? seo.title ?? '',
            description: pageOrPost.og_description ?? seo.description ?? '',
            image: pageOrPost.og_image ?? seo.image ?? '',
          },
          twitter: {
            title: pageOrPost.twitter_title ?? seo.title ?? '',
            description:
              pageOrPost.twitter_description ?? seo.description ?? '',
            image: pageOrPost.twitter_image ?? seo.image ?? '',
          },
        },
        title: pageOrPost.title ?? '',
        description: pageOrPost.excerpt ?? '',
        image: {
          url: pageOrPost.feature_image ?? '',
          alt: pageOrPost.feature_image_alt ?? '',
          caption: pageOrPost.feature_image_caption ?? '',
        },
        published_at: pageOrPost.published_at ?? '',
        updated_at: pageOrPost.updated_at ?? '',
        tags: map(pageOrPost.tags, pickTag),
        author: pickAuthor(pageOrPost.primary_author),
        content: pageOrPost.html ?? '',
      },
    }
  } catch (e) {
    console.log(e)
    return {
      notFound: true,
      revalidate: true,
    }
  }
}) satisfies GetStaticProps

export type PageProps = InferGetStaticPropsType<typeof getStaticProps>

export default withScript(
  withSeo(function Page(props: PageProps) {
    return <Text as="pre">{JSON.stringify(props, null, 2)}</Text>
  })
)
