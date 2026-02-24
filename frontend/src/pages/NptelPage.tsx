import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Plus, BookOpen, ChevronDown, ChevronUp, X,
    GraduationCap, User, Building2, Award, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { NptelCourse, NptelWeek } from '../types'
import type { NptelStatus } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type CourseWithWeeks = NptelCourse & { weeks: NptelWeek[] }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CYCLE: NptelStatus[] = ['Not Started', 'In Progress', 'Completed']

function nextStatus(current: NptelStatus): NptelStatus {
    const idx = STATUS_CYCLE.indexOf(current)
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

const WEEK_STYLE: Record<NptelStatus, string> = {
    'Not Started': 'bg-white/[0.04] border border-white/8 text-muted hover:bg-white/[0.08] hover:border-white/15',
    'In Progress': 'bg-college/15 border border-college/30 text-college hover:bg-college/25',
    'Completed': 'bg-projects/15 border border-projects/30 text-projects hover:bg-projects/25',
}

const WEEK_DOT: Record<NptelStatus, string> = {
    'Not Started': 'bg-white/20',
    'In Progress': 'bg-college',
    'Completed': 'bg-projects',
}

// ─── Week Grid (Task 024) ─────────────────────────────────────────────────────

interface WeekGridProps {
    courseId: string
    weeks: NptelWeek[]
}

function WeekGrid({ courseId, weeks }: WeekGridProps) {
    const queryClient = useQueryClient()

    const { mutate: toggleWeek, isPending } = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: NptelStatus }) => {
            const { error } = await supabase
                .from('nptel_weeks')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nptel-courses'] })
        },
        onError: () => toast.error('Failed to update week'),
    })

    const sorted = [...weeks].sort((a, b) => a.week_number - b.week_number)

    return (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-muted text-xs uppercase tracking-wide mb-3">
                Click a week to cycle: Not Started → In Progress → Completed
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {sorted.map((week) => (
                    <button
                        key={week.id}
                        type="button"
                        onClick={() => toggleWeek({ id: week.id, status: nextStatus(week.status) })}
                        disabled={isPending}
                        title={`Week ${week.week_number}: ${week.status}`}
                        className={`relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-60 ${WEEK_STYLE[week.status]}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${WEEK_DOT[week.status]}`} />
                        <span>W{week.week_number}</span>
                        {week.status === 'Completed' && (
                            <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-projects" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: CourseWithWeeks }) {
    const [expanded, setExpanded] = useState(false)

    const completed = course.weeks.filter((w) => w.status === 'Completed').length
    const inProgress = course.weeks.filter((w) => w.status === 'In Progress').length
    const total = course.total_weeks
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    const barColor =
        pct >= 95 ? 'bg-red-400' :
            pct >= 80 ? 'bg-college' :
                'bg-projects'

    return (
        <div className={`bg-white/[0.03] border rounded-2xl p-5 transition-all duration-200 ${expanded ? 'border-white/10' : 'border-white/5 hover:border-white/10'}`}>
            {/* Header row */}
            <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded((v) => !v)}
            >
                {/* Icon */}
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5 text-primary" />
                </div>

                {/* Course info */}
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{course.course_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {course.instructor_name && (
                            <span className="flex items-center gap-1 text-muted text-xs">
                                <User className="w-3 h-3" />{course.instructor_name}
                            </span>
                        )}
                        {course.course_provider && (
                            <span className="flex items-center gap-1 text-muted text-xs">
                                <Building2 className="w-3 h-3" />{course.course_provider}
                            </span>
                        )}
                        {course.credits != null && (
                            <span className="flex items-center gap-1 text-muted text-xs">
                                <Award className="w-3 h-3" />{course.credits} credit{course.credits !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted">
                                {completed}/{total} weeks complete
                                {inProgress > 0 && <span className="text-college ml-1">· {inProgress} in progress</span>}
                            </span>
                            <span className="text-xs font-semibold text-white">{pct}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Expand toggle */}
                <div className="shrink-0 text-muted mt-1">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Week grid (expanded) */}
            {expanded && <WeekGrid courseId={course.id} weeks={course.weeks} />}
        </div>
    )
}

// ─── Add Course Modal ─────────────────────────────────────────────────────────

interface AddCourseModalProps {
    onClose: () => void
}

function AddCourseModal({ onClose }: AddCourseModalProps) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const [courseName, setCourseName] = useState('')
    const [totalWeeks, setTotalWeeks] = useState<number | ''>(12)
    const [instructorName, setInstructorName] = useState('')
    const [courseProvider, setCourseProvider] = useState('')
    const [credits, setCredits] = useState<number | ''>(4)

    const { mutate: addCourse, isPending } = useMutation({
        mutationFn: async () => {
            if (!user || !courseName || !totalWeeks) return
            const weeks = Number(totalWeeks)

            // Insert course
            const { data: course, error: courseErr } = await supabase
                .from('nptel_courses')
                .insert({
                    user_id: user.id,
                    course_name: courseName.trim(),
                    total_weeks: weeks,
                    instructor_name: instructorName.trim() || null,
                    course_provider: courseProvider.trim() || null,
                    credits: credits !== '' ? Number(credits) : null,
                })
                .select('id')
                .single()

            if (courseErr || !course) throw courseErr ?? new Error('Course insert failed')

            // Bulk-insert week rows
            const weekRows = Array.from({ length: weeks }, (_, i) => ({
                course_id: course.id,
                week_number: i + 1,
                status: 'Not Started' as NptelStatus,
            }))

            const { error: weeksErr } = await supabase.from('nptel_weeks').insert(weekRows)
            if (weeksErr) throw weeksErr
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nptel-courses'] })
            toast.success('Course added!')
            onClose()
        },
        onError: () => toast.error('Failed to add course'),
    })

    const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors'
    const labelCls = 'block text-xs font-medium text-white/60 mb-1.5'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-white font-semibold">Add NPTEL Course</h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-muted hover:text-white transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); addCourse() }}
                    className="space-y-4"
                >
                    {/* Course name */}
                    <div>
                        <label className={labelCls}>Course Name *</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Data Structures and Algorithms"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Instructor + Provider side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Instructor Name</label>
                            <input
                                type="text"
                                placeholder="Prof. Name"
                                value={instructorName}
                                onChange={(e) => setInstructorName(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Course Provider</label>
                            <input
                                type="text"
                                placeholder="e.g. IIT Madras"
                                value={courseProvider}
                                onChange={(e) => setCourseProvider(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Total weeks + Credits side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Total Weeks *</label>
                            <input
                                required
                                type="number"
                                min={1}
                                max={16}
                                value={totalWeeks}
                                onChange={(e) => setTotalWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Credits</label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                placeholder="e.g. 4"
                                value={credits}
                                onChange={(e) => setCredits(e.target.value === '' ? '' : Number(e.target.value))}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !courseName || !totalWeeks}
                            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isPending ? 'Adding…' : 'Add Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NptelPage() {
    const { user } = useAuth()
    const [showModal, setShowModal] = useState(false)

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['nptel-courses', user?.id],
        queryFn: async () => {
            // Fetch all courses + their weeks in one go
            const { data: coursesData, error: coursesErr } = await supabase
                .from('nptel_courses')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })

            if (coursesErr) throw coursesErr
            if (!coursesData || coursesData.length === 0) return [] as CourseWithWeeks[]

            const courseIds = coursesData.map((c) => c.id)
            const { data: weeksData, error: weeksErr } = await supabase
                .from('nptel_weeks')
                .select('*')
                .in('course_id', courseIds)
                .order('week_number', { ascending: true })

            if (weeksErr) throw weeksErr

            return coursesData.map((course) => ({
                ...course,
                weeks: (weeksData ?? []).filter((w) => w.course_id === course.id),
            })) as CourseWithWeeks[]
        },
        enabled: !!user,
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-white">NPTEL Tracker</h1>
                    <p className="text-muted text-sm mt-1">Track your NPTEL courses week by week.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add Course
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-1/2" />
                                    <div className="h-2.5 bg-white/5 rounded w-1/3" />
                                    <div className="h-2 bg-white/5 rounded-full mt-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && courses.length === 0 && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl py-20 text-center">
                    <GraduationCap className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                    <p className="text-white text-sm font-semibold mb-1">No NPTEL courses yet</p>
                    <p className="text-muted text-xs mb-5">
                        Add a course to start tracking your weekly assignment progress.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                        <BookOpen className="w-4 h-4" />
                        Add your first course
                    </button>
                </div>
            )}

            {/* Course list */}
            {!isLoading && courses.length > 0 && (
                <div className="space-y-3">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}

            {/* Add Course Modal */}
            {showModal && <AddCourseModal onClose={() => setShowModal(false)} />}
        </div>
    )
}
