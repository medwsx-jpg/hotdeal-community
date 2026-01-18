import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📦 세션:', session ? '있음' : '없음')
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            console.log('👤 프로필:', data)
            setProfile(data)
          })
      }
    })
  
    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 이벤트:', event)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              setProfile(data)
            })
        } else {
          setProfile(null)
        }
      }
    )
  
    return () => subscription.unsubscribe()
  }, [])
  
  // 포인트 실시간 업데이트
  useEffect(() => {
    if (!user?.id) return

    console.log('🔔 Realtime 구독 시작:', user.id)

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 포인트 업데이트 받음!', payload)
          console.log('새 포인트:', payload.new.points)
          setProfile(payload.new)
        }
      )
      .subscribe((status) => {
        console.log('📡 구독 상태:', status)
      })

    return () => {
      console.log('🔕 Realtime 구독 해제')
      supabase.removeChannel(channel)
    }
  }, [user?.id])
  
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/feed`
      }
    })
    if (error) throw error
  }

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/feed`
      }
    })
    if (error) throw error
  }

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/feed`
      }
    })
    if (error) throw error
  }

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // 명시적으로 상태 초기화
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithGitHub,
      signInWithKakao,
      signInWithEmail, 
      signUpWithEmail, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}