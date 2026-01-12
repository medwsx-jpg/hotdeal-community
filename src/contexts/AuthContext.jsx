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
    // Kakao SDK 동적 로드
    const loadKakaoSDK = () => {
      return new Promise((resolve, reject) => {
        // 이미 로드되었으면 바로 리턴
        if (window.Kakao) {
          resolve()
          return
        }
  
        const loadKakaoSDK = () => {
          return new Promise((resolve, reject) => {
            if (window.Kakao) {
              resolve()
              return
            }
        
            const script = document.createElement('script')
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
            script.crossOrigin = 'anonymous'
            script.async = true
            
            script.onload = () => {
              console.log('✅ Kakao SDK 로드 완료')
              if (window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init('64cedc6ff60d40bf274419f1679aab75')
                console.log('🟡 Kakao SDK 초기화:', window.Kakao.isInitialized())
              }
              resolve()
            }
            
            script.onerror = () => {
              console.error('❌ Kakao SDK 로드 실패')
              reject(new Error('Failed to load Kakao SDK'))
            }
            
            document.head.appendChild(script)
          })
        }
        
        script.onload = () => {
          console.log('✅ Kakao SDK 로드 완료')
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init('64cedc6ff60d40bf274419f1679aab75')
            console.log('🟡 Kakao SDK 초기화:', window.Kakao.isInitialized())
          }
          resolve()
        }
        
        script.onerror = () => {
          console.error('❌ Kakao SDK 로드 실패')
          reject(new Error('Failed to load Kakao SDK'))
        }
        
        document.head.appendChild(script)
      })
    }
  
    // SDK 로드
    loadKakaoSDK().catch(err => {
      console.error('Kakao SDK 로드 에러:', err)
    })
  
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
    if (!window.Kakao) {
      alert('카카오 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      console.error('❌ Kakao SDK not loaded')
      return
    }
  
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init('64cedc6ff60d40bf274419f1679aab75')
    }
  
    try {
      // 카카오 로그인
      window.Kakao.Auth.login({
        success: async (authObj) => {
          console.log('🟡 카카오 로그인 성공:', authObj)
          
          // 카카오 사용자 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async (res) => {
              console.log('👤 카카오 사용자 정보:', res)
              
              const email = res.kakao_account?.email
              const nickname = res.properties?.nickname || '사용자'
              
              if (!email) {
                alert('이메일 정보를 가져올 수 없습니다.')
                return
              }
              
              // Supabase에 사용자 생성/로그인
              const tempPassword = `kakao_${res.id}_temp`
              
              // 먼저 로그인 시도
              let { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: tempPassword
              })
              
              // 로그인 실패하면 회원가입
              if (signInError) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: email,
                  password: tempPassword,
                  options: {
                    data: { username: nickname },
                    emailRedirectTo: `${window.location.origin}/feed`
                  }
                })
                
                if (signUpError) throw signUpError
                
                // 프로필 생성
                if (signUpData.user) {
                  const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                      id: signUpData.user.id,
                      username: nickname,
                      role: '회원'
                    }])
                  
                  if (profileError) console.error('프로필 생성 실패:', profileError)
                }
              }
              
              window.location.href = '/feed'
            },
            fail: (error) => {
              console.error('❌ 카카오 사용자 정보 실패:', error)
              alert('사용자 정보를 가져올 수 없습니다.')
            }
          })
        },
        fail: (err) => {
          console.error('❌ 카카오 로그인 실패:', err)
          alert('카카오 로그인 실패')
        }
      })
    } catch (error) {
      console.error('❌ 에러:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
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
      signInWithKakao,  // ← 추가!
      signInWithEmail, 
      signUpWithEmail, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}