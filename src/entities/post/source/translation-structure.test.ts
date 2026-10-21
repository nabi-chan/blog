import { describe, expect, it } from 'vitest'
import { compareStructure, translationStructure } from './translation-structure'

const KO = `## 구성

![구성도](./diagram.svg "그림")

> [!TIP]
> 처음 오셨다면 [구성](/261020#구성) 부터 보세요.

### 렌더링

\`\`\`ts
// 인사
const greeting = '안녕하세요'
\`\`\`

글은 미리 :term[프리렌더]{key="prerender"} 해 둡니다.

::::quote
:::translation
단순한 것이 신뢰할 수 있는 것의 전제 조건이다.
:::
:::original
Simplicity is prerequisite for reliability.
:::
::::

:::widget-counter-demo
대체 문장
:::

[외부](https://tanstack.com/start)
`

const EN = `## Structure

![Diagram](./diagram.svg "Figure")

> [!TIP]
> New here? Start with [Structure](/261020#structure).

### Rendering

\`\`\`ts
// greeting
const greeting = 'Hello'
\`\`\`

Pages are :term[prerendered]{key="prerender"} ahead of time.

::::quote
:::translation
Simplicity is prerequisite for reliability.
:::
:::original
Simplicity is prerequisite for reliability.
:::
::::

:::widget-counter-demo
Fallback
:::

[External](https://tanstack.com/start)
`

describe('translationStructure', () => {
  it('헤딩·링크·이미지·Callout·코드·디렉티브·용어·원문을 순서대로 모은다', () => {
    expect(translationStructure(KO)).toEqual({
      headings: [2, 3],
      links: ['/261020', 'https://tanstack.com/start'],
      images: ['./diagram.svg'],
      callouts: ['tip'],
      code: ['ts'],
      directives: ['quote', 'translation', 'original', 'widget-counter-demo'],
      terms: ['prerender'],
      originals: ['Simplicity is prerequisite for reliability.'],
    })
  })

  it('frontmatter 가 있으면 빼고 본다', () => {
    expect(translationStructure(`---\ntitle: a\n---\n\n## 제목\n`).headings).toEqual([2])
  })
})

describe('compareStructure', () => {
  const ko = translationStructure(KO)
  const en = (text: string) => compareStructure(ko, translationStructure(text))

  it('링크 글자·대체 텍스트·Callout 본문·코드 주석·내부 링크 앵커만 다르면 문제없다', () => {
    expect(en(EN)).toEqual([])
  })

  it('링크와 :term 은 어순에 따라 순서가 바뀌어도 된다 (개수와 목적지는 같아야 한다)', () => {
    const ko2 = translationStructure('[인트라](/a)와 [직접](/b)을 비교한 뒤 [파라](/c)로 정했습니다. :term[하나]{key="x"} 와 :term[둘]{key="y"}\n')
    const en2 = translationStructure('I picked [Paraglide](/c) after comparing [Intlayer](/a) and [hand-rolled](/b). :term[two]{key="y"} and :term[one]{key="x"}\n')
    expect(compareStructure(ko2, en2)).toEqual([])
    const missing = translationStructure('I picked [Paraglide](/c) after comparing [Intlayer](/a). :term[one]{key="x"}\n')
    expect(compareStructure(ko2, missing)).toEqual(['링크 목적지가 다릅니다: ko [/a, /b, /c] / en [/a, /c]', ':term key 가 다릅니다: ko [x, y] / en [x]'])
  })

  it('다른 구조는 항목마다 한 줄씩 알려 준다', () => {
    expect(en(EN.replace('### Rendering', '## Rendering'))).toEqual(['헤딩 깊이가 다릅니다: ko [2, 3] / en [2, 2]'])
    expect(en(EN.replace("```ts\n// greeting\nconst greeting = 'Hello'\n```", ''))).toEqual(['코드 블록 개수가 다릅니다: ko 1 / en 0'])
    expect(en(EN.replace('```ts', '```js'))).toEqual(['코드 블록 언어가 다릅니다: ko [ts] / en [js]'])
    expect(en(EN.replace('[!TIP]', '[!NOTE]'))).toEqual(['Callout 종류가 다릅니다: ko [tip] / en [note]'])
    expect(en(EN.replace('./diagram.svg', './diagram-en.svg'))).toEqual(['이미지 경로가 다릅니다: ko [./diagram.svg] / en [./diagram-en.svg]'])
    // 확장자 앞의 언어 접미사는 같은 그림의 언어판으로 본다 (?w= 같은 쿼리가 붙어도)
    expect(en(EN.replace('./diagram.svg', './diagram.en.svg'))).toEqual([])
    expect(compareStructure(translationStructure('![a](./d.ko.svg?w=400)\n'), translationStructure('![a](./d.en.svg?w=400)\n'))).toEqual([])
    expect(compareStructure(translationStructure('![a](./d.svg?w=400)\n'), translationStructure('![a](./d.en.svg?w=720)\n'))).toEqual([
      '이미지 경로가 다릅니다: ko [./d.svg?w=400] / en [./d.en.svg?w=720]',
    ])
    expect(en(EN.replace('https://tanstack.com/start', 'https://tanstack.com'))).toEqual([
      '링크 목적지가 다릅니다: ko [/261020, https://tanstack.com/start] / en [/261020, https://tanstack.com]',
    ])
    expect(en(EN.replace('key="prerender"', 'key="hydration"'))).toEqual([':term key 가 다릅니다: ko [prerender] / en [hydration]'])
    expect(en(EN.replace('Simplicity is prerequisite for reliability.\n:::\n::::', 'Simplicity is prerequisite for reliability!\n:::\n::::'))).toEqual([
      ':::original 원문이 다릅니다',
    ])
    expect(en(EN.replace(':::widget-counter-demo', ':::widget-other'))).toEqual([
      '디렉티브 구조가 다릅니다: ko [quote, translation, original, widget-counter-demo] / en [quote, translation, original, widget-other]',
    ])
  })
})
