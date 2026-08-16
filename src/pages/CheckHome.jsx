import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function CheckHome() {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>30초 공식확인 - 우리동네플러스</title>
        <meta name="description" content="로그인 없이 30초만에 공식 확인 창구와 준비할 내용을 알려드립니다." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">⚡ 30초 공식확인</h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 안내 문구 */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">오늘 내가 먼저 확인할 정책은 어디일까요?</h2>
            <p className="text-sm text-gray-500 mt-2">로그인 없이, 30초만에 공식 확인 창구와 준비할 내용을 알려드립니다.</p>
          </div>

          <div className="space-y-4">
            {/* 생활·복지 확인 */}
            <div className="bg-white border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏠</span>
                <h3 className="text-base font-bold text-blue-800">생활·복지 확인</h3>
                <span className="text-xs text-blue-400 ml-auto">정부24·복지로</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">정부24·복지로에서 먼저 확인할 혜택을 정리합니다.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-default">
                  <span className="text-lg flex-shrink-0">🔜</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 leading-tight">에너지바우처</p>
                    <p className="text-xs text-gray-300 mt-0.5">준비중</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-default">
                  <span className="text-lg flex-shrink-0">🔜</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 leading-tight">근로장려금</p>
                    <p className="text-xs text-gray-300 mt-0.5">준비중</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 취업·직업훈련 확인 */}
            <div className="bg-white border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💼</span>
                <h3 className="text-base font-bold text-green-800">취업·직업훈련 확인</h3>
                <span className="text-xs text-green-400 ml-auto">고용24</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">고용24에서 먼저 볼 지원을 안내합니다.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/check/maternity-benefit-uninsured-2026" className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg px-3 py-3 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-lg flex-shrink-0">🤰</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">출산급여 150만원</p>
                    <p className="text-xs text-pink-100 mt-0.5">30초 체크 →</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-default">
                  <span className="text-lg flex-shrink-0">🔜</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 leading-tight">준비 중</p>
                    <p className="text-xs text-gray-300 mt-0.5">곧 추가됩니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 사업 운영·소상공인 확인 */}
            <div className="bg-white border border-teal-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏪</span>
                <h3 className="text-base font-bold text-teal-800">사업 운영·소상공인 확인</h3>
                <span className="text-xs text-teal-400 ml-auto">소상공인24·기업마당</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">소상공인24·기업마당의 공식 공고를 찾습니다.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/check/small-biz-fund-2026" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg px-3 py-3 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-lg flex-shrink-0">🩺</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">소상공인 정책자금</p>
                    <p className="text-xs text-teal-100 mt-0.5">30초 체크 →</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-default">
                  <span className="text-lg flex-shrink-0">🔜</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 leading-tight">준비 중</p>
                    <p className="text-xs text-gray-300 mt-0.5">곧 추가됩니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 폐업·재기 지원 확인 */}
            <div className="bg-white border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔄</span>
                <h3 className="text-base font-bold text-amber-800">폐업·재기 지원 확인</h3>
                <span className="text-xs text-amber-400 ml-auto">소상공인24</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">폐업일·임대차 조건을 바탕으로 공식 확인 순서를 안내합니다.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/check/hope-return-demolition-2026" className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg px-3 py-3 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-lg flex-shrink-0">🏗️</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">점포철거비 지원</p>
                    <p className="text-xs text-amber-100 mt-0.5">30초 체크 →</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 bg-gray-100 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-default">
                  <span className="text-lg flex-shrink-0">🔜</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-400 leading-tight">준비 중</p>
                    <p className="text-xs text-gray-300 mt-0.5">곧 추가됩니다</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 안내 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">이 체크는 공고문 기준 사전 확인용이며, 최종 자격·지급 여부는 공식기관의 심사로 결정됩니다.</p>
          </div>
        </div>
      </div>
    </>
  )
}
