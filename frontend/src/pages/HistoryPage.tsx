import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle,
    Clock, Calendar, Trash2, Pencil, X, AlertTriangle, BookOpen,
    ArrowRight, Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CATEGORIES } from '../constants/categories'
import { useInfiniteSessions, useDeleteSession } from '../hooks/useSessions'
import type { SessionFilters } from '../types/filters'
import type { Session } from '../types'
import type { CategoryType, SessionStatus } from '../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(mins: number | null): string {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
}

function getCategoryColor(cat: string): string {
    return CATEGORIES.find((c) => c.value === cat)?.color ?? '#6B7280'
}

const STATUS_OPTIONS: { label: string; value: SessionStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Paused', value: 'Paused' },
]

const USEFUL_OPTIONS = [
    { label: 'All', value: 'all' as const },
    { label: 'Useful', value: 'yes' as const },
    { label: 'Not Useful', value: 'no' as const },
]

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

interface DeleteDialogProps {
    session: Session
    onConfirm: () => void
    onCancel: () => void
    isDeleting: boolean
}

function DeleteDialog({ session, onConfirm, onCancel, isDeleting }: DeleteDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#0f1117] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Delete this session?</h3>
                        <p className="text-muted text-xs mt-0.5">This cannot be undone.</p>
                    </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-5">
                    <p className="text-white text-sm font-medium truncate">{session.title}</p>
                    <p className="text-muted text-xs mt-1">{formatDate(session.date)} · {session.category}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Expanded Session Details ────────────────────────────────────────────────

interface SessionDetailProps {
    session: Session
    onEdit: () => void
    onDelete: () => void
}

function SessionDetail({ session, onEdit, onDelete }: SessionDetailProps) {
    const catColor = getCategoryColor(session.category)

    return (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Full what_i_did */}
            <div>
                <p className="text-muted text-xs uppercase tracking-wide mb-1">What I Did</p>
                <p className="text-white/80 text-sm leading-relaxed">{session.what_i_did}</p>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {session.start_time} – {session.end_time}
                    <span className="text-white/50">({formatDuration(session.duration_minutes)})</span>
                </span>
                <span className="flex items-center gap-1.5" style={{ color: catColor }}>
                    <Tag className="w-3.5 h-3.5" />
                    {session.category}
                </span>
                {session.college_work_type && (
                    <span className="bg-college/10 text-college px-2 py-0.5 rounded-full">
                        {session.college_work_type}
                    </span>
                )}
                {session.due_date && (
                    <span className="flex items-center gap-1.5 text-muted">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {formatDate(session.due_date)}
                    </span>
                )}
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium
                    ${session.status === 'Completed'
                        ? 'bg-projects/15 text-projects'
                        : session.status === 'In Progress'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted/15 text-muted'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'Completed' ? 'bg-projects' : session.status === 'In Progress' ? 'bg-primary' : 'bg-muted'}`} />
                    {session.status}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
                    ${session.was_useful ? 'bg-projects/15 text-projects' : 'bg-red-500/10 text-red-400'}`}>
                    {session.was_useful
                        ? <><CheckCircle className="w-3 h-3" /> Useful</>
                        : <><XCircle className="w-3 h-3" /> Not useful</>
                    }
                </span>
            </div>

            {/* Next Action */}
            {session.next_action && (
                <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-primary text-xs font-medium mb-0.5">Next Action</p>
                        <p className="text-white/70 text-xs leading-relaxed">{session.next_action}</p>
                        {session.next_action_done && (
                            <span className="text-projects text-xs mt-1 inline-block">✓ Done</span>
                        )}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Session
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    )
}

// ─── Session Row ─────────────────────────────────────────────────────────────

interface SessionRowProps {
    session: Session
    onDeleteRequest: (s: Session) => void
    onEditRequest: (s: Session) => void
}

function SessionRow({ session, onDeleteRequest, onEditRequest }: SessionRowProps) {
    const [expanded, setExpanded] = useState(false)
    const catColor = getCategoryColor(session.category)

    return (
        <div
            className={`bg-white/[0.03] border rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-pointer
                ${expanded ? 'border-white/10 bg-white/[0.05]' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}`}
            onClick={() => setExpanded((v) => !v)}
        >
            {/* Collapsed summary row */}
            <div className="flex items-center gap-3">
                {/* Category color bar */}
                <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: catColor }}
                />

                {/* Date */}
                <div className="hidden sm:block shrink-0 w-28">
                    <p className="text-muted text-xs">{formatDate(session.date)}</p>
                </div>

                {/* Category chip */}
                <span
                    className="hidden md:inline-flex shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${catColor}18`, color: catColor }}
                >
                    {session.category}
                </span>

                {/* Title + what_i_did preview */}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{session.title}</p>
                    <p className="text-muted text-xs truncate mt-0.5">{session.what_i_did}</p>
                </div>

                {/* Duration */}
                <span className="hidden sm:block text-muted text-xs font-mono shrink-0">
                    {formatDuration(session.duration_minutes)}
                </span>

                {/* Useful */}
                <div className="shrink-0">
                    {session.was_useful
                        ? <CheckCircle className="w-4 h-4 text-projects" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                    }
                </div>

                {/* Next action preview */}
                {session.next_action && !session.next_action_done && (
                    <div className="hidden lg:flex shrink-0 items-center gap-1 text-primary text-xs max-w-[140px]">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{session.next_action}</span>
                    </div>
                )}

                {/* Expand toggle */}
                <div className="shrink-0 text-muted">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <SessionDetail
                    session={session}
                    onEdit={() => { onEditRequest(session) }}
                    onDelete={() => { onDeleteRequest(session) }}
                />
            )}
        </div>
    )
}

// ─── Main History Page ────────────────────────────────────────────────────────

export default function HistoryPage() {
    const navigate = useNavigate()
    const loaderRef = useRef<HTMLDivElement>(null)

    // ── Filters state ──────────────────────────────────────────────────────
    const [searchRaw, setSearchRaw] = useState('')
    const [search, setSearch] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([])
    const [status, setStatus] = useState<SessionStatus | 'all'>('all')
    const [useful, setUseful] = useState<'all' | 'yes' | 'no'>('all')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [filtersOpen, setFiltersOpen] = useState(false)

    // ── Delete dialog state ────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
    const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession()

    // ── Debounce search ────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchRaw), 350)
        return () => clearTimeout(timer)
    }, [searchRaw])

    // ── Build filters object ───────────────────────────────────────────────
    const filters: SessionFilters = {
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        status,
        wasUseful: useful === 'yes' ? true : useful === 'no' ? false : null,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
    }

    // ── Infinite query ─────────────────────────────────────────────────────
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteSessions(filters)

    const sessions: Session[] = data?.pages.flat() ?? []

    // ── Intersection observer for infinite scroll ──────────────────────────
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage],
    )

    useEffect(() => {
        const el = loaderRef.current
        if (!el) return
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
        observer.observe(el)
        return () => observer.disconnect()
    }, [handleObserver])

    // ── Helpers ────────────────────────────────────────────────────────────
    function toggleCategory(cat: CategoryType) {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
        )
    }

    function clearFilters() {
        setSelectedCategories([])
        setStatus('all')
        setUseful('all')
        setDateFrom('')
        setDateTo('')
        setSearchRaw('')
    }

    const activeFilterCount =
        selectedCategories.length +
        (status !== 'all' ? 1 : 0) +
        (useful !== 'all' ? 1 : 0) +
        (dateFrom ? 1 : 0) +
        (dateTo ? 1 : 0)

    function handleDelete(session: Session) {
        deleteSession(session.id, {
            onSuccess: () => {
                toast.success('Session deleted')
                setDeleteTarget(null)
            },
            onError: () => toast.error('Failed to delete session'),
        })
    }

    function handleEdit(session: Session) {
        // Navigate to log page with session ID as query param so the form can pre-fill
        navigate(`/log?edit=${session.id}`)
    }

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-white">Session History</h1>
                    <p className="text-muted text-sm mt-1">Browse, filter, and manage all your past sessions</p>
                </div>
                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-white px-3 py-1.5 bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear filters ({activeFilterCount})
                    </button>
                )}
            </div>

            {/* ── Filter Bar ──────────────────────────────────────────────── */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-4">
                {/* Search + filter toggle */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            id="history-search"
                            type="text"
                            placeholder="Search by title…"
                            value={searchRaw}
                            onChange={(e) => setSearchRaw(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/8 focus:border-primary/60 outline-none rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-muted/50 transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer
                            ${filtersOpen || activeFilterCount > 0
                                ? 'bg-primary/15 border-primary/30 text-primary'
                                : 'bg-white/[0.04] border-white/8 text-muted hover:text-white hover:border-white/15'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Expanded filters */}
                {filtersOpen && (
                    <div className="space-y-4 pt-1 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* Category chips */}
                        <div>
                            <p className="text-muted text-xs uppercase tracking-wide mb-2">Category</p>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => {
                                    const active = selectedCategories.includes(cat.value as CategoryType)
                                    return (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => toggleCategory(cat.value as CategoryType)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border"
                                            style={active
                                                ? { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}55`, color: cat.color }
                                                : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#6B7280' }
                                            }
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Status + Useful + Date range */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Status */}
                            <div>
                                <p className="text-muted text-xs uppercase tracking-wide mb-2">Status</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setStatus(opt.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer
                                                ${status === opt.value
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'bg-white/[0.04] text-muted border border-white/5 hover:border-white/15 hover:text-white'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Useful */}
                            <div>
                                <p className="text-muted text-xs uppercase tracking-wide mb-2">Usefulness</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {USEFUL_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setUseful(opt.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer
                                                ${useful === opt.value
                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                    : 'bg-white/[0.04] text-muted border border-white/5 hover:border-white/15 hover:text-white'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date range */}
                            <div>
                                <p className="text-muted text-xs uppercase tracking-wide mb-2">Date Range</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="history-date-from"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1 bg-white/[0.04] border border-white/8 focus:border-primary/60 outline-none rounded-xl px-3 py-1.5 text-white text-xs transition-colors [color-scheme:dark]"
                                    />
                                    <span className="text-muted text-xs">–</span>
                                    <input
                                        id="history-date-to"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1 bg-white/[0.04] border border-white/8 focus:border-primary/60 outline-none rounded-xl px-3 py-1.5 text-white text-xs transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Session List ────────────────────────────────────────────── */}
            <div>
                {/* Results count */}
                {!isLoading && (
                    <p className="text-muted text-xs mb-3">
                        {sessions.length === 0
                            ? 'No sessions found'
                            : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}${hasNextPage ? '+' : ''} found`}
                    </p>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-10 bg-white/10 rounded-full" />
                                    <div className="w-24 h-3 bg-white/10 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-white/10 rounded w-2/3" />
                                        <div className="h-2.5 bg-white/5 rounded w-1/2" />
                                    </div>
                                    <div className="w-8 h-3 bg-white/10 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                        <p className="text-white text-sm">Failed to load sessions.</p>
                        <p className="text-muted text-xs mt-1">Check your connection and try again.</p>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !isError && sessions.length === 0 && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-16 text-center">
                        <BookOpen className="w-10 h-10 text-muted/20 mx-auto mb-4" />
                        <p className="text-white text-sm font-medium">No sessions match your filters</p>
                        <p className="text-muted text-xs mt-2 mb-4">Try adjusting or clearing the filters above.</p>
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-muted hover:text-white border border-white/8 rounded-xl transition-colors cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Session rows */}
                {!isLoading && !isError && sessions.length > 0 && (
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <SessionRow
                                key={session.id}
                                session={session}
                                onDeleteRequest={setDeleteTarget}
                                onEditRequest={handleEdit}
                            />
                        ))}
                    </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={loaderRef} className="h-8 flex items-center justify-center mt-2">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted text-xs">
                            <div className="w-4 h-4 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                            Loading more…
                        </div>
                    )}
                    {!hasNextPage && sessions.length > 0 && !isLoading && (
                        <p className="text-muted/40 text-xs">All sessions loaded</p>
                    )}
                </div>
            </div>

            {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
            {deleteTarget && (
                <DeleteDialog
                    session={deleteTarget}
                    onConfirm={() => handleDelete(deleteTarget)}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    )
}
