import { describe, expect, it } from 'vitest'
import {
  brokenBold,
  brokenInternalLinks,
  collectContentProblems,
  collectContentWarnings,
  headingAnchors,
  messageKeyDiff,
  missingTagLabels,
  missingTerms,
  plainTextMarker,
  spellingWarnings,
} from './content-checks'

describe('missingTagLabels / missingTerms', () => {
  it('표에 없는 키를 낸다', () => {
    expect(missingTagLabels(['meta', 'llm'], [{ key: 'meta' }])).toEqual(['llm'])
    expect(missingTerms(['prerender', 'hydration', 'prerender'], [{ key: 'prerender' }])).toEqual(['hydration'])
  })
})

describe('headingAnchors', () => {
  it('rehype-slug 와 같은 규칙으로 헤딩 id 를 만든다', () => {
    expect([...headingAnchors('## 구성\n\n### `code` 예시\n\n## 구성')]).toEqual(['구성', 'code-예시', '구성-1'])
  })
})

describe('brokenInternalLinks', () => {
  const site = {
    posts: new Map([
      ['261020', { ko: new Set(['구성']), en: new Set(['structure']) }],
      ['261021', { ko: new Set(['소개']) }],
    ]),
  }

  it('있는 글·앵커·목록·산출물 링크와 외부 링크는 통과한다', () => {
    const markdown = '[a](/261020#구성) [b](#구성) [c](/posts) [d](/) [e](/posts?tag=meta) [f](https://x.com) [g](/rss.xml) [h](/261020.md) [i](mailto:a@b.c)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown }, site)).toEqual([])
  })

  it('없는 글, 그 글에 없는 앵커, 알 수 없는 경로를 알린다', () => {
    const markdown = '[a](/261099) [b](/261020#없음) [c](#없음) [d](/nope)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown }, site)).toEqual([
      '/261099 → 없는 글',
      '/261020#없음 → 261020 에 없는 앵커',
      '#없음 → 261020 에 없는 앵커',
      '/nope → 알 수 없는 사이트 경로',
    ])
  })

  it('en 원문은 번역이 있는 글이면 en 앵커로, 없으면 ko 앵커로 본다', () => {
    const markdown = '[a](/261020#structure) [b](/261021#소개) [c](#structure) [d](/en/261021)'
    expect(brokenInternalLinks({ slug: '261020', locale: 'en', markdown }, site)).toEqual(['/en/261021 → 번역 없는 글'])
  })

  it('한글 앵커가 퍼센트 인코딩돼 있어도 찾는다', () => {
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown: '[a](/261020#%EA%B5%AC%EC%84%B1)' }, site)).toEqual([])
  })
})

describe('brokenInternalLinks 의 초안 글', () => {
  it('공개 글이 초안 글로 링크하면 문제로 낸다. 초안끼리는 괜찮다', () => {
    const site = { posts: new Map([['261020', { ko: new Set<string>() }], ['261021', { ko: new Set<string>(), draft: true }]]) }
    expect(brokenInternalLinks({ slug: '261020', locale: 'ko', markdown: '[a](/261021)' }, site)).toEqual(['/261021 → 초안 글'])
    expect(brokenInternalLinks({ slug: '261022', locale: 'ko', markdown: '[a](/261021)', draft: true }, site)).toEqual([])
  })
})

describe('messageKeyDiff', () => {
  it('한쪽에만 있는 키를 내고 $schema 는 뺀다', () => {
    expect(messageKeyDiff({ $schema: 'x', a: '', b: '' }, { a: '', c: '' })).toEqual({ onlyKo: ['b'], onlyEn: ['c'] })
  })
})

describe('collectContentProblems', () => {
  const ko = { title: '제목', description: '설명', body: '## 구성\n\n:term[프리렌더]{key="prerender"}\n', tags: ['meta'] }
  const base = { tagKeys: ['meta'], termKeys: ['prerender'] }

  it('문제가 없으면 빈 배열이다', () => {
    expect(collectContentProblems({ ...base, posts: [{ slug: '261020', ko }] })).toEqual([])
  })

  it('빠진 태그·용어, 깨진 링크, 낡은 번역, 구조 불일치를 글마다 모은다', () => {
    const problems = collectContentProblems({
      tagKeys: [],
      termKeys: [],
      posts: [{ slug: '261020', ko: { ...ko, body: `${ko.body}\n[x](/261099)\n` }, en: { body: '## Structure\n\n## Extra\n', sourceHash: 'old' } }],
    })
    expect(problems).toEqual([
      {
        slug: '261020',
        problems: [
          '태그 표시 이름 없음: meta',
          '용어집에 없는 :term: prerender',
          'ko 링크 /261099 → 없는 글',
          'en 번역이 낡았습니다 (pnpm content:rehash --post 261020 또는 /translate-post)',
          'en 구조: 헤딩 깊이가 다릅니다: ko [2] / en [2, 2]',
          'en 구조: 링크 목적지가 다릅니다: ko [/261099] / en []',
          'en 구조: :term key 가 다릅니다: ko [prerender] / en []',
        ],
      },
    ])
  })
})

describe('collectContentProblems 의 translation 옵션', () => {
  it('translation: false 면 낡은 번역과 구조 불일치는 빼고 본다 (audit 이 번역 검사에서 따로 본다)', () => {
    const problems = collectContentProblems(
      {
        tagKeys: ['meta'],
        termKeys: [],
        posts: [{ slug: '261020', ko: { title: 't', description: 'd', body: '## 구성\n', tags: ['meta'] }, en: { body: '## A\n## B\n', sourceHash: 'old' } }],
      },
      { translation: false },
    )
    expect(problems).toEqual([])
  })
})

describe('plainTextMarker', () => {
  it('인라인 문법이 없는 첫 순수 텍스트 문단을 고른다 (렌더된 HTML 에 그대로 나오는 글자)', () => {
    const markdown = '## 제목\n\n문장 안 ![이미지](./a.png) 입니다.\n\n`code` 가 있는 문단입니다 아주 길게요.\n\n본문은 미리 만들어 두고 서빙합니다.\n'
    expect(plainTextMarker(markdown)).toBe('본문은 미리 만들어 두고 서빙합니다.')
  })

  it('여러 줄 문단이면 한 줄만 고른다 (서버 번들의 JS 문자열 안에서는 줄바꿈이 \\n 으로 바뀐다)', () => {
    expect(plainTextMarker('예전 버전은 모두 비우고 다시 만들었습니다.\n이 글에는 고른 것을 적었습니다.\n')).toBe('예전 버전은 모두 비우고 다시 만들었습니다.')
  })

  it('HTML 에서 이스케이프되는 글자가 있거나 너무 짧은 문단은 고르지 않는다', () => {
    expect(plainTextMarker('짧음\n\nA & B 는 같지 않습니다 그렇죠\n')).toBeUndefined()
  })

  it('Callout·디렉티브 안 문단은 고르지 않는다 (렌더 때 글자가 바뀔 수 있다)', () => {
    expect(plainTextMarker('> [!TIP]\n> 처음 오셨다면 여기부터 보세요 그렇습니다\n')).toBeUndefined()
  })
})

describe('brokenBold', () => {
  it('볼드가 구두점으로 끝나고 바로 글자가 붙어 풀린 자리를 줄 번호와 함께 낸다', () => {
    expect(brokenBold('첫 줄\n\n**설정(config)**에서 바꿉니다.')).toEqual(['본문 3행 볼드가 풀림: **설정(config)**에서 바꿉니다.'])
    expect(brokenBold('**"저장"**을 누릅니다.')).toEqual(['본문 1행 볼드가 풀림: **"저장"**을 누릅니다.'])
  })

  it('제대로 걸린 볼드와 코드 안의 별표는 넘어간다', () => {
    expect(brokenBold('**설정**(config)에서, **저장**을 누릅니다.')).toEqual([])
    expect(brokenBold('`**a(b)**c` 는 코드입니다.\n\n```md\n**a(b)**c\n```')).toEqual([])
  })
})

describe('spellingWarnings', () => {
  it('영문·코드·링크 뒤에 띄어 쓴 조사를 낸다', () => {
    expect(spellingWarnings('JavaScript 에는 본문이 없습니다.\n`pnpm build` 를 돌리고 [TanStack Start](https://tanstack.com) 로 만듭니다.')).toEqual([
      '본문 1행 영문·코드 뒤 조사는 붙여 씁니다: "JavaScript 에는"',
      '본문 2행 영문·코드 뒤 조사는 붙여 씁니다: "`pnpm build` 를"',
      '본문 2행 영문·코드 뒤 조사는 붙여 씁니다: "Start 로"',
    ])
  })

  it('의존 명사 수·것·김에 를 붙여 쓴 곳을 낸다', () => {
    expect(spellingWarnings('할수 있고 볼수없습니다.\n\n하는것과 가는김에')).toEqual([
      '본문 1행 띄어 씁니다: "할수"',
      '본문 1행 띄어 씁니다: "볼수"',
      '본문 3행 띄어 씁니다: "하는것"',
      '본문 3행 띄어 씁니다: "가는김에"',
    ])
  })

  it('맞게 쓴 말과 코드 안의 글자는 넘어간다', () => {
    const ok = ['API 이름', '3 가지', '1 이상', 'D1은', '이것은', '날것', '고양이였다', '할 수 있다', '수수료']
    expect(spellingWarnings(ok.join('\n\n'))).toEqual([])
    expect(spellingWarnings('`할수 있다` 와\n\n```sh\necho JavaScript 에는\n```')).toEqual(['본문 1행 영문·코드 뒤 조사는 붙여 씁니다: "`할수 있다` 와"'])
  })
})

describe('collectContentWarnings', () => {
  it('ko 는 맞춤법과 볼드를, en 은 볼드만 보고 경고가 있는 글만 낸다', () => {
    const post = (slug: string, koBody: string, enBody?: string) => ({
      slug,
      ko: { title: 't', description: 'd', body: koBody, tags: [] },
      en: enBody === undefined ? undefined : { body: enBody, sourceHash: 'h' },
    })
    expect(
      collectContentWarnings([post('261020', 'D1 은 좋습니다.', '**bold(x)**s and D1 은'), post('261021', '괜찮은 글입니다.')]),
    ).toEqual([{ slug: '261020', warnings: ['ko 본문 1행 영문·코드 뒤 조사는 붙여 씁니다: "D1 은"', 'en 본문 1행 볼드가 풀림: **bold(x)**s and D1 은'] }])
  })
})
