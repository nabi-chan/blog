import { useMatch, useRouterState } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { m } from '~/i18n/messages'
import { getLocale, locales, localizeHref } from '~/i18n/runtime'
import { LANGUAGE_NAMES, languageOptions } from '~/lib/language-options'

// 언어 고르기 팝오버. 언어가 늘어도 목록만 길어지게 만든다 [은솔].
// 링크는 닫혀 있어도 HTML 에 있다 (프리렌더 크롤러가 다른 언어 페이지를 찾는 길). 언어를 바꾸면 문서를 새로 받는다
export function LanguageMenu() {
  const locale = getLocale()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const search = useRouterState({ select: (state) => state.location.searchStr })
  // 글 화면은 번역본이 있는 언어만 링크로 낸다
  const post = useMatch({ from: '/$slug', shouldThrow: false })
  const options = languageOptions({
    locales,
    current: locale,
    available: post?.loaderData?.available ?? locales,
    hrefFor: (target) => `${localizeHref(pathname, { locale: target })}${search}`,
  })

  // 바깥을 누르거나 Esc 를 누르면 닫는다
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      root.current?.querySelector<HTMLButtonElement>('.language-menu-button')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="language-menu" ref={root}>
      <button
        type="button"
        className="language-menu-button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${m.language_menu_label()}: ${LANGUAGE_NAMES[locale]}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="language-menu-icon" aria-hidden="true" />
        {LANGUAGE_NAMES[locale]}
      </button>
      <ul id={panelId} className="language-menu-panel" hidden={!open}>
        {options.map((option) => (
          <li key={option.locale}>
            {option.href === null ? (
              <span className="language-menu-item" aria-disabled="true" lang={option.locale}>
                {option.name}
                <small>{m.language_unavailable()}</small>
              </span>
            ) : (
              <a
                className="language-menu-item"
                href={option.href}
                hrefLang={option.locale}
                lang={option.locale}
                aria-current={option.current ? 'true' : undefined}
              >
                {option.name}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
