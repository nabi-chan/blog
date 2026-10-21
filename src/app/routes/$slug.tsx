import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPostFn } from '~/entities/post'
import { PostPage } from '~/pages/post'
import { getLocale } from '~/shared/i18n'
import { pageHead } from '~/app/seo/head'
import { postGraph } from '~/app/seo/json-ld'
import { absoluteUrl } from '~/app/seo/url'

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    const page = await getPostFn({ data: { locale: getLocale(), slug: params.slug } })
    if (!page) throw notFound()
    return page
  },
  // 글 페이지 제목은 글 제목만 쓴다 (스펙 4.9). 404 면 notFoundComponent 가 제목을 단다
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { post, available, categories, wordCount } = loaderData
    const image = absoluteUrl(`/og/${post.locale}/${post.slug}.png`)
    const labels = categories.map((category) => category.label)
    return pageHead({
      locale: post.locale,
      path: `/${post.slug}`,
      title: post.title,
      description: post.description,
      type: 'article',
      image,
      alternates: available,
      published: post.date,
      modified: post.updated,
      jsonLd: postGraph({ ...post, categories: labels, wordCount, image }),
      markdownPath: `/${post.slug}.md`,
    })
  },
  component: () => <PostPage page={Route.useLoaderData()} />,
})
