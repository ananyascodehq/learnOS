import { useState } from 'react'
import type { Session } from '../../types'
import { getCategoryColor } from '../../constants/categories'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface WeeklyHeatmapProps {
    sessions: Session[]
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now)
    monday.setDate(diff)

    const today = new Date().toISOString().split('T')[0]

    return DAY_LABELS.map((label, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        return { label, date: dateStr, isToday: dateStr === today }
    })
}

function getIntensityClass(minutes: number): string {
    if (minutes === 0) return 'bg-white/5'
    if (minutes <= 30) return 'bg-primary/20'
    if (minutes <= 60) return 'bg-primary/40'
    return 'bg-primary/70'
}

function formatMinutes(mins: number): string {
    if (mins === 0) return '0m'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
}

export default function WeeklyHeatmap({ sessions }: WeeklyHeatmapProps) {
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const weekDays = getWeekDays()

    // Group sessions by date
    const sessionsByDate = sessions.reduce<Record<string, Session[]>>((acc, s) => {
        if (!acc[s.date]) acc[s.date] = []
        acc[s.date].push(s)
        return acc
    }, {})

    // Calculate minutes per day
    const minutesByDate = Object.entries(sessionsByDate).reduce<Record<string, number>>(
        (acc, [date, daySessions]) => {
            acc[date] = daySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
            return acc
        },
        {}
    )

    const selectedSessions = selectedDay ? (sessionsByDate[selectedDay] ?? []) : []

    return (
        <div>
            <h2 className="text-lg font-semibold text-white mb-4">Weekly Activity</h2>

            <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                    const mins = minutesByDate[day.date] ?? 0
                    const isSelected = selectedDay === day.date

                    return (
                        <button
                            key={day.date}
                            type="button"
                            onClick={() => setSelectedDay(isSelected ? null : day.date)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 cursor-pointer ${isSelected
                                ? 'border-primary/50 ring-1 ring-primary/30'
                                : day.isToday
                                    ? 'border-primary/30'
                                    : 'border-transparent'
                                }`}
                        >
                            <span className={`text-xs font-medium ${day.isToday ? 'text-primary' : 'text-muted'}`}>
                                {day.label}
                            </span>
                            <div
                                className={`w-full aspect-square rounded-lg flex items-center justify-center ${getIntensityClass(mins)}`}
                            >
                                <span className="text-xs font-mono text-white/70">{formatMinutes(mins)}</span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 justify-end">
                <span className="text-muted text-[10px]">Less</span>
                <div className="w-3 h-3 rounded bg-white/5" />
                <div className="w-3 h-3 rounded bg-primary/20" />
                <div className="w-3 h-3 rounded bg-primary/40" />
                <div className="w-3 h-3 rounded bg-primary/70" />
                <span className="text-muted text-[10px]">More</span>
            </div>

            {/* Day detail panel */}
            {selectedDay && (
                <div className="mt-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 animate-in fade-in slide-in-from-right-2">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-white">
                            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setSelectedDay(null)}
                            className="text-muted hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {selectedSessions.length === 0 ? (
                        <p className="text-muted text-xs">No sessions this day.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedSessions.map((session) => {
                                const dur = session.duration_minutes ?? 0
                                return (
                                    <div
                                        key={session.id}
                                        className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg"
                                    >
                                        <span
                                            className="w-1.5 h-6 rounded-full shrink-0"
                                            style={{ backgroundColor: getCategoryColor(session.category) }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-medium truncate">{session.title}</p>
                                            <p className="text-muted text-[10px]">{session.category}</p>
                                        </div>
                                        <span className="text-muted text-[10px] font-mono shrink-0">
                                            {formatMinutes(dur)}
                                        </span>
                                        {session.was_useful ? (
                                            <CheckCircle className="w-3.5 h-3.5 text-projects shrink-0" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
