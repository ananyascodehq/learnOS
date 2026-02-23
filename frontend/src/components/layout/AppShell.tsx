import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
    LayoutDashboard,
    History,
    ListChecks,
    Users,
    GraduationCap,
    UserCircle,
    LogOut,
    Plus,
    BookOpen,
    Menu,
    X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'History', path: '/history', icon: History },
    { label: 'Next Actions', path: '/next-actions', icon: ListChecks },
    { label: 'Friends', path: '/friends', icon: Users },
    { label: 'NPTEL', path: '/nptel', icon: GraduationCap },
    { label: 'Profile', path: '/profile', icon: UserCircle },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const handleLogout = async () => {
        await signOut()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-screen bg-dark flex">
            {/* ===== Desktop Sidebar ===== */}
            <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-white/5 bg-dark/80 backdrop-blur-sm fixed h-screen z-30">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/5">
                    <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">LearnOS</span>
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="px-3 py-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 w-full cursor-pointer"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ===== Main content area ===== */}
            <div className="flex-1 md:ml-64 lg:ml-72 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-dark/80 backdrop-blur-sm border-b border-white/5">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3">
                        {/* Mobile menu + date */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden text-muted hover:text-white transition-colors cursor-pointer"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <p className="text-white font-semibold text-sm md:text-base">
                                    {profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]}` : 'Welcome'}
                                </p>
                                <p className="text-muted text-xs">{today}</p>
                            </div>
                        </div>

                        {/* Right side: Log Session + Avatar */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/log')}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Log Session</span>
                            </button>

                            {(user?.user_metadata?.avatar_url || profile?.avatar_url) && (
                                <img
                                    src={profile?.avatar_url ?? user?.user_metadata?.avatar_url}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full border border-white/10"
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
                    {children}
                </main>
            </div>

            {/* ===== Mobile Bottom Nav ===== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark/95 backdrop-blur-sm border-t border-white/5">
                <div className="flex items-center justify-around py-2">
                    {navItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* ===== Mobile Sidebar Overlay ===== */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-dark border-r border-white/5 z-50 md:hidden flex flex-col animate-in slide-in-from-left">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">LearnOS</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-muted hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 py-4 px-3 space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/'}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                            ? 'bg-primary/15 text-primary'
                                            : 'text-muted hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* Footer */}
                        <div className="px-3 py-4 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 w-full cursor-pointer"
                            >
                                <LogOut className="w-5 h-5 shrink-0" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </div>
    )
}
