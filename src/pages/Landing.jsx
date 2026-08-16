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
            <img src="/logo.png" alt="우리동네플러스" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold gradient-text">우리동네플러스</span>
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
              서민을 위한
              <br />
              <span className="gradient-text">정책자금 정보</span>를 한눈에
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
              정부대출, 미소금융, 소상공인지원, 금리변동 정보와
              실제 경험담을 한 곳에서. 검증된 정보만 공유합니다.
            </p>
            <div className="flex justify-center space-x-3">
              <Link
                to="/login"
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm hover-lift shadow-2xl shadow-teal-500/40 transform hover:scale-105 transition-all"
              >
                무료로 시작하기
              </Link>
              <Link
                to="/feed"
                className="px-6 py-3 glass-effect rounded-xl text-sm font-semibold text-gray-700 hover-lift"
              >
                둘러보기
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-16">
            <div className="text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">10+</div>
              <div className="text-sm text-gray-600">정책자금 가이드</div>
            </div>
            <div className="text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">100+</div>
              <div className="text-sm text-gray-600">실제 경험담</div>
            </div>
            <div className="text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="text-3xl font-bold gradient-text mb-1">매일</div>
              <div className="text-sm text-gray-600">금리 업데이트</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            왜 <span className="gradient-text">우리동네플러스</span>인가?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">정책자금 한눈에</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                정부대출, 미소금융, 소상공인지원 등
                서민을 위한 정책자금 정보를 한곳에서 확인하세요.
              </p>
            </div>

            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">실제 경험담</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                대출 성공기, 실패기, Q&A까지.
                실제 이용자들의 생생한 경험을 공유합니다.
              </p>
            </div>

            <div className="glass-effect p-6 rounded-2xl hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">금리 변동 알림</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                기준금리 변동과 서민 대출 영향을
                실시간으로 확인하세요.
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
      <p className="text-gray-600 text-lg">우리동네플러스에서 찾을 수 있는 모든 것</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 정책자금정보 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">정책자금정보</h3>
        <p className="text-sm text-gray-600 mb-4">
          서민을 위한 정부대출, 미소금융, 소상공인지원 정보
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <TrendingUp className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <span>정부대출, 미소금융, 소상공인지원, 금리변동</span>
        </div>
      </div>

      {/* 경험담 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">경험담</h3>
        <p className="text-sm text-gray-600 mb-4">
          대출 성공기, 실패기, Q&A 등 실제 이용 후기
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <span>성공기, 실패기, Q&A</span>
        </div>
      </div>

      {/* 톡 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">톡</h3>
        <p className="text-sm text-gray-600 mb-4">
          자유로운 소통과 정보 공유의 공간
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <MessageCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <span>수다, 토닥, Q&A, 꿀팁</span>
        </div>
      </div>

      {/* 공지 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">공지</h3>
        <p className="text-sm text-gray-600 mb-4">
          서비스 업데이트와 중요 안내사항
        </p>
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <Shield className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>공지사항, 이벤트, 업데이트</span>
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
              무료 회원가입하고 서민을 위한 정책자금 정보를 받아보세요
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
                <span className="text-base font-bold">우리동네플러스</span>
              </div>
              <p className="text-gray-400 text-xs">
                서민을 위한 정책자금 정보를 공유하는 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">서비스</h4>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">정책자금정보</a></li>
                <li><a href="#" className="hover:text-white transition-colors">경험담</a></li>
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
            © 2025 우리동네플러스. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
