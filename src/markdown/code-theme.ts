import type { ThemeRegistrationRaw } from 'shiki'

const RULES = [
  { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#8a8a8a', fontStyle: 'italic' } },
  { scope: ['keyword', 'storage', 'storage.type', 'keyword.operator.new'], settings: { foreground: '#000000', fontStyle: 'bold' } },
  { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: '#5c5c5c' } },
  { scope: ['constant', 'constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: '#000000' } },
  { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#000000' } },
  { scope: ['entity.name.type', 'entity.name.class', 'support.type'], settings: { foreground: '#3a3a3a', fontStyle: 'bold' } },
  { scope: ['variable', 'meta.definition.variable'], settings: { foreground: '#262626' } },
  { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#707070' } },
]

// 무채색 코드 하이라이팅 테마. 색 대신 회색 농도와 굵기로만 구분한다
export const monochromeTheme: ThemeRegistrationRaw = {
  name: 'eunsol-monochrome',
  type: 'light',
  colors: { 'editor.background': '#f4f4f4', 'editor.foreground': '#262626' },
  settings: RULES,
  // rehype-pretty-code 는 tokenColors 가 있어야 테마 객체로 알아본다
  tokenColors: RULES,
}
