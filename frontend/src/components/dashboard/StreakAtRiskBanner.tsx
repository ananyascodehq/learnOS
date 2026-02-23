import { useState, useEffect } from 'react'
import { Flame, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSessionsToday } from '../../hooks/useSessions'

export default function StreakAtRiskBanner() {
    const [dismissed, setDismissed] = useState(false)
    const [isAfter9PM, setIsAfter9PM] = useState(false)

    const { user } = useAuth()
    const { data: todaySessions = [], isLoading } = useSessionsToday()

    useEffect(() => {
        // Check if current time is after 21:00
        const now = new Date()
        setIsAfter9PM(now.getHours() >= 21)
    }, [])

    if (!user || isLoading) return null

    // If already logged today, or dismissed, or not after 9PM - don't show
    if (todaySessions.length > 0 || dismissed || !isAfter9PM) {
        return null
    }

    return (
        <div className="bg-orange-500/15 border border-orange-500/30 rounded-2xl p-4 mb-6 relative animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3 relative z-10">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <h3 className="text-sm font-semibold text-orange-400">Streak at risk!</h3>
                    <p className="text-xs text-orange-200 mt-1">
                        You haven't logged any sessions today. Take a moment to log what you worked on.
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute top-4 right-4 text-orange-400 hover:text-orange-200 transition-colors cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
