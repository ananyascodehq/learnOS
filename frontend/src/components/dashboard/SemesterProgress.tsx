import { useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { GraduationCap } from 'lucide-react'

export default function SemesterProgress() {
    const { profile } = useAuth()

    const data = useMemo(() => {
        if (!profile?.semester_start || !profile?.semester_end || !profile?.semester) {
            return null
        }

        const start = new Date(profile.semester_start).getTime()
        const end = new Date(profile.semester_end).getTime()
        const now = new Date().getTime()

        if (now < start) {
            return { percentage: 0, week: 0, totalWeeks: Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7)), color: 'bg-primary' }
        }
        if (now > end) {
            return { percentage: 100, week: 'Done', totalWeeks: 'Done', color: 'bg-red-500' }
        }

        const totalDuration = end - start
        const elapsed = now - start
        const percentage = Math.round((elapsed / totalDuration) * 100)

        const currentWeek = Math.floor(elapsed / (1000 * 60 * 60 * 24 * 7)) + 1
        const totalWeeks = Math.ceil(totalDuration / (1000 * 60 * 60 * 24 * 7))

        let color = 'bg-projects' // green < 80%
        if (percentage >= 80 && percentage <= 95) color = 'bg-yellow-500' // amber 80-95%
        if (percentage > 95) color = 'bg-red-500' // red > 95%

        return { percentage, currentWeek, totalWeeks, color }
    }, [profile])

    if (!data) return null

    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-white/70" />
                    <h2 className="text-sm font-semibold text-white">Semester {profile?.semester} Progress</h2>
                </div>
                <span className="text-sm font-medium text-white/70">
                    Week {data.currentWeek} of {data.totalWeeks}
                </span>
            </div>

            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`absolute top-0 left-0 h-full ${data.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${data.percentage}%` }}
                />
            </div>
            <div className="mt-2 text-right">
                <span className="text-xs font-medium text-muted">{data.percentage}% Completed</span>
            </div>
        </div>
    )
}
