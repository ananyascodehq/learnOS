import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileSetupPage() {
    const { user, profile, refreshProfile } = useAuth()
    const navigate = useNavigate()

    const [fullName, setFullName] = useState(profile?.full_name ?? user?.user_metadata?.full_name ?? '')
    const [college, setCollege] = useState(profile?.college ?? '')
    const [year, setYear] = useState<number | ''>(profile?.year ?? '')
    const [semester, setSemester] = useState<number | ''>(profile?.semester ?? '')
    const [semesterStart, setSemesterStart] = useState(profile?.semester_start ?? '')
    const [semesterEnd, setSemesterEnd] = useState(profile?.semester_end ?? '')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) return

        if (!fullName || !college || !year || !semester || !semesterStart || !semesterEnd) {
            toast.error('Please fill in all fields')
            return
        }

        setSaving(true)

        const { error } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                email: user.email!,
                full_name: fullName,
                college,
                year: Number(year),
                semester: Number(semester),
                semester_start: semesterStart,
                semester_end: semesterEnd,
                avatar_url: user.user_metadata?.avatar_url ?? null,
            })

        setSaving(false)

        if (error) {
            toast.error('Failed to save profile. Please try again.')
            console.error('Profile save error:', error)
            return
        }

        await refreshProfile()
        toast.success('Profile saved!')
        navigate('/', { replace: true })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-learning/20 blur-[120px]" />

            <div className="relative z-10 w-full max-w-lg mx-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
                    </div>
                    <p className="text-muted text-sm mb-8">Tell us a bit about yourself to get started.</p>

                    {/* User info from Google (read-only) */}
                    <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
                        {user?.user_metadata?.avatar_url && (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <div>
                            <p className="text-white text-sm font-medium">{user?.email}</p>
                            <p className="text-muted text-xs">Signed in with Google</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                        </div>

                        {/* College Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">College Name</label>
                            <input
                                type="text"
                                value={college}
                                onChange={(e) => setCollege(e.target.value)}
                                placeholder="e.g. IIT Bombay"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                        </div>

                        {/* Year & Semester row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Year of Study</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-dark">Select</option>
                                    {[1, 2, 3, 4].map((y) => (
                                        <option key={y} value={y} className="bg-dark">Year {y}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Semester</label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-dark">Select</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                        <option key={s} value={s} className="bg-dark">Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Semester Dates row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Semester Start</label>
                                <input
                                    type="date"
                                    value={semesterStart}
                                    onChange={(e) => setSemesterStart(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Semester End</label>
                                <input
                                    type="date"
                                    value={semesterEnd}
                                    onChange={(e) => setSemesterEnd(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            {saving ? 'Saving...' : 'Get Started →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
