import { useMutation } from '@tanstack/react-query'
import { merge } from 'immutable'
import axios from 'axios'
import { useToast } from '@channel.io/bezier-react'
import assert from 'assert'
import { supabase } from '@/supabase/client'
import type { Tables } from '@/supabase/types'

interface UpdateArticlePayload {
  articleId: string
  article: Partial<Omit<Tables<'Article'>, 'id' | 'created_at' | 'updated_at'>>
}
export function useUpdateArticleMutation() {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ article, articleId }: UpdateArticlePayload) =>
      supabase
        .from('Article')
        .update(merge(article, { updated_at: new Date() }))
        .eq('id', articleId)
        .select('id')
        .single()
        .throwOnError(),
    onSuccess: async (_, { articleId }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      assert(session?.access_token, 'session.access_token is undefined')
      await axios.patch<'ok'>('/api/blog/invalidate', undefined, {
        params: { 'post-id': articleId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      addToast('성공적으로 수정되었습니다.', { preset: 'success' })
    },
    onError: async () => {
      addToast('수정에 실패했습니다.', { preset: 'error' })
    },
  })
}
