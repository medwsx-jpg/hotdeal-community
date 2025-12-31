import { Link } from 'react-router-dom'
import { TrendingUp, Zap, Users, Shield, ArrowRight, Bell, Briefcase } from 'lucide-react'
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
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">동네문화</span>
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
            왜 <span className="gradient-text">동네문화</span>인가?
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
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            다양한 <span className="gradient-text">카테고리</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div className="group relative overflow-hidden rounded-2xl glass-effect p-6 hover-lift">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
              <TrendingUp className="w-10 h-10 text-teal-500 mb-3" />
              <h3 className="text-lg font-bold mb-2">온라인 핫딜</h3>
              <p className="text-sm text-gray-600 mb-3">
                쇼핑몰, 마켓플레이스, 온라인 서비스의 최저가 정보
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">전자제품</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">패션</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">식품</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">도서</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl glass-effect p-6 hover-lift">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
              <TrendingUp className="w-10 h-10 text-cyan-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">오프라인 핫딜</h3>
              <p className="text-sm text-gray-600 mb-3">
                매장, 식당, 서비스업의 할인 및 이벤트 정보
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">외식</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">카페</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">뷰티</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">헬스</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl glass-effect p-6 hover-lift">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
              <Briefcase className="w-10 h-10 text-teal-500 mb-3" />
              <h3 className="text-lg font-bold mb-2">단기 알바</h3>
              <p className="text-sm text-gray-600 mb-3">
                하루, 일주일 단위의 단기 아르바이트 정보
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">이벤트</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">배달</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">서빙</span>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">프로모션</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl glass-effect p-6 hover-lift">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
              <Briefcase className="w-10 h-10 text-cyan-600 mb-3" />
              <h3 className="text-lg font-bold mb-2">장기 알바</h3>
              <p className="text-sm text-gray-600 mb-3">
                한 달 이상 장기 근무 가능한 아르바이트 정보
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">사무직</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">판매직</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">교육</span>
                <span className="px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">IT</span>
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
                <span className="text-base font-bold">동네문화</span>
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
            © 2024 동네문화. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}