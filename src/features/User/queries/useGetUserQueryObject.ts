import { supabase } from '@/supabase/client'

export function useGetUserQueryObject() {
  return {
    queryKey: ['user'],
    queryFn: async () => {
      const response = await supabase.auth.getUser()
      return response.data.user
    },
  }
}
