export namespace Blog {
  export const lang = 'ko';

  export const url = process.env.NEXT_PUBLIC_WEBSITE_URL;

  export const icon = '📝';
  export const title = (title?: string) => (title ? `${title}` : '🫠');
  export const description = '고양이의 작고 소중한 기술 블로그';
  export const keywords = [
    'nabi',
    'tech',
    'blog',
    'tech blog',
    'javascript',
    'typescript',
    '나비',
    '블로그',
    '기술 블로그',
    '자바스크립트',
    '타입스크립트',
  ];

  export const openGraph = {
    type: 'blog',
    siteName: "Nabi's blog",
    image: `${url}/api/blog-card`,
  };

  export const header = {
    title: '🐈',
    nav: [
      {
        title: '블로그',
        url: '/posts',
      },
      {
        title: '정보',
        url: '/cv',
      },
    ],
  };

  export const footer = {
    githubUserName: 'nabi-chan',
    links: [
      {
        title: 'source',
        url: 'https://github.com/nabi-chan/nabi-blog-2024',
      },
    ],
  };

  export const channelPluginKey = '779e5020-caa6-4dcb-8abc-09f818957a0c';
}
