import { Link } from 'react-router-dom'
import { TrendingUp, Zap, Users, Shield, ArrowRight, Bell, Briefcase, Flame, Share2, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()
const { user, loading } = useAuth()

useEffect(() => {
  if (!loading && user) {
    navigate('/feed')
  }
}, [user, loading, navigate])

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full glass-effect z-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="UDT79" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold gradient-text">UDT79</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/feed" className="text-sm text-gray-700 hover:text-teal-600 font-medium transition-colors">
                둘러보기
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-semibold hover-lift shadow-lg shadow-teal-500/30"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              놓치면 후회할
              <br />
              <span className="gradient-text">최고의 기회</span>를 찾다
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
              실시간 핫딜 정보와 알바 기회를 한 곳에서. 
              커뮤니티가 검증한 진짜 정보만 공유합니다.
            </p>
            <div className="flex justify-center space-x-3">
              <Link 
                to="/login"
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm hover-lift shadow-2xl shadow-teal-500/40 transform hover:scale-105 transition-all"
              >
                무료로 시작하기
              </Link>
              <button className="px-6 py-3 glass-effect rounded-xl text-sm font-semibold text-gray-700 hover-lift">
                더 알아보기
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16">
            <div className="text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">1,234</div>
              <div className="text-sm text-gray-600">오늘의 핫딜</div>
            </div>
            <div className="text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">5,678</div>
              <div className="text-sm text-gray-600">활성 회원</div>
            </div>
            <div className="text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">89%</div>
              <div className="text-sm text-gray-600">만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            왜 <span className="gradient-text">UDT79</span>인가?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">실시간 업데이트</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                최신 핫딜과 알바 정보를 실시간으로 받아보세요. 
                놓칠 수 없는 기회를 가장 먼저 알려드립니다.
              </p>
            </div>

            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">커뮤니티 검증</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                회원들이 직접 검증한 정보만 공유됩니다. 
                허위 정보 걱정 없이 안심하고 이용하세요.
              </p>
            </div>

            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">맞춤 알림</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                관심 카테고리를 설정하고 원하는 정보만 
                골라서 받아보세요. 시간을 절약하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
<section className="py-20 bg-gradient-to-b from-white to-gray-50">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">다양한 카테고리</h2>
      <p className="text-gray-600 text-lg">UDT79 에서 찾을 수 있는 모든 것</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 핫딜 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">핫딜</h3>
        <p className="text-sm text-gray-600 mb-4">
          지역내 모든 전단지, 매장의 할인 정보, 행사 정보
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <TrendingUp className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <span>식탁, 카페, 마트, 매장, 프리마켓, 행사</span>
        </div>
      </div>

      {/* 쉐어 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">쉐어</h3>
        <p className="text-sm text-gray-600 mb-4">
          생활에 필요한 모든것 나눠쓰고, 빌려쓰는 개념의 쉐어링
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <span>생활용품, 부동산, 기타</span>
        </div>
      </div>

      {/* JOB */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">JOB</h3>
        <p className="text-sm text-gray-600 mb-4">
          지역 내 간단, 단기, 장기 일자리 구인정보와 구직 정보
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <Briefcase className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
          <span>구인, 구직, JOB썰</span>
        </div>
      </div>

      {/* 톡 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">톡</h3>
        <p className="text-sm text-gray-600 mb-4">
          공유하며 함께 생활하는 우리의 톡
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <MessageCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <span>수다, 토닥, Q&A, 꿀팁</span>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto glass-effect rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 animate-pulse-slow"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3">
              지금 바로 <span className="gradient-text">시작하세요</span>
            </h2>
            <p className="text-base text-gray-600 mb-6">
              무료 회원가입하고 최고의 핫딜과 알바 정보를 받아보세요
            </p>
            <Link 
              to="/login"
              className="inline-block px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm hover-lift shadow-2xl shadow-teal-500/40 transform hover:scale-105 transition-all"
            >
              무료로 가입하기
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold">UDT79</span>
              </div>
              <p className="text-gray-400 text-xs">
                최고의 핫딜과 알바 정보를 공유하는 커뮤니티
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">서비스</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">핫딜 찾기</a></li>
                <li><a href="#" className="hover:text-white transition-colors">알바 찾기</a></li>
                <li><a href="#" className="hover:text-white transition-colors">커뮤니티</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">회사</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">소개</a></li>
                <li><a href="#" className="hover:text-white transition-colors">팀</a></li>
                <li><a href="#" className="hover:text-white transition-colors">채용</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">지원</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">도움말</a></li>
                <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-xs">
            © 2024 UDT79. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}