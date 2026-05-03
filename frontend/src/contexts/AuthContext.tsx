import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'
<<<<<<< HEAD
import { Toaster } from 'sonner'
=======
import toast from 'sonner'
>>>>>>> eef8884 (fix ThemeContext)

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, roles: string[]) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUser(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      setLoading(false)
      return
    }

    setUser(data)
    setLoading(false)
  }

  const signUp = async (email: string, password: string, fullName: string, roles: string[]) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Generate unique referral code
      const referralCode = `KHUB-${fullName.replace(/\s/g, '').toUpperCase()}-${Math.random().toString(36).substr(2, 6)}`

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          roles,
          referral_code: referralCode
        })

      if (profileError) throw profileError

      // Create wallet for user
      await supabase
        .from('wallets')
        .insert({ user_id: authData.user.id })

      toast.success('Account created! Please verify your email.')
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    toast.success('Welcome back!')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    if (error) throw error

    setUser({ ...user, ...data })
    toast.success('Profile updated!')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
