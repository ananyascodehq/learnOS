import { useDashboardSessions, useStreak } from '../hooks/useSessions'
import { useWeeklySummary } from '../hooks/useWeeklySummary'
import { getCategoryColor } from '../constants/categories'
import { Link } from 'react-router-dom'
import { Clock, Layers, Flame, BookOpen, CheckCircle, XCircle, ChevronRight, Zap } from 'lucide-react'
import WeeklyHeatmap from '../components/dashboard/WeeklyHeatmap'
import CategoryChart from '../components/dashboard/CategoryChart'
import UsefulnessChart from '../components/dashboard/UsefulnessChart'
import SemesterProgress from '../components/dashboard/SemesterProgress'
import StreakAtRiskBanner from '../components/dashboard/StreakAtRiskBanner'

function timeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000 // years
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000 // months
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400 // days
    if (Math.floor(interval) === 1) return "yesterday"
    if (interval > 1) return Math.floor(interval) + " days ago"
    
    return "today"
}


export default function DashboardPage() {
    const { data: dashboardSessions, isLoading } = useDashboardSessions()
    const { data: weeklySummary, isLoading: loadingSummary } = useWeeklySummary()
    const { data: streak = 0 } = useStreak()

    const todaySessions = dashboardSessions?.today ?? []
    const weekSessions = dashboardSessions?.week ?? []
    const monthSessions = dashboardSessions?.month ?? []
    
    const ongoingTasks = monthSessions
        .filter(s => s.status === 'In Progress' || s.status === 'Paused')
        // Sort by most recent date first
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())


    const totalMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    const uniqueCategories = new Set(todaySessions.map((s) => s.category)).size



    const stats = [
        {
            title: 'Sessions Today',
            value: todaySessions.length,
            icon: BookOpen,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            title: 'Time Logged',
            value: timeDisplay,
            icon: Clock,
            color: 'text-projects',
            bg: 'bg-projects/10',
        },
        {
            title: 'Categories Active',
            value: uniqueCategories,
            icon: Layers,
            color: 'text-learning',
            bg: 'bg-learning/10',
        },
        {
            title: 'Current Streak',
            value: streak,
            icon: Flame,
            color: 'text-college',
            bg: 'bg-college/10',
            suffix: '🔥',
        },
    ]


    if (isLoading || loadingSummary) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-muted text-sm mt-1">Today at a Glance</p>
            </div>

            {/* Weekly AI Summary */}
            {weeklySummary?.summary && (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 mb-2">
                    <div className="font-semibold text-primary mb-1">Weekly AI Summary</div>
                    <div className="text-white/90 whitespace-pre-line text-sm">{weeklySummary.summary}</div>
                </div>
            )}

            <StreakAtRiskBanner />
            <SemesterProgress />

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            {stat.suffix && <span className="text-lg">{stat.suffix}</span>}
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-muted text-xs mt-1">{stat.title}</p>
                    </div>
                ))}
            </div>
            
            {/* Ongoing Tasks */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Ongoing Tasks</h2>
                {ongoingTasks.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                        <Zap className="w-8 h-8 text-muted/30 mx-auto mb-3" />
                        <p className="text-muted text-sm">No ongoing tasks.</p>
                        <p className="text-muted/60 text-xs mt-1">Tasks marked "In Progress" or "Paused" will appear here.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                        {ongoingTasks.map((session) => (
                            <Link
                                to={`/log?edit=${session.id}`}
                                key={session.id}
                                className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 hover:bg-white/[0.05] hover:border-white/10 transition-all"
                            >
                                <span
                                    className="w-2 h-8 rounded-full shrink-0"
                                    style={{ backgroundColor: getCategoryColor(session.category) }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{session.title}</p>
                                    <p className="text-muted text-xs">{timeAgo(session.date)} · {session.category}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>


            {/* Weekly Heatmap */}
            <WeeklyHeatmap sessions={weekSessions} />

            {/* Category Chart */}
            <CategoryChart weekSessions={weekSessions} monthSessions={monthSessions} />

            {/* Session Usefulness */}
            <UsefulnessChart weekSessions={weekSessions} monthSessions={monthSessions} />

            {/* Today's Sessions List */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Today's Sessions</h2>
                {todaySessions.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                        <BookOpen className="w-8 h-8 text-muted/30 mx-auto mb-3" />
                        <p className="text-muted text-sm">No sessions logged today.</p>
                        <p className="text-muted/60 text-xs mt-1">Start by clicking "Log Session" above.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todaySessions.map((session) => {
                            const durationMins = session.duration_minutes ?? 0
                            const h = Math.floor(durationMins / 60)
                            const m = durationMins % 60
                            const durStr = h > 0 ? `${h}h ${m}m` : `${m}m`

                            return (
                                <div
                                    key={session.id}
                                    className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors"
                                >
                                    {/* Category chip */}
                                    <span
                                        className="w-2 h-8 rounded-full shrink-0"
                                        style={{ backgroundColor: getCategoryColor(session.category) }}
                                    />

                                    {/* Title & category */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{session.title}</p>
                                        <p className="text-muted text-xs">{session.category}</p>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-muted text-xs font-mono shrink-0">{durStr}</span>

                                    {/* Useful indicator */}
                                    {session.was_useful ? (
                                        <CheckCircle className="w-4 h-4 text-projects shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
