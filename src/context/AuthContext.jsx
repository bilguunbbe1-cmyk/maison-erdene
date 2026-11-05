import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  // undefined = still checking, null = signed out
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Do not call Supabase inside this callback: it can deadlock the auth lock.
      // The profile loads in the effect below, when the user id changes.
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data)
    setProfileLoading(false)
  }, [userId])

  useEffect(() => {
    if (session !== undefined) loadProfile()
  }, [session, loadProfile])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      profile,
      // This only controls what the UI shows. The real protection is RLS.
      isAdmin: profile?.role === 'admin',
      loading: session === undefined || profileLoading,
      refreshProfile: loadProfile,
      signOut: () => supabase.auth.signOut(),
    }),
    [session, profile, profileLoading, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
