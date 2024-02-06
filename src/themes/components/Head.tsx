import NextHead from 'next/head';
import { useBlogContext } from 'Themes/contexts/blogContext';
import { getEmojiIcon } from 'Themes/utils/meta';
import { join } from 'lodash-es';
import { useRouter } from 'next/router';

export function Head() {
  const { opts, config } = useBlogContext();
  const { asPath } = useRouter();

  const icon = opts.frontMatter.icon ?? config.icon;

  const title = config.title(opts.title);
  const description = opts.frontMatter.description ?? config.description;
  const image = opts.frontMatter.image ?? config.openGraph.image;

  const pathname = `${config.url}${asPath}`;

  return (
    <NextHead>
      {/* Default Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={join([...config.keywords, opts.frontMatter.tags], '')} />
      <meta name="url" content={pathname} />
      <meta name="canonical" content={config.url} />

      {/* Locale */}
      <meta name="language" content="ko" />

      {/* Favicon */}
      <link rel="icon" href={getEmojiIcon(icon)} />

      {/* OpenGraph */}
      <meta property="og:type" content={config.openGraph.type} />
      <meta property="og:url" content={pathname} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={config.openGraph.siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={config.url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </NextHead>
  );
}
