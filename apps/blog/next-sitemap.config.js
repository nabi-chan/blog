/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: 'https://nabi-blog.vercel.app',
  generateRobotsTxt: true,
  exclude: ['/ghost-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: ['https://nabi-blog.vercel.app/ghost-sitemap.xml'],
  },
}
