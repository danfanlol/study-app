'use client'

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    function applySession(session: Session | null) {
      if (!mounted) return

      setUser((previousUser) => {
        const nextUser = session?.user ?? null

        if (previousUser?.id === nextUser?.id) {
          return previousUser
        }

        return nextUser
      })
      setLoading(false)
    }

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      applySession(session)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      applySession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return value
}
