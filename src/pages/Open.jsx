import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, X } from 'lucide-react'

export default function Open() {
  const navigate = useNavigate()
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // 이미 PWA로 설치되어 있으면 바로 이동
    if (window.matchMedia('(display-mode: standalone)').matches) {
      navigate('/feed')
      return
    }

    // PWA 설치 프롬프트 감지
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // 3초 후에도 프롬프트 안 뜨면 그냥 이동
    const timeout = setTimeout(() => {
      if (!showInstallPrompt) {
        navigate('/feed')
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      clearTimeout(timeout)
    }
  }, [navigate, showInstallPrompt])

  // PWA 설치하기
  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ PWA 설치 완료')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
    navigate('/feed')
  }

  // 나중에 하기
  const handleSkip = () => {
    setShowInstallPrompt(false)
    navigate('/feed')
  }

  if (!showInstallPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* 아이콘 */}
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          UDT79 앱 설치
        </h1>
        
        {/* 설명 */}
        <p className="text-gray-600 mb-8 text-center">
          홈 화면에 앱을 추가하고<br />
          언제든 빠르게 접속하세요!
        </p>

        {/* 혜택 */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 text-left bg-teal-50 rounded-lg p-3">
            <span className="text-2xl">⚡</span>
            <span className="text-sm text-gray-700">빠른 실행</span>
          </div>
          <div className="flex items-center space-x-3 text-left bg-cyan-50 rounded-lg p-3">
            <span className="text-2xl">📱</span>
            <span className="text-sm text-gray-700">앱처럼 사용</span>
          </div>
          <div className="flex items-center space-x-3 text-left bg-purple-50 rounded-lg p-3">
            <span className="text-2xl">🔔</span>
            <span className="text-sm text-gray-700">알림 받기 (준비중)</span>
          </div>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleInstall}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg mb-3"
        >
          홈 화면에 추가
        </button>

        <button
          onClick={handleSkip}
          className="w-full text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
        >
          나중에 하기
        </button>
      </div>
    </div>
  )
}