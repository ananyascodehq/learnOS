import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    UserCircle, Mail, GraduationCap, BookOpen,
    Calendar, LogOut, Building2
} from 'lucide-react'

export default function ProfilePage() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url

    const infoRows = [
        { icon: Mail, label: 'Email', value: profile?.email ?? user?.email },
        { icon: Building2, label: 'College', value: profile?.college },
        { icon: GraduationCap, label: 'Year', value: profile?.year ? `Year ${profile.year}` : null },
        { icon: BookOpen, label: 'Semester', value: profile?.semester ? `Semester ${profile.semester}` : null },
        {
            icon: Calendar,
            label: 'Semester Period',
            value: profile?.semester_start && profile?.semester_end
                ? `${new Date(profile.semester_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${new Date(profile.semester_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                : null,
        },
    ]

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-muted text-sm mt-1">Your account details and settings.</p>
            </div>

            {/* Avatar + name card */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-white/10"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <UserCircle className="w-8 h-8 text-primary" />
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-white text-lg font-semibold truncate">
                        {profile?.full_name ?? 'No name set'}
                    </p>
                    <p className="text-muted text-sm truncate">{profile?.email ?? user?.email}</p>
                </div>
            </div>

            {/* Info rows */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl divide-y divide-white/5">
                {infoRows.map(({ icon: Icon, label, value }) =>
                    value ? (
                        <div key={label} className="flex items-center gap-3 px-5 py-4">
                            <Icon className="w-4 h-4 text-muted shrink-0" />
                            <span className="text-muted text-sm w-28 shrink-0">{label}</span>
                            <span className="text-white text-sm truncate">{value}</span>
                        </div>
                    ) : null
                )}
            </div>

            {/* Sign out */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
