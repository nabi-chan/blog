import type { GetServerSideProps } from 'next'
import type { ISitemapField } from 'next-sitemap'
import { getServerSideSitemapLegacy } from 'next-sitemap'
import { content } from 'Libs/ghost/content'
import config from 'next-sitemap.config'

export const getServerSideProps = (async (context) => {
  const posts = await content.posts.browse()
  const pages = await content.pages.browse()

  const paths = [...posts, ...pages]

  const fields: ISitemapField[] = paths.map((page) => ({
    loc: `${config.siteUrl}/${page.slug.replace('index', '')}`,
    lastmod: new Date(page.updated_at ?? +new Date()).toISOString(),
    changefreq: 'always',
  }))

  return getServerSideSitemapLegacy(context, fields)
}) satisfies GetServerSideProps

export default function Page() {
  return null
}
