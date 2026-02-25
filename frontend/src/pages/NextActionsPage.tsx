
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Calendar, ArrowRight, ClipboardList, AlertCircle, Clock3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCategoryColor } from '../constants/categories'
import type { Session } from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    })
}

/** Days until due_date (negative = overdue) */
function daysUntil(dueDateStr: string): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDateStr)
    due.setHours(0, 0, 0, 0)
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyStyle(days: number): { pillClass: string; label: string } {
    if (days < 0) return { pillClass: 'bg-red-500/15 text-red-400 border border-red-500/20', label: `${Math.abs(days)}d overdue` }
    if (days === 0) return { pillClass: 'bg-red-500/15 text-red-400 border border-red-500/20', label: 'Due today' }
    if (days <= 3) return { pillClass: 'bg-college/15 text-college border border-college/20', label: `${days}d left` }
    return { pillClass: 'bg-projects/15 text-projects border border-projects/20', label: `${days}d left` }
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-16 h-5 bg-white/10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
                <div className="w-20 h-7 bg-white/10 rounded-xl shrink-0" />
            </div>
        </div>
    )
}

// ─── Next Actions Section ────────────────────────────────────────────────────

function NextActionsSection() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: actions = [], isLoading } = useQuery({
        queryKey: ['next-actions', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .not('next_action', 'is', null)
                .eq('next_action_done', false)
                .order('created_at', { ascending: false })
            if (error) throw error
            return (data ?? []) as Session[]
        },
        enabled: !!user,
    })

    const { mutate: markDone, isPending } = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('sessions')
                .update({ next_action_done: true })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['next-actions', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            toast.success('Marked as done!')
        },
        onError: () => toast.error('Failed to update'),
    })

    return (
        <section>
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Pending Next Actions</h2>
                    {!isLoading && (
                        <p className="text-muted text-xs mt-0.5">
                            {actions.length === 0 ? 'All caught up!' : `${actions.length} item${actions.length !== 1 ? 's' : ''} to follow up on`}
                        </p>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                </div>
            ) : actions.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-10 text-center">
                    <CheckCheck className="w-8 h-8 text-projects/40 mx-auto mb-3" />
                    <p className="text-white text-sm font-medium">Nothing pending</p>
                    <p className="text-muted text-xs mt-1">When you add a "Next Action" to a session it'll appear here.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {actions.map((session) => {
                        const catColor = getCategoryColor(session.category)
                        return (
                            <div
                                key={session.id}
                                className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-4 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-150"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Category chip */}
                                    <span
                                        className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium mt-0.5"
                                        style={{ backgroundColor: `${catColor} 18`, color: catColor }}
                                    >
                                        {session.category}
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{session.title}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                                            <p className="text-white/70 text-xs leading-snug">{session.next_action}</p>
                                        </div>
                                        <p className="text-muted/60 text-xs mt-1.5 flex items-center gap-1">
                                            <Clock3 className="w-3 h-3" />
                                            Logged {formatDate(session.date)}
                                        </p>
                                    </div>

                                    {/* Mark Done button */}
                                    <button
                                        type="button"
                                        onClick={() => markDone(session.id)}
                                        disabled={isPending}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-projects/10 hover:bg-projects/20 text-projects text-xs font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark Done
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

// ─── Deadlines Section ───────────────────────────────────────────────────────

const WORK_TYPE_COLORS: Record<string, string> = {
    Record: 'bg-primary/15 text-primary',
    Observation: 'bg-learning/15 text-learning',
    Assignment: 'bg-college/15 text-college',
}

function DeadlinesSection() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: deadlines = [], isLoading } = useQuery({
        queryKey: ['deadlines', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', user!.id)
                .not('due_date', 'is', null)
                .eq('deadline_submitted', false)
                .order('due_date', { ascending: true })
            if (error) throw error
            return (data ?? []) as Session[]
        },
        enabled: !!user,
    })

    const { mutate: markSubmitted, isPending } = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('sessions')
                .update({ deadline_submitted: true })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deadlines', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            toast.success('Marked as submitted!')
        },
        onError: () => toast.error('Failed to update'),
    })

    return (
        <section>
            <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-college/15 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-college" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Upcoming Deadlines</h2>
                    {!isLoading && (
                        <p className="text-muted text-xs mt-0.5">
                            {deadlines.length === 0 ? 'No pending deadlines' : `${deadlines.length} deadline${deadlines.length !== 1 ? 's' : ''} pending`}
                        </p>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2].map((i) => <SkeletonRow key={i} />)}
                </div>
            ) : deadlines.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-10 text-center">
                    <ClipboardList className="w-8 h-8 text-college/30 mx-auto mb-3" />
                    <p className="text-white text-sm font-medium">No upcoming deadlines</p>
                    <p className="text-muted text-xs mt-1">Deadlines from College Work sessions will appear here.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {deadlines.map((session) => {
                        const days = daysUntil(session.due_date!)
                        const { pillClass, label } = urgencyStyle(days)
                        const workTypeClass = session.college_work_type
                            ? WORK_TYPE_COLORS[session.college_work_type] ?? 'bg-muted/15 text-muted'
                            : 'bg-muted/15 text-muted'

                        return (
                            <div
                                key={session.id}
                                className={`border rounded - 2xl px - 4 py - 4 transition - all duration - 150 ${days < 0
                                        ? 'bg-red-500/5 border-red-500/15 hover:bg-red-500/8'
                                        : days <= 3
                                            ? 'bg-college/5 border-college/15 hover:bg-college/8'
                                            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                                    } `}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Work type badge */}
                                    {session.college_work_type && (
                                        <span className={`shrink - 0 text - xs px - 2.5 py - 1 rounded - full font - medium mt - 0.5 ${workTypeClass} `}>
                                            {session.college_work_type}
                                        </span>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{session.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="flex items-center gap-1 text-muted text-xs">
                                                <Calendar className="w-3 h-3" />
                                                Due {formatDate(session.due_date!)}
                                            </span>
                                            <span className={`text - xs px - 2 py - 0.5 rounded - full font - medium ${pillClass} `}>
                                                {days < 0 ? <AlertCircle className="w-3 h-3 inline mr-1" /> : null}
                                                {label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mark Submitted button */}
                                    <button
                                        type="button"
                                        onClick={() => markSubmitted(session.id)}
                                        disabled={isPending}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark Submitted
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NextActionsPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-white">Next Actions</h1>
                <p className="text-muted text-sm mt-1">Track your follow-ups and upcoming College Work deadlines.</p>
            </div>

            <NextActionsSection />
            <DeadlinesSection />
        </div>
    )
}
