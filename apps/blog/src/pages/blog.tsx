import { admin, deserialize } from 'Libs/ghost/admin'
import { content } from 'Libs/ghost/content'
import { map, noop } from 'lodash-es'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { unExpectedValueAssert } from 'Server/errors/UnExpectedValueAssertionError'
import { pickTag, pickAuthor } from 'Features/ghost/utils/ghost'
import { withSeo } from 'Features/seo'
import { withScript } from 'Features/ghost/hocs/withScript'
import {
  Box,
  VStack,
  HStack,
  ListItem,
  LegacyIcon,
  Text,
} from '@channel.io/bezier-react'
import { Navbar } from 'Components/NavBar'
import { format } from 'date-fns'
import Link from 'next/link'
import { PageHeader } from 'Components/PageHeader'
import { TagCheckbox } from 'Features/ghost/components/TagCheckbox'
import { useState } from 'react'

export const getStaticProps = (async (context) => {
  try {
    const _admin = deserialize(await admin.settings.fetch())
    const settings = await content.settings.browse()

    const tags = await content.tags.browse().catch(noop)
    const posts = await content.posts
      .browse({
        include: ['tags', 'authors'],
        limit: 1000,
      })
      .catch(noop)
    const page = await content.pages
      .read({
        slug: 'blog',
      })
      .catch(noop)

    unExpectedValueAssert(tags !== undefined, 'failed fetch tags')
    unExpectedValueAssert(posts !== undefined, 'failed fetch posts')
    unExpectedValueAssert(page !== undefined, '/blog not found')

    const seo = {
      title: page.meta_title ?? page.title ?? settings.meta_title ?? '',
      description:
        page.meta_description ??
        page.excerpt ??
        settings.meta_description ??
        '',
      image: page.feature_image ?? settings.cover_image ?? '',
    }

    return {
      // cache for 1 hour
      revalidate: 60 * 60,
      props: {
        isPost: false,
        banner: _admin.announcement_content && {
          content: (_admin.announcement_content as string) ?? '',
          theme: (_admin.announcement_background as string) ?? '',
        },
        ghost_head: [page.codeinjection_head, settings.codeinjection_head]
          .filter((v) => !!v)
          .join('\n'),
        ghost_foot: [page.codeinjection_foot, settings.codeinjection_foot]
          .filter((v) => !!v)
          .join('\n'),
        seo: {
          ...seo,
          logo: settings.logo ?? '',
          opengraph: {
            sitename: settings.og_title ?? settings.title ?? '',
            title: page.og_title ?? seo.title ?? '',
            description: page.og_description ?? seo.description ?? '',
            image: page.og_image ?? seo.image ?? '',
          },
          twitter: {
            title: page.twitter_title ?? seo.title ?? '',
            description: page.twitter_description ?? seo.description ?? '',
            image: page.twitter_image ?? seo.image ?? '',
          },
        },
        navigation: settings.navigation ?? [],
        title: page.title ?? '',
        description: page.excerpt ?? '',
        image: {
          url: page.feature_image ?? '',
          alt: page.feature_image_alt ?? '',
          caption: page.feature_image_caption ?? '',
        },
        published_at: page.published_at ?? '',
        updated_at: page.updated_at ?? '',
        tags: map(page.tags, pickTag),
        author: pickAuthor(page.primary_author),
        content: (page.html ?? '').replace(process.env.GHOST_API_URL!, ''),
        reading_time: page.reading_time ?? 0,
        posts: {
          list: posts.map((post) => ({
            slug: post.slug ?? '',
            title: post.title ?? '',
            description: post.excerpt ?? '',
            created_at: post.published_at ?? post.created_at ?? '',
            tags: map(post.tags, pickTag),
          })),
          tags: map(tags, pickTag).filter((tag) => tag.internal),
        },
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
    const [selectedTags, setSelectedTags] = useState<string[]>([
      props.posts.tags[0].slug,
    ])

    const filteredPosts = props.posts.list.filter((post) =>
      post.tags.some((tag) => selectedTags.includes(tag.slug))
    )

    const isCategoryNotSelected = selectedTags.length === 0
    const isEmptyPosts = filteredPosts.length === 0

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
          <PageHeader
            title="/blog"
            description="개인적인 감상들과 기술적인 이야기들, 그리고 메모들을 담아놓았습니다."
          >
            <HStack
              wrap
              as="nav"
              spacing={24}
              style={{ rowGap: 0 }}
            >
              {props.posts.tags.map((tag) => (
                <TagCheckbox
                  key={tag.id}
                  checked={selectedTags.includes(tag.slug)}
                  onCheckedChange={(checked) =>
                    checked
                      ? setSelectedTags((p) => [...p, tag.slug])
                      : setSelectedTags((p) => p.filter((t) => t !== tag.slug))
                  }
                  help={tag.description}
                  icon={tag.icon}
                  label={tag.name}
                />
              ))}
            </HStack>
          </PageHeader>

          <VStack>
            {filteredPosts.map((post) => {
              const category = post.tags.find((tag) => tag.internal)

              return (
                <Link
                  key={post.slug}
                  href={post.slug}
                >
                  <ListItem
                    leftContent={
                      <LegacyIcon
                        name={category?.icon ?? 'page'}
                        color="txt-black-dark"
                        size="s"
                      />
                    }
                    content={post.title}
                    description={post.description}
                    rightContent={format(post.created_at ?? '', 'yyyy-MM-dd')}
                  />
                </Link>
              )
            })}

            {isCategoryNotSelected && (
              <VStack paddingVertical={24}>
                <Text
                  typo="14"
                  color="txt-black-darker"
                  align="center"
                >
                  카테고리를 1개 이상 선택해주세요.
                </Text>
              </VStack>
            )}

            {!isCategoryNotSelected && isEmptyPosts && (
              <VStack paddingVertical={24}>
                <Text
                  typo="14"
                  color="txt-black-darker"
                  align="center"
                >
                  아직 작성된 글이 없는것 같네요 ^_^;;
                </Text>
              </VStack>
            )}
          </VStack>
        </VStack>
      </Box>
    )
  })
)
