import { describe, expect, it } from 'vitest'
import { site } from '~/site'
import { changedSlugs, indexNowPayload, selectIndexNowUrls, sitemapUrls } from './indexnow'

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://nabichan.me/261020</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://nabichan.me/en/261020"/>
  </url>
  <url>
    <loc>https://nabichan.me/en/261020</loc>
  </url>
  <url>
    <loc>https://nabichan.me/</loc>
  </url>
</urlset>`

describe('sitemapUrls', () => {
  it('<loc> 값만 뽑는다', () => {
    expect(sitemapUrls(SITEMAP)).toEqual(['https://nabichan.me/261020', 'https://nabichan.me/en/261020', 'https://nabichan.me/'])
  })
})

describe('changedSlugs', () => {
  it('글 폴더 안 파일에서 slug 를 중복 없이 뽑는다', () => {
    expect(changedSlugs(['content/posts/261020/index.ko.md', 'content/posts/261020/a.png', 'content/posts/261021/index.en.md', 'src/x.ts'])).toEqual([
      '261020',
      '261021',
    ])
  })
})

describe('selectIndexNowUrls', () => {
  const sitemap = sitemapUrls(SITEMAP)

  it('바뀐 글의 한국어·영어 주소만 고른다', () => {
    expect(selectIndexNowUrls({ sitemap, slugs: ['261020'], all: false })).toEqual(['https://nabichan.me/261020', 'https://nabichan.me/en/261020'])
  })

  it('sitemap 에 없는 글(draft·삭제)은 보내지 않는다', () => {
    expect(selectIndexNowUrls({ sitemap, slugs: ['261099'], all: false })).toEqual([])
  })

  it('all 이면 sitemap 전부다', () => {
    expect(selectIndexNowUrls({ sitemap, slugs: [], all: true })).toEqual(sitemap)
  })
})

describe('indexNowPayload', () => {
  it('호스트·키·키 파일 위치·URL 목록을 담는다', () => {
    expect(indexNowPayload(['https://nabichan.me/261020'])).toEqual({
      host: 'nabichan.me',
      key: site.indexNowKey,
      keyLocation: `https://nabichan.me/${site.indexNowKey}.txt`,
      urlList: ['https://nabichan.me/261020'],
    })
  })
})
