import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Not logged in → redirect to login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Logged in but profile incomplete → redirect to setup
    if (profile && (!profile.full_name || !profile.college || !profile.year || !profile.semester)) {
        return <Navigate to="/setup-profile" replace />
    }

    return <>{children}</>
}
