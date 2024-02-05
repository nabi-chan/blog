export namespace Blog {
  export const lang = "ko";

  export const url = "https://nabi.kim";

  export const icon = "📝";
  export const title = (title?: string) => (title ? `${title}` : "🫠");
  export const description = "고양이의 작고 소중한 기술 블로그";
  export const keywords = [
    "nabi",
    "tech",
    "blog",
    "tech blog",
    "javascript",
    "typescript",
    "나비",
    "블로그",
    "기술 블로그",
    "자바스크립트",
    "타입스크립트",
  ];

  export const openGraph = {
    type: "blog",
    siteName: "Nabi's blog",
    image: "/og-image.png",
  };

  export const header = {
    title: "🐈",
    nav: [
      {
        icon: "🗂️",
        title: "posts",
        url: "/posts",
      },
    ],
  };

  export const footer = {
    githubUserName: "nabi-chan",
    links: [
      {
        title: "source",
        url: "https://github.com/nabi-chan/nabi-blog-2024",
      },
    ],
  };
}
