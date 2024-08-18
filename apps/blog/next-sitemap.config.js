/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: process.env.HOMEPAGE_URL ?? 'https://nabi.kim',
  generateRobotsTxt: true,
  exclude: ['/ghost-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [
      (process.env.HOMEPAGE_URL ?? 'https://nabi.kim') + '/ghost-sitemap.xml',
    ],
  },
}
