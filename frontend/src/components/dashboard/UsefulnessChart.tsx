import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CATEGORIES } from '../../constants/categories'
import type { Session } from '../../types'

interface UsefulnessChartProps {
    weekSessions: Session[]
    monthSessions: Session[]
}

type Period = 'week' | 'month'

export default function UsefulnessChart({ weekSessions, monthSessions }: UsefulnessChartProps) {
    const [period, setPeriod] = useState<Period>('week')
    const sessions = period === 'week' ? weekSessions : monthSessions

    const totalSessions = sessions.length
    const usefulSessions = sessions.filter((s) => s.was_useful).length
    const notUsefulSessions = totalSessions - usefulSessions

    const overallPercentage = totalSessions > 0 ? Math.round((usefulSessions / totalSessions) * 100) : 0

    const pieData = [
        { name: 'Useful', value: usefulSessions, color: '#10B981' }, // projects color (green)
        { name: 'Not Useful', value: notUsefulSessions, color: '#F87171' }, // red border color
    ]

    // Legend breakdown by category
    const categoryBreakdown = CATEGORIES.map((cat) => {
        const catSessions = sessions.filter((s) => s.category === cat.value)
        if (catSessions.length === 0) return null

        const catUseful = catSessions.filter((s) => s.was_useful).length
        const catTotal = catSessions.length
        const catPerc = Math.round((catUseful / catTotal) * 100)

        return {
            name: cat.label,
            color: cat.color,
            useful: catUseful,
            total: catTotal,
            percentage: catPerc,
        }
    }).filter(Boolean) as {
        name: string
        color: string
        useful: number
        total: number
        percentage: number
    }[]

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Session Quality</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                {totalSessions === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-10">
                        <p className="text-muted text-sm">No session data for this period.</p>
                    </div>
                ) : (
                    <>
                        {/* Donut Chart */}
                        <div className="relative h-48 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1E293B',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: '#F8FAFC',
                                        }}
                                        itemStyle={{ color: '#F8FAFC' }}
                                    />
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-white">{overallPercentage}%</span>
                                <span className="text-muted text-xs">Useful</span>
                            </div>
                        </div>

                        {/* Category Breakdown Legend */}
                        <div className="flex flex-col justify-center space-y-3">
                            <h3 className="text-sm font-medium text-white/80 mb-1">Breakdown by Category</h3>
                            {categoryBreakdown.map((cat) => (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-sm text-muted">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-white">
                                            {cat.useful} / {cat.total}
                                        </span>
                                        <span
                                            className={`text-xs w-10 text-right ${cat.percentage >= 50 ? 'text-projects' : 'text-red-400'
                                                }`}
                                        >
                                            {cat.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
