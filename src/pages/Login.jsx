import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Mail, Chrome, Linkedin, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('buttons') // 'buttons', 'login', 'signup'
  
  // 폼 상태
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      await signInWithGoogle()
    } catch (error) {
      setError('로그인 실패: ' + error.message)
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      await signInWithEmail(email, password)
      navigate('/feed')
    } catch (error) {
      setError('로그인 실패: ' + error.message)
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
  
    try {
      await signUpWithEmail(email, password, username)
      alert('회원가입 완료! 이메일을 확인하고 인증 링크를 클릭해주세요.')
      // navigate('/feed') 제거 - 이메일 확인 필요
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">동네문화</span>
        </Link>

        {/* Login Card */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl animate-fade-in">
          {/* Back Button */}
          {mode !== 'buttons' && (
            <button
              onClick={() => setMode('buttons')}
              className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>돌아가기</span>
            </button>
          )}

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'signup' ? '회원가입' : '로그인'}
            </h1>
            <p className="text-sm text-gray-600">
              동네문화는 프로덕트에 진심인 메이커들을 위한 공간이에요.
            </p>
          </div>

          {/* Benefits */}
          {mode === 'buttons' && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <span className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs mr-2">✓</span>
                중요하게 생각하는 가치들
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-start">
                  <span className="text-teal-500 mr-1.5">•</span>
                  <span>새로 생각하는데 도움을 줍니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-1.5">•</span>
                  <span>새로 열정을 최대 혜택으로 이어지게 합니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-1.5">•</span>
                  <span>감정적 유대관계를 쌓게 해줘요.</span>
                </li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Login Buttons Mode */}
          {mode === 'buttons' && (
            <div className="space-y-2.5 mb-5">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2.5 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover-lift hover:border-teal-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Chrome className="w-4 h-4 text-gray-600 group-hover:text-teal-500 transition-colors" />
                </div>
                <span>{loading ? '로그인 중...' : '구글 계정으로 로그인'}</span>
              </button>

              <button 
                disabled
                className="w-full flex items-center justify-center space-x-2.5 px-5 py-3 bg-[#0077B5] border-2 border-[#0077B5] rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              >
                <Linkedin className="w-4 h-4" />
                <span>링크드인 (준비 중)</span>
              </button>

              <button 
                onClick={() => setMode('login')}
                className="w-full flex items-center justify-center space-x-2.5 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover-lift hover:border-teal-300 transition-all group"
              >
                <Mail className="w-4 h-4 text-gray-600 group-hover:text-teal-500 transition-colors" />
                <span>이메일 계정으로 로그인</span>
              </button>
            </div>
          )}

          {/* Email Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold mb-2">이메일</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-semibold hover-lift shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-sm text-teal-600 hover:underline"
                >
                  계정이 없으신가요? 회원가입
                </button>
              </div>
            </form>
          )}

          {/* Email Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold mb-2">사용자 이름</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">이메일</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">비밀번호 (최소 6자)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-semibold hover-lift shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-teal-600 hover:underline"
                >
                  이미 계정이 있으신가요? 로그인
                </button>
              </div>
            </form>
          )}

          {/* Terms */}
          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            동네문화의{' '}
            <a href="#" className="text-teal-600 hover:underline font-medium">
              이용 약관
            </a>{' '}
            및{' '}
            <a href="#" className="text-teal-600 hover:underline font-medium">
              개인정보 처리방침
            </a>
            에 동의합니다.
          </p>
        </div>

        {/* Community Etiquette */}
        <div className="mt-6 glass-effect rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-2.5 flex items-center text-xs">
            <span className="mr-1.5">📌</span>
            커뮤니티 멤버들의 에티켓
          </h3>
          
          <div className="space-y-2.5 text-xs">
            <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
              <p className="text-emerald-800 font-medium mb-1">서로에 대한 존중과 배려심을 갖고 소통해요.</p>
              <p className="text-emerald-700 text-[11px]">
                동네문화는 건설적인 대화를 하는 공간입니다. 서로의 감정과 상황을 이해하며 비난보다는 
                상대방에게 정중하게 질문하고 도움을 주고받아요.
              </p>
            </div>

            <div className="bg-teal-50 rounded-lg p-2.5 border border-teal-200">
              <p className="text-teal-800 font-medium mb-1">나와 다름을 배척하지 않아요.</p>
              <p className="text-teal-700 text-[11px]">
                다양한 관점은 우리가 진실에 가까워지도록 도와줍니다. 그 관점이 나와 다르더라도 
                존중해주세요.
              </p>
            </div>

            <div className="bg-cyan-50 rounded-lg p-2.5 border border-cyan-200">
              <p className="text-cyan-800 font-medium mb-1">도움을 받았으면 감사를 표현해요.</p>
              <p className="text-cyan-700 text-[11px]">
                서로 돕고 배려하는 커뮤니티를 만들기 위해 감사의 표현을 아끼지 마세요.
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <Link to="/" className="text-gray-600 hover:text-teal-600 text-xs font-medium transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}