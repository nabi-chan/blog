import { describe, expect, it } from 'vitest'
import { checkResponse, extractMetaUrls, extractStylesheets, sitemapPosts } from './smoke'

const ok = { status: 200, location: null, body: '' }

describe('checkResponse', () => {
  it('기대한 상태 코드면 통과한다', () => {
    expect(checkResponse({ path: '/', status: 200 }, ok)).toEqual([])
  })

  it('상태 코드가 다르면 실패를 알린다', () => {
    expect(checkResponse({ path: '/', status: 200 }, { ...ok, status: 404 })).toEqual([
      '/: 상태 코드 200 기대, 실제 404',
    ])
  })

  it('있어야 할 문자열이 없으면 실패를 알린다', () => {
    expect(
      checkResponse({ path: '/', status: 200, contains: ['lang="ko"'] }, { ...ok, body: '<html lang="en">' }),
    ).toEqual(['/: "lang="ko"" 가 없습니다'])
  })

  it('없어야 할 문자열이 있으면 실패를 알린다', () => {
    expect(checkResponse({ path: '/', status: 200, notContains: ['secret'] }, { ...ok, body: 'secret' })).toEqual([
      '/: "secret" 가 있으면 안 됩니다',
    ])
  })

  it('3xx 끼리는 같은 리다이렉트로 보고 Location 끝부분을 비교한다', () => {
    expect(
      checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 308, location: 'http://x/en', body: '' }),
    ).toEqual([])
  })

  it('Location 이 다르면 실패를 알린다', () => {
    expect(
      checkResponse({ path: '/en/', status: 307, location: '/en' }, { status: 307, location: '/fr', body: '' }),
    ).toEqual(['/en/: Location 이 "/en" 으로 끝나야 합니다 (실제 /fr)'])
  })
})

describe('checkResponse 의 count', () => {
  it('문자열이 정확히 그 횟수만큼 있어야 한다', () => {
    const res = { status: 200, location: null, body: '<title>a</title><title>b</title>' }
    expect(checkResponse({ path: '/', status: 200, count: { '<title': 1 } }, res)).toEqual(['/: "<title" 가 1번 있어야 합니다 (실제 2번)'])
    expect(checkResponse({ path: '/', status: 200, count: { '<title': 2 } }, res)).toEqual([])
  })
})

describe('extractMetaUrls', () => {
  it('canonical·alternate 링크와 OG·Twitter 이미지 주소를 뽑고 본문 링크는 뽑지 않는다', () => {
    const html = [
      '<link rel="canonical" href="https://nabichan.me/261020"/>',
      '<link rel="alternate" hrefLang="en" href="https://nabichan.me/en/261020"/>',
      '<link rel="alternate" type="text/markdown" href="/261020.md"/>',
      '<link rel="alternate" type="application/rss+xml" title="eunsol" href="/rss.xml"/>',
      '<link rel="stylesheet" href="/assets/app.css"/>',
      '<meta property="og:image" content="https://nabichan.me/og/ko/261020.png"/>',
      '<meta name="twitter:image" content="https://nabichan.me/og/ko/261020.png"/>',
      '<a href="/posts">글</a>',
    ].join('')
    expect(extractMetaUrls(html)).toEqual([
      'https://nabichan.me/261020',
      'https://nabichan.me/en/261020',
      '/261020.md',
      '/rss.xml',
      'https://nabichan.me/og/ko/261020.png',
      'https://nabichan.me/og/ko/261020.png',
    ])
  })
})

describe('sitemapPosts', () => {
  it('sitemap 주소에서 글 slug 와 영어판이 있는지를 고른다', () => {
    const urls = [
      'https://nabichan.me/',
      'https://nabichan.me/en',
      'https://nabichan.me/posts',
      'https://nabichan.me/en/posts',
      'https://nabichan.me/261021-hello-world',
      'https://nabichan.me/261020',
      'https://nabichan.me/en/261020',
    ]
    expect(sitemapPosts(urls)).toEqual([
      { slug: '261021-hello-world', en: false },
      { slug: '261020', en: true },
    ])
  })

  it('글이 없으면 빈 배열이다', () => {
    expect(sitemapPosts(['https://nabichan.me/', 'https://nabichan.me/posts'])).toEqual([])
  })
})

describe('extractStylesheets', () => {
  it('stylesheet 링크의 주소만 문서 순서대로 고른다', () => {
    const html = '<link rel="preload" href="/fonts/a.woff2"/><link rel="stylesheet" href="/assets/app-abc.css"/><link href="/assets/b.css" rel="stylesheet">'
    expect(extractStylesheets(html)).toEqual(['/assets/app-abc.css', '/assets/b.css'])
  })
})
