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
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 프로필 가져오기
const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
  
      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 생성
        await createProfile(userId)
      } else if (error) {
        console.error('Profile fetch error:', error)
        setProfile(null) // 에러 시에도 계속 진행
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null) // 에러 시에도 계속 진행
    } finally {
      setLoading(false) // 반드시 loading 해제!
    }
  }

  // 프로필 생성
  const createProfile = async (userId) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: userData.user?.user_metadata?.name || '사용자',
            full_name: userData.user?.user_metadata?.full_name,
            avatar_url: userData.user?.user_metadata?.avatar_url,
            role: '회원'
          }
        ])
        .select()
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  // 구글 로그인
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/feed`
      }
    })
    if (error) throw error
  }

  // 이메일 로그인
  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  // 이메일 회원가입
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

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}