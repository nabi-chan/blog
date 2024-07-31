import GhostContentAPI from '@tryghost/content-api'

export const content = new GhostContentAPI({
  url: 'http://127.0.0.1:4000',
  key: process.env.GHOST_CONTENT_KEY!,
  version: 'v5.88',
})
