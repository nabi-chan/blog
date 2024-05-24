import { useMutation } from '@tanstack/react-query'
import { useToast } from '@channel.io/bezier-react'
import axios from 'axios'
import assert from 'assert'
import { supabase } from '@/supabase/client'
import type { Tables } from '@/supabase/types'

interface DeletePagePayload {
  pageId: Tables<'CustomPage'>['id']
}
export function useDeletePageMutation() {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ pageId }: DeletePagePayload) =>
      supabase
        .from('CustomPage')
        .delete()
        .eq('id', pageId)
        .single()
        .throwOnError(),
    onSuccess: async (_, { pageId }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      assert(session?.access_token, 'session.access_token is undefined')
      await axios.patch<'ok'>('/api/page/invalidate', undefined, {
        params: {
          pageId,
        },
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
