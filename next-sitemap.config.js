/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: 'https://nabi-blog.vercel.app',
  exclude: ['/nabi', '/nabi/*'],
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/nabi', '/nabi/*'],
      },
    ],
  },
}
