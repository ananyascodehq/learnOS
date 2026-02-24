import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Session } from '../types'
import type { SessionFilters } from '../types/filters'
import type { Database } from '../types/database.types'

type SessionUpdate = Database['public']['Tables']['sessions']['Update']

const PAGE_SIZE = 20

function getTodayString(): string {
    return new Date().toISOString().split('T')[0]
}

function getWeekStart(): string {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const monday = new Date(now)
    monday.setDate(diff)
    return monday.toISOString().split('T')[0]
}

function getMonthStart(): string {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

export function useSessionsToday(): UseQueryResult<Session[]> {
    const { user } = useAuth()
    const today = getTodayString()

    return useQuery({
        queryKey: ['sessions', 'today', user?.id, today],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .eq('date', today)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!user,
    })
}

export function useSessionsThisWeek(): UseQueryResult<Session[]> {
    const { user } = useAuth()
    const weekStart = getWeekStart()
    const today = getTodayString()

    return useQuery({
        queryKey: ['sessions', 'week', user?.id, weekStart],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .gte('date', weekStart)
                .lte('date', today)
                .order('date', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!user,
    })
}

export function useSessionsThisMonth(): UseQueryResult<Session[]> {
    const { user } = useAuth()
    const monthStart = getMonthStart()
    const today = getTodayString()

    return useQuery({
        queryKey: ['sessions', 'month', user?.id, monthStart],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .gte('date', monthStart)
                .lte('date', today)
                .order('date', { ascending: false })

            if (error) throw error
            return data
        },
        enabled: !!user,
    })
}

export function useAllSessions(filters: SessionFilters): UseQueryResult<Session[]> {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['sessions', 'all', user?.id, filters],
        queryFn: async () => {
            let query = supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .order('date', { ascending: false })

            if (filters.categories && filters.categories.length > 0) {
                query = query.in('category', filters.categories)
            }
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters.wasUseful !== undefined && filters.wasUseful !== null) {
                query = query.eq('was_useful', filters.wasUseful)
            }
            if (filters.dateFrom) {
                query = query.gte('date', filters.dateFrom)
            }
            if (filters.dateTo) {
                query = query.lte('date', filters.dateTo)
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,what_i_did.ilike.%${filters.search}%`)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
        enabled: !!user,
    })
}

export function useStreak(): UseQueryResult<number> {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['streak', user?.id],
        queryFn: async () => {
            // Fetch all distinct session dates, ordered descending
            const { data, error } = await supabase
                .from('sessions')
                .select('date')
                .eq('user_id', user!.id)
                .order('date', { ascending: false })

            if (error) throw error
            if (!data || data.length === 0) return 0

            // Deduplicate dates
            const uniqueDates = [...new Set(data.map((s) => s.date))].sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime()
            )

            // Count consecutive days from today/yesterday
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let streak = 0
            let checkDate = new Date(today)

            // Allow starting from today or yesterday
            const firstDate = new Date(uniqueDates[0])
            firstDate.setHours(0, 0, 0, 0)

            const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
            if (diffFromToday > 1) return 0 // Streak broken

            if (diffFromToday === 1) {
                // Most recent session was yesterday, start checking from yesterday
                checkDate.setDate(checkDate.getDate() - 1)
            }

            for (const dateStr of uniqueDates) {
                const d = new Date(dateStr)
                d.setHours(0, 0, 0, 0)

                if (d.getTime() === checkDate.getTime()) {
                    streak++
                    checkDate.setDate(checkDate.getDate() - 1)
                } else if (d.getTime() < checkDate.getTime()) {
                    break
                }
            }

            return streak
        },
        enabled: !!user,
    })
}

// ---------------------------------------------------------------------------
// Infinite / paginated sessions (for History page)
// ---------------------------------------------------------------------------

export type InfiniteSessionsResult = UseInfiniteQueryResult<InfiniteData<Session[]>>

export function useInfiniteSessions(filters: SessionFilters): InfiniteSessionsResult {
    const { user } = useAuth()

    return useInfiniteQuery({
        queryKey: ['sessions', 'infinite', user?.id, filters],
        queryFn: async ({ pageParam = 0 }) => {
            const from = (pageParam as number) * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            let query = supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .range(from, to)

            if (filters.categories && filters.categories.length > 0) {
                query = query.in('category', filters.categories)
            }
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters.wasUseful !== undefined && filters.wasUseful !== null) {
                query = query.eq('was_useful', filters.wasUseful)
            }
            if (filters.dateFrom) {
                query = query.gte('date', filters.dateFrom)
            }
            if (filters.dateTo) {
                query = query.lte('date', filters.dateTo)
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,what_i_did.ilike.%${filters.search}%`)
            }

            const { data, error } = await query
            if (error) throw error
            return (data ?? []) as Session[]
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            // If the last page returned a full page, there may be more
            if (lastPage.length === PAGE_SIZE) {
                return allPages.length
            }
            return undefined
        },
        enabled: !!user,
    })
}

// ---------------------------------------------------------------------------
// Delete session mutation
// ---------------------------------------------------------------------------

export function useDeleteSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['streak'] })
        },
    })
}

// ---------------------------------------------------------------------------
// Update session mutation (for edit)
// ---------------------------------------------------------------------------

export function useUpdateSession() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: SessionUpdate }) => {
            const { error } = await supabase.from('sessions').update(updates).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })
}
