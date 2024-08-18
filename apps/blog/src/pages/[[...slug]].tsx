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
import { toPathParams, toSlugArray } from 'Features/ghost/utils/next'
import { pickTag, pickAuthor } from 'Features/ghost/utils/ghost'
import { withSeo } from 'Features/seo'
import { withScript } from 'Features/ghost/hocs/withScript'
import parse from 'html-react-parser'
import { Box, VStack, Text } from '@channel.io/bezier-react'
import { Content } from 'Features/ghost/components/viewer.styled'
import { Navbar } from 'Components/NavBar'
import { format } from 'date-fns'
import { PageHeader } from 'Components/PageHeader'

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
        ghost_head: [pageOrPost.codeinjection_head, settings.codeinjection_head]
          .filter((v) => !!v)
          .join('\n'),
        ghost_foot: [pageOrPost.codeinjection_foot, settings.codeinjection_foot]
          .filter((v) => !!v)
          .join('\n'),
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
        navigation: settings.navigation ?? [],
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
        content: (pageOrPost.html ?? '').replace(
          process.env.GHOST_API_URL!,
          ''
        ),
        reading_time: pageOrPost.reading_time ?? 0,
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
    return (
      <Box padding={24}>
        <Navbar
          title={props.seo.opengraph.sitename}
          navigation={props.navigation}
        />
        <VStack
          maxWidth="var(--content-max-width, 72rem)"
          marginHorizontal="auto"
          spacing={16}
          padding={16}
        >
          {props.isPost && (
            <PageHeader
              title={props.title}
              description={props.description}
            >
              <Text
                typo="12"
                color="txt-black-darker"
              >
                {format(props.published_at, 'yyyy-MM-dd')}에 나비가 작성했어요.
                다 읽는데 {props.reading_time}분이 걸려요.
              </Text>
            </PageHeader>
          )}
          <Content>{parse(props.content)}</Content>
        </VStack>
      </Box>
    )
  })
)
