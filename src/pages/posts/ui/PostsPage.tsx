import { type CategoryRef, type PostMeta, PostList } from '~/entities/post'
import { getLocale, m } from '~/shared/i18n'
import { CategoryFilter } from './CategoryFilter'

export function PostsPage({ posts, categories }: { posts: PostMeta[]; categories: CategoryRef[] }) {
  return (
    <main className="posts">
      <h1 className="display">{m.posts_title()}</h1>
      <CategoryFilter categories={categories} />
      {posts.length === 0 ? <p>{m.posts_empty()}</p> : <PostList posts={posts} locale={getLocale()} />}
    </main>
  )
}
