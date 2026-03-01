import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SessionForm from '../components/logger/SessionForm'
import type { Session } from '../types'
import type { CategoryType, SessionStatus, CollegeWorkType } from '../types'

/** Map a DB Session row to the SessionForm initialData shape */
function toInitialData(s: Session) {
    return {
        date: s.date,
        category: s.category as CategoryType,
        collegeWorkType: (s.college_work_type ?? null) as CollegeWorkType | null,
        dueDate: s.due_date ?? '',
        title: s.title,
        whatIDid: s.what_i_did,
        status: s.status as SessionStatus,
        startTime: s.start_time,
        endTime: s.end_time,
        wasUseful: s.was_useful,
        nextAction: s.next_action ?? '',
    }
}

export default function LogSessionPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const editId = searchParams.get('edit')

    // Fetch the session being edited (only when ?edit=<id> is present)
    const { data: editSession, isLoading: loadingSession } = useQuery({
        queryKey: ['session', editId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('id', editId!)
                .eq('user_id', user!.id)
                .single()
            if (error) throw error
            return data as Session
        },
        enabled: !!editId && !!user,
    })

    const isEditMode = !!editId

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                {isEditMode && (
                    <button
                        type="button"
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-1.5 text-muted hover:text-white text-sm mb-4 transition-colors cursor-pointer group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to History
                    </button>
                )}

                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditMode ? 'bg-learning/15' : 'bg-primary/15'}`}>
                        {isEditMode
                            ? <Pencil className="w-5 h-5 text-learning" />
                            : <BookOpen className="w-5 h-5 text-primary" />
                        }
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {isEditMode ? 'Edit Session' : 'Log a Session'}
                        </h1>
                        <p className="text-muted text-sm mt-0.5">
                            {isEditMode
                                ? 'Update the details of this session.'
                                : 'Record what you worked on and how it went.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Form card */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                {isEditMode && loadingSession ? (
                    /* Loading skeleton while fetching the session to edit */
                    <div className="space-y-5 animate-pulse">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i}>
                                <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                                <div className="h-10 bg-white/5 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <SessionForm
                        sessionId={editId ?? undefined}
                        initialData={editSession ? toInitialData(editSession) : undefined}
                        onSuccess={() => {
                            if (isEditMode) {
                                navigate('/history')
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}
