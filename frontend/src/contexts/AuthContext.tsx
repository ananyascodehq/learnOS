import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User as Profile } from '../types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch the user's profile from public.users
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }
        return data
    }

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                setUser(session.user)
                const userProfile = await fetchProfile(session.user.id)
                setProfile(userProfile)
            }

            setLoading(false)
        }

        getInitialSession()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user)
                    const userProfile = await fetchProfile(session.user.id)
                    setProfile(userProfile)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })
        if (error) {
            console.error('Error signing in with Google:', error)
            throw error
        }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }

    const value: AuthContextType = {
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
