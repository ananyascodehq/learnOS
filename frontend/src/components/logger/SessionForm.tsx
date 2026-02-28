import { useState, useMemo, useCallback, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../constants/categories'
import type { CategoryType, SessionStatus, CollegeWorkType, Session } from '../../types'
import { RotateCcw, X, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import PomodoroTimer from './PomodoroTimer'
import { useQueryClient } from '@tanstack/react-query'

const COLLEGE_WORK_TYPES: { label: string; value: CollegeWorkType }[] = [
    { label: 'Record', value: 'Record' },
    { label: 'Observation', value: 'Observation' },
    { label: 'Assignment', value: 'Assignment' },
]

const STATUS_OPTIONS: { label: string; value: SessionStatus }[] = [
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Paused', value: 'Paused' },
]

function getTodayString() {
    return new Date().toISOString().split('T')[0]
}

function formatDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '—'
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 0) diff += 24 * 60 // handle crossing midnight
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours} hr`
    return `${hours} hr ${mins} min`
}

interface SessionFormProps {
    initialData?: {
        date?: string
        category?: CategoryType
        collegeWorkType?: CollegeWorkType | null
        dueDate?: string
        title?: string
        whatIDid?: string
        status?: SessionStatus
        startTime?: string
        endTime?: string
        wasUseful?: boolean
        nextAction?: string
    }
    sessionId?: string // if editing
    onSuccess?: () => void
}

export default function SessionForm({ initialData, sessionId, onSuccess }: SessionFormProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const [date, setDate] = useState(initialData?.date ?? getTodayString())
    const [category, setCategory] = useState<CategoryType | ''>(initialData?.category ?? '')
    const [collegeWorkType, setCollegeWorkType] = useState<CollegeWorkType | ''>(initialData?.collegeWorkType ?? '')
    const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '')
    const [title, setTitle] = useState(initialData?.title ?? '')
    const [whatIDid, setWhatIDid] = useState(initialData?.whatIDid ?? '')
    const [status, setStatus] = useState<SessionStatus>(initialData?.status ?? 'In Progress')
    const [startTime, setStartTime] = useState(initialData?.startTime ?? '')
    const [endTime, setEndTime] = useState(initialData?.endTime ?? '')
    const [wasUseful, setWasUseful] = useState<boolean | null>(initialData?.wasUseful ?? null)
    const [nextAction, setNextAction] = useState(initialData?.nextAction ?? '')
    const [suggestedNextAction, setSuggestedNextAction] = useState('')
    const [suggesting, setSuggesting] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [saving, setSaving] = useState(false)
    const [matchedSession, setMatchedSession] = useState<Session | null>(null)
    const [showResumeBanner, setShowResumeBanner] = useState(false)
    const [showTimer, setShowTimer] = useState(false)

    // Session continuity: check for matching task from the selected date
    const checkForResumable = useCallback(async () => {
        if (!user || !title.trim() || sessionId) return
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', date)
            .ilike('title', title.trim())
            .order('created_at', { ascending: false })
            .limit(1)

        if (data && data.length > 0) {
            setMatchedSession(data[0])
            setShowResumeBanner(true)
        } else {
            setMatchedSession(null)
            setShowResumeBanner(false)
        }
    }, [user, title, sessionId, date])

    const handleResume = () => {
        if (!matchedSession) return
        setCategory(matchedSession.category)
        if (matchedSession.college_work_type) {
            setCollegeWorkType(matchedSession.college_work_type)
        }
        setStatus('In Progress')
        if (matchedSession.next_action) {
            setNextAction(matchedSession.next_action)
        }
        setShowResumeBanner(false)
        toast.success('Resumed from earlier session')
    }

    const isCollegeWork = category === 'College Work'
    const duration = useMemo(() => formatDuration(startTime, endTime), [startTime, endTime])

    const inputClasses = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors text-sm'
    const labelClasses = 'block text-sm font-medium text-white/70 mb-1.5'

    const resetForm = () => {
        setDate(getTodayString())
        setCategory('')
        setCollegeWorkType('')
        setDueDate('')
        setTitle('')
        setWhatIDid('')
        setStatus('In Progress')
        setStartTime('')
        setEndTime('')
        setWasUseful(null)
        setNextAction('')
        setSuggestedNextAction('')



    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !category) return

        if (wasUseful === null) {
            toast.error('Please indicate if the session was useful')
            return
        }

        setSaving(true)

        const sessionData = {
            user_id: user.id,
            date,
            category: category as CategoryType,
            college_work_type: isCollegeWork && collegeWorkType ? (collegeWorkType as CollegeWorkType) : null,
            due_date: isCollegeWork && collegeWorkType && dueDate ? dueDate : null,
            title,
            what_i_did: whatIDid,
            status,
            start_time: startTime,
            end_time: endTime,
            was_useful: wasUseful,
            next_action: nextAction || null,
        }

        let error, newSessionId = sessionId
        if (sessionId) {
            // Editing
            const result = await supabase.from('sessions').update(sessionData).eq('id', sessionId)
            error = result.error
        } else {
            // Creating
            const result = await supabase.from('sessions').insert(sessionData).select('id').single()
            error = result.error
            if (!error && result.data?.id) newSessionId = result.data.id
        }

        setSaving(false)

        if (error) {
            toast.error('Failed to save session')
            console.error('Session save error:', error)
            return
        }

        // Invalidate queries to refresh dashboard and history
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        queryClient.invalidateQueries({ queryKey: ['streak'] })

        toast.success(sessionId ? 'Session updated!' : 'Session logged!')
        if (!sessionId) resetForm()
        onSuccess?.()

        // --- AI Debrief Integration ---
        try {
            const aiRes = await axios.post('/api/ai/debrief', {
                sessionId: newSessionId,
                category,
                duration: startTime && endTime ? formatDuration(startTime, endTime) : '',
                what_i_did: whatIDid,
                was_useful: wasUseful,
                next_action: nextAction,
                userId: user.id,
            })
            if (aiRes.data?.ai_debrief) {
                toast((t) => (
                    <div>
                        <div className="font-semibold mb-1">AI Insight</div>
                        <div className="text-sm text-white/90 whitespace-pre-line">{aiRes.data.ai_debrief}</div>
                        <button onClick={() => toast.dismiss(t.id)} className="mt-2 text-xs text-primary underline">Dismiss</button>
                    </div>
                ), { duration: 8000 })
            }
        } catch (err) {
            // Silent fail, do not block UX
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Resume banner */}
            {showResumeBanner && matchedSession && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-learning/10 border border-learning/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                        <RotateCcw className="w-4 h-4 text-learning shrink-0" />
                        <span className="text-white/80">
                            You worked on <strong className="text-white">{matchedSession.title}</strong> previously
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleResume}
                            className="px-3 py-1.5 bg-learning/20 hover:bg-learning/30 text-learning text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                            Resume
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowResumeBanner(false)}
                            className="text-muted hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            {/* Date */}
            <div>
                <label className={labelClasses}>Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={inputClasses}
                />
            </div>

            {/* Category */}
            <div>
                <label className={labelClasses}>Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                                setCategory(cat.value as CategoryType)
                                if (cat.value !== 'College Work') {
                                    setCollegeWorkType('')
                                    setDueDate('')
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${category === cat.value
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5 hover:text-white/80'
                                }`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                            />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* College Work Type — conditional */}
            {isCollegeWork && (
                <div>
                    <label className={labelClasses}>College Work Type</label>
                    <div className="flex gap-2">
                        {COLLEGE_WORK_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setCollegeWorkType(type.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${collegeWorkType === type.value
                                    ? 'border-college/50 bg-college/15 text-college'
                                    : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Due Date — conditional */}
            {isCollegeWork && collegeWorkType && (
                <div>
                    <label className={labelClasses}>Due Date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={inputClasses}
                    />
                </div>
            )}

            {/* Title */}
            <div>
                <label className={labelClasses}>Title / Task Name</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={checkForResumable}
                    placeholder="What did you work on?"
                    required
                    className={inputClasses}
                />
            </div>

            {/* What I Did */}
            <div>
                <label className={labelClasses}>What I Did Today</label>
                <textarea
                    value={whatIDid}
                    onChange={e => {
                        const value = e.target.value
                        setWhatIDid(value)
                        if (debounceRef.current) clearTimeout(debounceRef.current)
                        debounceRef.current = setTimeout(async () => {
                            if (!value.trim()) {
                                setSuggestedNextAction('')
                                return
                            }
                            setSuggesting(true)
                            try {
                                const res = await axios.post('/api/ai/suggest-next-action', {
                                    what_i_did: value,
                                    category,
                                    userId: user?.id,
                                })
                                setSuggestedNextAction(res.data?.suggestion || '')
                            } catch {
                                setSuggestedNextAction('')
                            }
                            setSuggesting(false)
                        }, 700)
                    }}
                    placeholder="Describe what you accomplished..."
                    required
                    rows={3}
                    className={`${inputClasses} resize-none`}
                />
            </div>

            {/* Status — segmented control */}
            <div>
                <label className={labelClasses}>Status</label>
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(opt.value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${status === opt.value
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted hover:text-white'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pomodoro Timer */}
            <div>
                {!showTimer ? (
                    <button
                        type="button"
                        onClick={() => setShowTimer(true)}
                        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors cursor-pointer mb-3"
                    >
                        <Timer className="w-4 h-4" />
                        Use Pomodoro Timer
                    </button>
                ) : (
                    <div className="mb-3">
                        <PomodoroTimer
                            onStart={(time) => setStartTime(time)}
                            onEnd={(time) => setEndTime(time)}
                            onCancel={() => {
                                setShowTimer(false)
                                setStartTime('')
                                setEndTime('')
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Start Time</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className={inputClasses}
                    />
                </div>
                <div>
                    <label className={labelClasses}>End Time</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className={inputClasses}
                    />
                </div>
            </div>

            {/* Duration display */}
            {startTime && endTime && (
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <span className="text-primary text-sm font-medium">Duration:</span>
                    <span className="text-white text-sm font-bold">{duration}</span>
                </div>
            )}

            {/* Was It Useful */}
            <div>
                <label className={labelClasses}>Was It Useful?</label>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setWasUseful(true)}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${wasUseful === true
                            ? 'border-projects/50 bg-projects/15 text-projects'
                            : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5'
                            }`}
                    >
                        ✓ Yes
                    </button>
                    <button
                        type="button"
                        onClick={() => setWasUseful(false)}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${wasUseful === false
                            ? 'border-red-400/50 bg-red-400/15 text-red-400'
                            : 'border-white/5 bg-white/[0.02] text-muted hover:bg-white/5'
                            }`}
                    >
                        ✗ No
                    </button>
                </div>
            </div>

            {/* Next Action */}
            <div>
                <label className={labelClasses}>Next Action <span className="text-muted/50">(optional)</span></label>
                <div className="relative">
                    <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder={suggesting ? 'Thinking...' : (suggestedNextAction || "What's the next step?")}
                        className={inputClasses + (suggestedNextAction && !nextAction ? ' placeholder-primary/70' : '')}
                    />
                    {/* Ghost text overlay for suggestion */}
                    {suggestedNextAction && !nextAction && !suggesting && (
                        <div
                            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/70 text-sm select-none"
                            style={{ zIndex: 1 }}
                        >
                            {suggestedNextAction}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={saving || !category}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {saving ? 'Saving...' : sessionId ? 'Update Session' : 'Log Session'}
            </button>
        </form>
    )
}
