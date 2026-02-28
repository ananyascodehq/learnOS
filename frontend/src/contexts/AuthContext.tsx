import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User as Profile } from '../types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
    deleteAllData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch the user's profile from public.users
    const fetchProfile = useCallback(async (userId: string) => {
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
    }, [])

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
                // On INITIAL_SESSION, the user is already set by getInitialSession, so we can ignore it
                // and avoid a re-render.
                if (event === 'INITIAL_SESSION') return

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user)
                    const userProfile = await fetchProfile(session.user.id)
                    setProfile(userProfile)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setProfile(null)
                }

                // We only care about loading on the initial session load.
                // setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchProfile])

    const signInWithGoogle = useCallback(async () => {
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
    }, [])

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }, [])

    const deleteAllData = useCallback(async () => {
        if (!user) return;

        try {
            await Promise.all([
                supabase.from('sessions').delete().eq('user_id', user.id),
                supabase.from('nptel_courses').delete().eq('user_id', user.id),
                supabase.from('friendships').delete().or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
                supabase.from('users').delete().eq('id', user.id),
            ]);
            await signOut();
        } catch (error) {
            console.error('Error deleting data:', error);
            throw error;
        }
    }, [user, signOut]);

    const value: AuthContextType = useMemo(() => ({
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        deleteAllData
    }), [user, profile, loading, signInWithGoogle, signOut, deleteAllData])

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
