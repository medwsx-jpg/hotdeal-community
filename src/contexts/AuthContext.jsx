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

  // 프로필 가져오기
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
  
      if (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // 세션 만료 시간 로그 (디버깅용)
      if (session) {
        const expiresAt = new Date(session.expires_at * 1000)
        console.log('현재 세션 만료 시간:', expiresAt.toLocaleString('ko-KR'))
      }
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }
  
    initAuth()
  
    // 세션 상태 변화 감지 (자동 갱신 포함)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth Event:', event) // 디버깅용
        
        // 이벤트별 처리
        if (event === 'SIGNED_IN') {
          console.log('✅ 로그인 성공')
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('🚪 로그아웃됨 - 랜딩페이지로 이동')
          setUser(null)
          setProfile(null)
          window.location.href = '/'
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 세션 자동 갱신됨!')
          const expiresAt = new Date(session.expires_at * 1000)
          console.log('새 만료 시간:', expiresAt.toLocaleString('ko-KR'))
          // 사용자 정보는 유지되므로 별도 처리 불필요
        }
        
        if (event === 'USER_UPDATED') {
          console.log('👤 사용자 정보 업데이트됨')
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
        
        // 일반적인 세션 변화 처리
        if (!event.includes('REFRESH')) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
        }
      }
    )
  
    return () => subscription.unsubscribe()
  }, [])

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

  // GitHub 로그인
  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
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
    // onAuthStateChange에서 SIGNED_OUT 이벤트로 window.location.href = '/' 처리됨
  }

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}