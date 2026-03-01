import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Search, UserPlus, Users, Activity, Trophy,
    Check, X, Clock, Medal, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { User, Friendship, Session } from '../types'
import { getCategoryColor } from '../constants/categories'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'activity' | 'leaderboard'

interface FriendUser extends User {
    friendship_id: string
}

interface FeedItem {
    id: string
    friend: User
    session: Session
    insertedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
}

function formatMins(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}


function Avatar({ user, size = 'sm' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
    const s = size === 'lg' ? 'w-12 h-12 text-base' : size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'
    if (user.avatar_url) {
        return <img src={user.avatar_url} alt={user.full_name ?? ''} className={`${s} rounded-full object-cover shrink-0`} />
    }
    const initials = (user.full_name ?? user.email).slice(0, 2).toUpperCase()
    return (
        <div className={`${s} rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0`}>
            {initials}
        </div>
    )
}

function getTodayString() {
    return new Date().toISOString().split('T')[0]
}

function getWeekStart() {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now)
    monday.setDate(diff)
    return monday.toISOString().split('T')[0]
}

// ─── Friends Tab (Task 025) ───────────────────────────────────────────────────

function FriendsTab() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [searchEmail, setSearchEmail] = useState('')
    const [searchResult, setSearchResult] = useState<User | null | 'not-found'>(null)
    const [searching, setSearching] = useState(false)

    // ── Data queries ──────────────────────────────────────────────────────────

    // Pending incoming requests
    const { data: pendingRequests = [] } = useQuery({
        queryKey: ['friendships', 'pending', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('friendships')
                .select('id, requester_id, status')
                .eq('addressee_id', user!.id)
                .eq('status', 'Pending')
            if (error) throw error
            if (!data || data.length === 0) return [] as (Friendship & { requesterProfile: User })[]

            const requesterIds = data.map((f) => f.requester_id)
            const { data: profiles } = await supabase
                .from('users')
                .select('*')
                .in('id', requesterIds)

            return data.map((f) => ({
                ...f,
                requesterProfile: profiles?.find((p) => p.id === f.requester_id) ?? null,
            })) as (Friendship & { requesterProfile: User })[]
        },
        enabled: !!user,
    })

    // Accepted friends
    const { data: friends = [] } = useQuery({
        queryKey: ['friendships', 'accepted', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('friendships')
                .select('id, requester_id, addressee_id, status')
                .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
                .eq('status', 'Accepted')
            if (error) throw error
            if (!data || data.length === 0) return [] as FriendUser[]

            const friendIds = data.map((f) =>
                f.requester_id === user!.id ? f.addressee_id : f.requester_id,
            )
            const { data: profiles } = await supabase
                .from('users')
                .select('*')
                .in('id', friendIds)

            return (profiles ?? []).map((p) => ({
                ...p,
                friendship_id: data.find((f) =>
                    f.requester_id === p.id || f.addressee_id === p.id,
                )?.id ?? '',
            })) as FriendUser[]
        },
        enabled: !!user,
    })

    // ── Mutations ─────────────────────────────────────────────────────────────

    const { mutate: sendRequest } = useMutation({
        mutationFn: async (addresseeId: string) => {
            const { error } = await supabase
                .from('friendships')
                .insert({ requester_id: user!.id, addressee_id: addresseeId })
            if (error) throw error
        },
        onSuccess: () => {
            toast.success('Friend request sent!')
            setSearchEmail('')
            setSearchResult(null)
            queryClient.invalidateQueries({ queryKey: ['friendships'] })
        },
        onError: () => toast.error('Request failed — already sent?'),
    })

    const { mutate: respondRequest } = useMutation({
        mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
            const { error } = await supabase
                .from('friendships')
                .update({ status: accept ? 'Accepted' : 'Rejected' })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: (_, vars) => {
            toast.success(vars.accept ? 'Friend accepted!' : 'Request rejected')
            queryClient.invalidateQueries({ queryKey: ['friendships'] })
        },
        onError: () => toast.error('Failed to respond'),
    })

    // ── Search ────────────────────────────────────────────────────────────────

    async function handleSearch() {
        if (!searchEmail.trim()) return
        setSearching(true)
        setSearchResult(null)
        const { data } = await supabase
            .from('users')
            .select('*')
            .ilike('email', searchEmail.trim())
            .neq('id', user!.id)
            .limit(1)
        setSearching(false)
        if (data && data.length > 0) {
            setSearchResult(data[0] as User)
        } else {
            setSearchResult('not-found')
        }
    }

    const isFriendWith = (uid: string) =>
        friends.some((f) => f.id === uid)

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8">
            {/* Search & Add */}
            <section>
                <h2 className="text-base font-semibold text-white mb-3">Find a Friend</h2>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="email"
                            placeholder="Search by email address…"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-white/[0.04] border border-white/8 focus:border-primary/60 outline-none rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-muted/50 transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {searching ? 'Searching…' : 'Search'}
                    </button>
                </div>

                {/* Search result */}
                {searchResult === 'not-found' && (
                    <p className="text-muted text-sm mt-3">No user found with that email.</p>
                )}
                {searchResult && searchResult !== 'not-found' && (
                    <div className="mt-3 flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
                        <Avatar user={searchResult} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{searchResult.full_name ?? searchResult.email}</p>
                            <p className="text-muted text-xs truncate">{searchResult.email}</p>
                        </div>
                        {isFriendWith(searchResult.id) ? (
                            <span className="text-xs text-projects flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Friends</span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => sendRequest(searchResult.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Send Request
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <section>
                    <h2 className="text-base font-semibold text-white mb-3">
                        Pending Requests
                        <span className="ml-2 text-xs bg-college/20 text-college px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    </h2>
                    <div className="space-y-2">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
                                <Avatar user={req.requesterProfile} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">
                                        {req.requesterProfile?.full_name ?? req.requesterProfile?.email ?? 'Unknown'}
                                    </p>
                                    <p className="text-muted text-xs">Wants to connect</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => respondRequest({ id: req.id, accept: true })}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-projects/15 hover:bg-projects/25 text-projects text-xs font-medium rounded-xl transition-colors cursor-pointer"
                                    >
                                        <Check className="w-3.5 h-3.5" /> Accept
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => respondRequest({ id: req.id, accept: false })}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Friends List */}
            <section>
                <h2 className="text-base font-semibold text-white mb-3">
                    Your Friends
                    {friends.length > 0 && <span className="ml-2 text-muted text-sm font-normal">({friends.length})</span>}
                </h2>
                {friends.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-10 text-center">
                        <Users className="w-8 h-8 text-muted/20 mx-auto mb-3" />
                        <p className="text-white text-sm">No friends yet</p>
                        <p className="text-muted text-xs mt-1">Search for friends by email above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {friends.map((friend) => (
                            <div key={friend.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
                                <Avatar user={friend} size="md" />
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{friend.full_name ?? friend.email}</p>
                                    <p className="text-muted text-xs">
                                        {friend.college ? `${friend.college}` : friend.email}
                                        {friend.year ? ` · Year ${friend.year}` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

// ─── Activity Feed Tab (Task 026) ─────────────────────────────────────────────

function ActivityTab() {
    const { user } = useAuth()
    // Only stores items pushed via Realtime — initial data comes straight from the query
    const [realtimeItems, setRealtimeItems] = useState<FeedItem[]>([])
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Get accepted friend IDs
    const { data: friendIds = [] } = useQuery({
        queryKey: ['friend-ids', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('friendships')
                .select('requester_id, addressee_id')
                .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
                .eq('status', 'Accepted')
            return (data ?? []).map((f) =>
                f.requester_id === user!.id ? f.addressee_id : f.requester_id,
            )
        },
        enabled: !!user,
    })

    // Initial feed data: today's sessions from friends (non-hidden)
    const { data: queryFeed, isLoading } = useQuery({
        queryKey: ['friend-activity', user?.id, friendIds],
        queryFn: async () => {
            if (friendIds.length === 0) return [] as FeedItem[]
            const today = getTodayString()

            const { data: sessions } = await supabase
                .from('sessions')
                .select('*')
                .in('user_id', friendIds)
                .eq('date', today)
                .order('created_at', { ascending: false })

            if (!sessions || sessions.length === 0) return [] as FeedItem[]

            const { data: profiles } = await supabase
                .from('users')
                .select('*')
                .in('id', friendIds)
                .eq('hide_from_friends', false)

            const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

            return sessions
                .filter((s) => profileMap[s.user_id])
                .map((s) => ({
                    id: s.id,
                    friend: profileMap[s.user_id] as User,
                    session: s as Session,
                    insertedAt: s.created_at ?? new Date().toISOString(),
                }))
        },
        enabled: friendIds.length > 0,
    })

    // Merge realtime items on top of query data (deduplicated by id)
    const feedItems: FeedItem[] = [
        ...realtimeItems,
        ...(queryFeed ?? []),
    ].filter((item, idx, arr) => arr.findIndex((i) => i.id === item.id) === idx)

    // Stable string key so the effect only re-runs when the actual IDs change
    const friendIdsKey = friendIds.join(',')

    // Supabase Realtime subscription
    useEffect(() => {
        if (!user || !friendIdsKey) return

        const channel = supabase
            .channel(`friend-sessions:${user.id}`)  // user-scoped to avoid cross-tab lock conflicts
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sessions' },
                async (payload) => {
                    const newSession = payload.new as Session
                    if (!friendIds.includes(newSession.user_id)) return

                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', newSession.user_id)
                        .eq('hide_from_friends', false)
                        .single()

                    if (!profile) return

                    const item: FeedItem = {
                        id: newSession.id,
                        friend: profile as User,
                        session: newSession,
                        insertedAt: newSession.created_at ?? new Date().toISOString(),
                    }
                    setRealtimeItems((prev) => [item, ...prev])
                    toast(`${profile.full_name ?? profile.email} logged a session!`, { icon: '📚' })
                },
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            channel.unsubscribe()
        }
    }, [user, friendIdsKey])  // stable string, not array reference

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 animate-pulse">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/10 rounded w-3/4" />
                                <div className="h-2.5 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (feedItems.length === 0) {
        return (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-14 text-center">
                <Activity className="w-8 h-8 text-muted/20 mx-auto mb-3" />
                <p className="text-white text-sm font-medium">No activity yet today</p>
                <p className="text-muted text-xs mt-1">Your friends' sessions will appear here in real-time.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {feedItems.map((item) => {
                const catColor = getCategoryColor(item.session.category)
                const dur = item.session.duration_minutes ?? 0
                return (
                    <div key={item.id} className="flex items-start gap-3 bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl px-4 py-3.5 transition-colors">
                        <Avatar user={item.friend} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm leading-snug">
                                <span className="font-medium">{item.friend.full_name ?? item.friend.email}</span>
                                {' '}logged{' '}
                                <span className="font-medium" style={{ color: catColor }}>{formatMins(dur)}</span>
                                {' '}on{' '}
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                                >
                                    {item.session.category}
                                </span>
                            </p>
                            <p className="text-white/60 text-xs mt-1 truncate">"{item.session.title}"</p>
                        </div>
                        <span className="text-muted/50 text-xs shrink-0 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{timeAgo(item.insertedAt)}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Leaderboard Tab (Task 027) ─────────────────────────────────────────────

function LeaderboardTab() {
    const { user } = useAuth()

    // Get accepted friend IDs
    const { data: friendIds = [] } = useQuery({
        queryKey: ['friend-ids', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('friendships')
                .select('requester_id, addressee_id')
                .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
                .eq('status', 'Accepted')
            return (data ?? []).map((f) =>
                f.requester_id === user!.id ? f.addressee_id : f.requester_id,
            )
        },
        enabled: !!user,
    })

    // All users to rank: current user + friends
    const allIds = [...friendIds, user?.id ?? ''].filter(Boolean)

    const { data: leaderboard = [], isLoading } = useQuery({
        queryKey: ['leaderboard', user?.id, friendIds],
        queryFn: async () => {
            const weekStart = getWeekStart()
            const today = getTodayString()

            // Get this week's sessions for all users
            const { data: sessions } = await supabase
                .from('sessions')
                .select('user_id, duration_minutes')
                .in('user_id', allIds)
                .gte('date', weekStart)
                .lte('date', today)

            // Get profiles
            const { data: profiles } = await supabase
                .from('users')
                .select('id, full_name, email, avatar_url, college, year')
                .in('id', allIds)

            // Aggregate minutes per user
            const minuteMap: Record<string, number> = {}
            for (const s of sessions ?? []) {
                minuteMap[s.user_id] = (minuteMap[s.user_id] ?? 0) + (s.duration_minutes ?? 0)
            }

            return (profiles ?? [])
                .map((p) => ({ ...p, totalMins: minuteMap[p.id] ?? 0 }))
                .sort((a, b) => b.totalMins - a.totalMins)
        },
        enabled: allIds.length > 0,
    })

    const maxMins = leaderboard[0]?.totalMins ?? 1

    const RANK_ICONS: Record<number, { icon: string; class: string }> = {
        1: { icon: '🥇', class: 'text-yellow-400' },
        2: { icon: '🥈', class: 'text-slate-300' },
        3: { icon: '🥉', class: 'text-amber-600' },
    }

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white/10 rounded" />
                            <div className="w-8 h-8 bg-white/10 rounded-full" />
                            <div className="flex-1 h-3 bg-white/10 rounded" />
                            <div className="w-12 h-3 bg-white/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (leaderboard.length === 0 || leaderboard.every((u) => u.totalMins === 0)) {
        return (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-14 text-center">
                <Trophy className="w-8 h-8 text-muted/20 mx-auto mb-3" />
                <p className="text-white text-sm font-medium">No sessions this week yet</p>
                <p className="text-muted text-xs mt-1">Log sessions to climb the leaderboard.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {leaderboard.map((u, idx) => {
                const rank = idx + 1
                const isMe = u.id === user?.id
                const pct = maxMins > 0 ? Math.round((u.totalMins / maxMins) * 100) : 0
                const rankInfo = RANK_ICONS[rank]
                const userProfile: User = { ...u } as unknown as User

                return (
                    <div
                        key={u.id}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-colors ${isMe
                            ? 'bg-primary/8 border-primary/20'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                            }`}
                    >
                        {/* Rank */}
                        <div className="w-7 text-center shrink-0">
                            {rankInfo ? (
                                <span className="text-lg">{rankInfo.icon}</span>
                            ) : (
                                <span className="text-muted text-sm font-bold">#{rank}</span>
                            )}
                        </div>

                        {/* Avatar */}
                        <Avatar user={userProfile} size="sm" />

                        {/* Name + bar */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-white'}`}>
                                    {u.full_name ?? u.email}
                                    {isMe && <span className="ml-1.5 text-xs text-primary/70">(you)</span>}
                                </p>
                            </div>
                            {/* Mini bar */}
                            <div className="h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isMe ? 'bg-primary' : 'bg-white/20'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>

                        {/* Total time */}
                        <span className={`text-sm font-semibold shrink-0 ${isMe ? 'text-primary' : 'text-white'}`}>
                            {u.totalMins > 0 ? formatMins(u.totalMins) : <span className="text-muted text-xs">—</span>}
                        </span>
                    </div>
                )
            })}
            <p className="text-muted/40 text-xs text-center pt-2">This week's total study time</p>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FriendsPage() {
    const [tab, setTab] = useState<Tab>('friends')

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
        { id: 'leaderboard', label: 'Leaderboard', icon: <Medal className="w-4 h-4" /> },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Friends</h1>
                <p className="text-muted text-sm mt-1">Connect, follow activity, and compete on the leaderboard.</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-white/[0.04] border border-white/5 rounded-2xl p-1">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${tab === t.id
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-muted hover:text-white'
                            }`}
                    >
                        {t.icon}
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'friends' && <FriendsTab />}
            {tab === 'activity' && <ActivityTab />}
            {tab === 'leaderboard' && <LeaderboardTab />}
        </div>
    )
}
