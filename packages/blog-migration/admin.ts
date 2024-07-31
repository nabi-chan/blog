import GhostAdminAPI from '@tryghost/admin-api'

export const admin = new GhostAdminAPI({
  url: 'http://127.0.0.1:4000',
  key: process.env.GHOST_ADMIN_KEY!,
  version: 'v5.88',
})
