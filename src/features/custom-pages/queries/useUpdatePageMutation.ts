import { useMutation } from '@tanstack/react-query'
import { merge } from 'immutable'
import { useToast } from '@channel.io/bezier-react'
import { supabase } from '@/supabase/client'
import type { Tables } from '@/supabase/types'

interface UpdatePagePayload {
  pageId: Tables<'CustomPage'>['id']
  page: Partial<Omit<Tables<'CustomPage'>, 'id' | 'created_at' | 'updated_at'>>
}
export function useUpdatePageMutation() {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: async ({ page, pageId }: UpdatePagePayload) =>
      supabase
        .from('CustomPage')
        .update(merge(page, { updated_at: new Date() }))
        .eq('id', pageId)
        .select('id')
        .single()
        .throwOnError(),
    onSuccess: async () => {
      addToast('성공적으로 수정되었습니다.', { preset: 'success' })
    },
    onError: async () => {
      addToast('수정에 실패했습니다.', { preset: 'error' })
    },
  })
}
