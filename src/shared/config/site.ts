export const site = {
  name: 'eunsol',
  url: 'https://nabichan.me',
  author: 'eunsol (Nabi)',
  // 비어 있으면 푸터에 소셜 영역을 그리지 않는다. 웹 주소(https)는 JSON-LD Person 의 sameAs 에도 들어간다
  socials: [
    { label: 'GitHub', href: 'https://github.com/nabi-chan', icon: 'github' },
    { label: 'Email', href: 'mailto:hello@nabi.kim', icon: 'mail' },
  ] as Array<{ label: string; href: string; icon: string }>,
  // 네이버 서치어드바이저 인증 메타 값. 비어 있으면 메타를 그리지 않는다. Google Search Console 은 DNS(TXT)로 인증해서 메타가 없다
  verification: { naver: 'aff7241977aa801992711c3b21778767d1f2b4c5' },
  // IndexNow 키. 프로토콜상 공개 값이고 public/<키>.txt 로도 내보낸다
  indexNowKey: '9f1ce6ec8cb3f114ab17a28f740c5e84',
  // Content Signals (contentsignals.org). 검색·AI 답변 인용은 허용, 모델 학습은 거부 [은솔]. robots.txt 와 Markdown 응답 헤더에 쓴다
  contentSignal: 'search=yes, ai-input=yes, ai-train=no',
  // og:locale 값
  ogLocales: { ko: 'ko_KR', en: 'en_US' },
} as const
