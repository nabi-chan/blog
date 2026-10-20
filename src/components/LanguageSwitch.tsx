import { useMatch, useRouterState } from '@tanstack/react-router'
import { m } from '~/i18n/messages'
import { getLocale, localizeHref } from '~/i18n/runtime'

// 같은 화면의 다른 언어로 보낸다. 글 화면은 그 언어 번역본이 있을 때만 보인다.
// 언어가 바뀌면 문서를 새로 받는 편이 단순해서 일반 <a> 를 쓴다
export function LanguageSwitch() {
  const locale = getLocale()
  const other = locale === 'ko' ? 'en' : 'ko'
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const post = useMatch({ from: '/$slug', shouldThrow: false })
  if (post?.loaderData && !post.loaderData.available.includes(other)) return null
  return (
    <a href={localizeHref(pathname, { locale: other })} hrefLang={other} lang={other}>
      {m.post_read_in_other_language()}
    </a>
  )
}
