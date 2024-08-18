import { env } from 'Constants/environment'
import { merge } from 'lodash-es'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useMemo, type ComponentType } from 'react'
import type { PageProps } from 'src/pages/[[...slug]]'

export const withSeo =
  <Props extends PageProps>(Component: ComponentType<Props>) =>
  (props: Props) => {
    const { asPath } = useRouter()

    const canonical = `${env.homepageUrl ?? window.location.origin}${asPath}`
    const meta = useMemo(() => {
      return [
        {
          name: 'description',
          content: props.seo.description.replace(/\s+/g, ' '),
        },
        {
          name: 'canonical',
          content: canonical,
        },
        {
          name: 'referrer',
          content: 'no-referrer-when-downgrade',
        },
        // opengraph
        {
          property: 'og:site_name',
          content: props.seo.opengraph.sitename,
        },
        {
          property: 'og:type',
          content: props.isPost ? 'article' : 'website',
        },
        {
          property: 'og:title',
          content: props.seo.opengraph.title,
        },
        {
          property: 'og:description',
          content: props.seo.opengraph.description.replace(/\s+/g, ' '),
        },
        {
          property: 'og:image',
          content: props.seo.opengraph.image,
        },
        {
          property: 'og:image:width',
          content: 1200,
          condition: props.seo.opengraph.image !== '',
        },
        {
          property: 'og:image:height',
          content: 840,
          condition: props.seo.opengraph.image !== '',
        },
        {
          property: 'og:url',
          content: canonical,
        },
        // article
        {
          property: 'article:published_time',
          content: new Date(props.published_at).toISOString(),
          condition: props.isPost === true,
        },
        {
          property: 'article:modified_time',
          content: new Date(props.updated_at).toISOString(),
          condition: props.isPost === true,
        },
        // twitter
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: props.seo.twitter.title,
        },
        {
          name: 'twitter:description',
          content: props.seo.twitter.description.replace(/\s+/g, ' '),
        },
        {
          name: 'twitter:url',
          content: canonical,
        },
        {
          name: 'twitter:image',
          content: props.seo.twitter.image,
        },
        // twitter: article
        {
          name: 'twitter:label1',
          content: 'Written by',
          condition: props.isPost === true,
        },
        {
          name: 'twitter:data1',
          content: props.author.name,
          condition: props.isPost === true,
        },
      ].filter((m) => m.condition === undefined || m.condition === true)
    }, [
      canonical,
      props.author.name,
      props.isPost,
      props.published_at,
      props.seo.description,
      props.seo.opengraph.description,
      props.seo.opengraph.image,
      props.seo.opengraph.sitename,
      props.seo.opengraph.title,
      props.seo.twitter.description,
      props.seo.twitter.image,
      props.seo.twitter.title,
      props.updated_at,
    ])

    const baseJsonLd = useMemo(
      () => ({
        '@context': 'https://schema.org',
        publisher: {
          '@type': 'Organization',
          name: props.seo.opengraph.sitename,
          url: canonical,
          logo: {
            '@type': 'ImageObject',
            url: `${env.homepageUrl}/favicon.ico`,
          },
        },
        url: canonical,
        image: {
          '@type': 'ImageObject',
          url: props.seo.image,
          width: 1200,
          height: 840,
        },
        mainEntityOfPage: canonical,
      }),
      [canonical, props.seo.image, props.seo.opengraph.sitename]
    )

    const pageJsonLd = useMemo(
      () => ({
        '@type': 'WebSite',
        description: props.seo.description,
      }),
      [props.seo.description]
    )

    const articleJsonLd = useMemo(
      () => ({
        '@type': 'Article',
        author: {
          '@type': 'Person',
          name: props.author.name,
          image: {
            '@type': 'ImageObject',
            url: props.author.profile_image,
            width: 400,
            height: 400,
          },
          url: `${env.homepageUrl}/about/`,
          sameAs: [],
        },
        headline: props.title,
        datePublished: new Date(props.published_at).toISOString(),
        dateModified: new Date(props.updated_at).toISOString(),
      }),
      [
        props.author.name,
        props.author.profile_image,
        props.published_at,
        props.title,
        props.updated_at,
      ]
    )

    return (
      <>
        <Head>
          <title>{props.seo.title}</title>
          {meta.map((m) => (
            <meta
              key={m.property ?? m.name}
              name={m.name}
              property={m.property}
              content={m.content.toString()}
            />
          ))}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                merge(baseJsonLd, props.isPost ? articleJsonLd : pageJsonLd)
              ),
            }}
          />
        </Head>
        <Component {...props} />
      </>
    )
  }
