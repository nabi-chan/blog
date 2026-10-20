export const site = {
  name: 'eunsol',
  url: 'https://nabichan.me',
  author: 'eunsol (Nabi)',
  // 정해지면 채운다. 비어 있으면 푸터에 소셜 영역을 그리지 않는다
  socials: [] as Array<{ label: string; href: string; icon: string }>,
  // 검색엔진 사이트 인증 값. 비어 있으면 메타를 그리지 않는다 (스펙 4.9: 자리만 둔다)
  verification: { google: '', naver: '' },
  // IndexNow 키. 프로토콜상 공개 값이고 public/<키>.txt 로도 내보낸다
  indexNowKey: '9f1ce6ec8cb3f114ab17a28f740c5e84',
  // og:locale 값
  ogLocales: { ko: 'ko_KR', en: 'en_US' },
} as const
