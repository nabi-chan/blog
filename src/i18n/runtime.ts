// 앱 코드는 Paraglide 를 직접 import 하지 않고 이 파일을 거친다.
// 스파이크에서 직접 구현으로 되돌릴 때 이 파일과 messages.ts 만 바꾸면 되게 하려는 것이다.
export {
  baseLocale,
  deLocalizeUrl,
  getLocale,
  localizeHref,
  localizeUrl,
  locales,
  type Locale,
} from '~/paraglide/runtime'
