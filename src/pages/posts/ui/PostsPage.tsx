import { type PostMeta, type TagRef, PostList } from '~/entities/post'
import { getLocale, m } from '~/shared/i18n'
import { TagFilter } from './TagFilter'

export function PostsPage({ posts, tags }: { posts: PostMeta[]; tags: TagRef[] }) {
  return (
    <main className="posts">
      <h1 className="display">{m.posts_title()}</h1>
      <TagFilter tags={tags} />
      {posts.length === 0 ? <p>{m.posts_empty()}</p> : <PostList posts={posts} locale={getLocale()} groupByYear />}
    </main>
  )
}
