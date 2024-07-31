declare module '@tryghost/admin-api' {
  export type AdminAPIOptions = {
    url: string
    key: string
    version: string
    ghostPath?: string
    userAgent?: string
  }

  export type GhostFunction<R, P extends Partial<R> = R> = {
    add: (payload: P) => Promise<R>
    edit: (payload: P) => Promise<R>
    del: (payload: P) => Promise<R>
    browse: (payload: P) => Promise<R>
    read: (payload: P) => Promise<R>
  }

  export default class GhostAdminAPI {
    constructor(options: AdminAPIOptions)

    posts: GhostFunction<unknown>

    pages: GhostFunction<unknown>

    tags: GhostFunction<unknown>

    webhooks: GhostFunction<unknown>

    members: GhostFunction<unknown>

    users: GhostFunction<unknown>

    newsletters: GhostFunction<unknown>
  }
}
