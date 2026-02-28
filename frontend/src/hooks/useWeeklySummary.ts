import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useWeeklySummary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['weekly_summary', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single()
      if (error && error.code !== 'PGRST116') throw error // ignore no rows
      return data
    },
    enabled: !!user,
  })
}
