import { useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'
import { CATEGORIES } from '../../constants/categories'
import type { Session } from '../../types'

interface CategoryChartProps {
    weekSessions: Session[]
    monthSessions: Session[]
}

type Period = 'week' | 'month'

export default function CategoryChart({ weekSessions, monthSessions }: CategoryChartProps) {
    const [period, setPeriod] = useState<Period>('week')
    const sessions = period === 'week' ? weekSessions : monthSessions

    // Aggregate minutes by category
    const data = CATEGORIES.map((cat) => {
        const catSessions = sessions.filter((s) => s.category === cat.value)
        const totalMins = catSessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
        return {
            name: cat.label,
            minutes: totalMins,
            color: cat.color,
        }
    }).filter((d) => d.minutes > 0)

    const formatMinutes = (mins: number) => {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        if (h === 0) return `${m}m`
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Time by Category</h2>
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                    <button
                        type="button"
                        onClick={() => setPeriod('week')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${period === 'week' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                            }`}
                    >
                        This Week
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('month')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${period === 'month' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                            }`}
                    >
                        This Month
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                    <p className="text-muted text-sm">No session data for this period.</p>
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height={data.length * 50 + 20}>
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                            <XAxis
                                type="number"
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => formatMinutes(v)}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: '#F8FAFC', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                width={110}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                contentStyle={{
                                    background: '#1E293B',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#F8FAFC',
                                }}
                                formatter={(value: number | string | undefined) => [formatMinutes(Number(value) || 0), 'Time']}
                            />
                            <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={24}>
                                {data.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
