import assert from 'assert'
import { supabase } from './server'
import { admin } from './admin'

export async function migration(uuid: string) {
  assert(typeof uuid === 'string', `uuid is not a string, got ${typeof uuid}`)

  const { data: post } = await supabase
    .from('Article')
    .select('*')
    .eq('id', uuid)
    .single()
    .throwOnError()
  assert(post !== null, 'post is not found')

  await admin.posts.add({
    title: post.title,
    excerpt: post.description,
    slug: post.id,
    status: 'published',
    created_at: post.created_at,
    tags: [
      {
        slug: post.category?.toLowerCase(),
      },
      {
        slug: 'migrated',
      },
    ],
    updated_at: new Date(post.updated_at),
    published_at: new Date(post.updated_at),
    lexical: JSON.stringify({
      root: {
        children: [
          {
            type: 'markdown',
            version: 1,
            markdown: post.content,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }),
  })
}
