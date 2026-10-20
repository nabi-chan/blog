// scripts/indexnow.ts 가 Node 로 바로 불러서 경로 별칭(~/) 대신 상대 경로를 쓴다
import { site } from '../site.ts'

// IndexNow (https://www.indexnow.org). 한 번 보내면 Bing·네이버 등 참여 검색엔진이 같이 받는다. Google 은 받지 않는다
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url)
}

export function changedSlugs(files: string[]): string[] {
  const slugs = files.map((file) => /^content\/posts\/([^/]+)\//.exec(file)?.[1]).filter((slug) => slug !== undefined)
  return [...new Set(slugs)]
}

// 바뀐 글의 공개 주소(sitemap 에 있는 것)만 고른다. draft·삭제된 글은 sitemap 에 없어서 보내지 않는다
export function selectIndexNowUrls(input: { sitemap: string[]; slugs: string[]; all: boolean }): string[] {
  if (input.all) return input.sitemap
  return input.sitemap.filter((url) => {
    const path = new URL(url).pathname
    return input.slugs.some((slug) => path === `/${slug}` || path === `/en/${slug}`)
  })
}

export function indexNowPayload(urls: string[]): { host: string; key: string; keyLocation: string; urlList: string[] } {
  const origin = new URL(site.url)
  return { host: origin.host, key: site.indexNowKey, keyLocation: `${origin.origin}/${site.indexNowKey}.txt`, urlList: urls }
}
