import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useToast } from '@channel.io/bezier-react'
import assert from 'assert'
import { supabase } from '@/supabase/client'

interface DeleteArticlePayload {
  articleId: string
}
export function useDeleteArticleMutation() {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ articleId }: DeleteArticlePayload) =>
      supabase
        .from('Article')
        .delete()
        .eq('id', articleId)
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
      addToast('성공적으로 삭제되었습니다.', { preset: 'success' })
    },
    onError: async () => {
      addToast('수정에 실패했습니다.', { preset: 'error' })
    },
  })
}
