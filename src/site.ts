export const site = {
  name: 'eunsol',
  url: 'https://nabichan.me',
  author: 'eunsol (Nabi)',
  license: { name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
  // 정해지면 채운다. 비어 있으면 푸터에 소셜 영역을 그리지 않는다
  socials: [] as Array<{ label: string; href: string; icon: string }>,
} as const
