import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useWeeklySummary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly_summary', user?.id],
    queryFn: async (): Promise<{ summary: string, week_start: string, user_id: string } | null> => {
      if (!user) return null
      const { data, error } = await (supabase as any)
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single()
      if (error && error.code !== 'PGRST116') throw error // ignore no rows
      return data as any
    },
    enabled: !!user,
  })
}
