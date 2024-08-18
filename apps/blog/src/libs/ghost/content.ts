import GhostContentAPI from '@tryghost/content-api'

export const content = new GhostContentAPI({
  url: process.env.GHOST_API_URL!,
  key: process.env.GHOST_CONTENT_KEY!,
  version: 'v5.88.2',
})
