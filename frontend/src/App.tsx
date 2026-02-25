import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import DashboardPage from './pages/DashboardPage'
import LogSessionPage from './pages/LogSessionPage'
import HistoryPage from './pages/HistoryPage'
import NextActionsPage from './pages/NextActionsPage'
import FriendsPage from './pages/FriendsPage'
import NptelPage from './pages/NptelPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Auth required but no shell */}
        <Route path="/setup-profile" element={<ProfileSetupPage />} />

        {/* Protected routes with AppShell */}
        <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/log" element={<ProtectedLayout><LogSessionPage /></ProtectedLayout>} />
        <Route path="/history" element={<ProtectedLayout><HistoryPage /></ProtectedLayout>} />
        <Route path="/next-actions" element={<ProtectedLayout><NextActionsPage /></ProtectedLayout>} />
        <Route path="/friends" element={<ProtectedLayout><FriendsPage /></ProtectedLayout>} />
        <Route path="/nptel" element={<ProtectedLayout><NptelPage /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />

        {/* 404 – redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
