import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, RotateCcw, ExternalLink, AlertTriangle, CheckCircle, HelpCircle, XCircle, Info, Home, Phone } from 'lucide-react'
import { visibleQuestions, evaluate } from '../policy/policyEngine'

/** 상태별 스타일 설정 */
const STATUS_STYLE = {
  check_first: {
    bg: 'bg-emerald-50', border: 'border-emerald-400',
    iconBg: 'bg-emerald-100', title: 'text-emerald-800',
    Icon: CheckCircle, iconColor: 'text-emerald-600',
  },
  needs_official_check: {
    bg: 'bg-amber-50', border: 'border-amber-400',
    iconBg: 'bg-amber-100', title: 'text-amber-800',
    Icon: HelpCircle, iconColor: 'text-amber-600',
  },
  likely_mismatch: {
    bg: 'bg-red-50', border: 'border-red-400',
    iconBg: 'bg-red-100', title: 'text-red-800',
    Icon: XCircle, iconColor: 'text-red-600',
  },
  review_required: {
    bg: 'bg-blue-50', border: 'border-blue-400',
    iconBg: 'bg-blue-100', title: 'text-blue-800',
    Icon: Info, iconColor: 'text-blue-600',
  },
}

export default function PolicyCheck() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(-1)   // -1 = 인트로 화면
  const [result, setResult] = useState(null)

  // 정책 JSON 로드
  useEffect(() => {
    setLoading(true)
    fetch(`/policies/${slug}.json`)
      .then(r => {
        if (!r.ok) throw new Error('정책 정보를 찾을 수 없습니다.')
        return r.json()
      })
      .then(data => { setPolicy(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [slug])

  // 현재 보이는 질문 목록 (조건부 표시)
  const questions = policy ? visibleQuestions(policy, answers) : []
  const currentQ = step >= 0 && step < questions.length ? questions[step] : null
  const progress = questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0

  // step이 questions 범위를 초과하면 보정
  useEffect(() => {
    if (step >= 0 && step >= questions.length && questions.length > 0) {
      setStep(questions.length - 1)
    }
  }, [questions.length, step])

  /** 단일 선택 핸들러 (radio / select) */
  const handleSelect = (key, value) => {
    let next = { ...answers, [key]: value }
    // 다중 패스 클리어: 조건부 질문이 사라지면 해당 답변도 제거
    if (policy) {
      let prevSize = -1
      while (Object.keys(next).length !== prevSize) {
        prevSize = Object.keys(next).length
        const vis = visibleQuestions(policy, next)
        const visKeys = new Set(vis.map(q => q.key))
        for (const k of Object.keys(next)) {
          if (k !== key && !visKeys.has(k)) delete next[k]
        }
      }
    }
    setAnswers(next)
  }

  /** 다중 선택 핸들러 (multi_select) */
  const handleMultiSelect = (key, value) => {
    const current = answers[key] || []
    // "none" 은 배타적 선택
    if (value === 'none') {
      handleSelect(key, current.includes('none') ? [] : ['none'])
      return
    }
    let next = current.filter(v => v !== 'none')
    next = next.includes(value) ? next.filter(v => v !== value) : [...next, value]
    handleSelect(key, next)
  }

  /** 현재 질문에 답변이 있는지 확인 */
  const canAdvance = () => {
    if (!currentQ) return false
    if (!currentQ.required) return true
    const v = answers[currentQ.key]
    if (v === undefined || v === null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }

  /** 다음 단계 또는 진단 실행 */
  const handleNext = () => {
    const qs = visibleQuestions(policy, answers)
    if (step < qs.length - 1) {
      setStep(step + 1)
    } else {
      setResult(evaluate(policy, answers))
    }
  }

  /** 이전 단계 */
  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
    else if (step === 0) setStep(-1)
  }

  /** 처음으로 */
  const handleReset = () => {
    setAnswers({})
    setStep(-1)
    setResult(null)
  }

  // ─── 로딩 ───
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">정책 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // ─── 에러 ───
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/feed')}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!policy) return null

  // ─── 결과 화면 ───
  if (result) {
    const style = STATUS_STYLE[result.status] || STATUS_STYLE.needs_official_check
    const StatusIcon = style.Icon

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
            <button onClick={handleReset} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="ml-2 text-lg font-bold text-gray-800 truncate">체크 결과</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* 메인 결과 카드 */}
          <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-6`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-7 h-7 ${style.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl font-bold ${style.title} mb-2`}>{result.title}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.body}</p>
                {result.limitNote && (
                  <div className="mt-3 text-sm text-gray-600 bg-white/60 rounded-lg p-3 leading-relaxed">
                    {result.limitNote}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 신청 버튼 */}
          {result.meta.applyUrl && result.status === 'check_first' && (
            <a
              href={result.meta.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-teal-500/25"
            >
              공식 사이트에서 신청 확인하기
              <ExternalLink className="w-5 h-5" />
            </a>
          )}

          {/* 교차 안내 */}
          {result.crossSell && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 leading-relaxed">{result.crossSell}</p>
            </div>
          )}

          {/* 꼭 확인하세요 */}
          {result.notes && result.notes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-base">꼭 확인하세요</h3>
              <div className="space-y-2">
                {result.notes.map((note, i) => (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <span>{note}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 결과가 달라질 수 있는 조건 */}
          {result.unknownIf && result.unknownIf.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-amber-800 text-sm">다음 경우 결과가 달라질 수 있습니다</h4>
              {result.unknownIf.map((item, i) => (
                <p key={i} className="text-sm text-amber-700 flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>{item}</span>
                </p>
              ))}
            </div>
          )}

          {/* 문의처 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-500" /> 문의처
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>중소기업통합콜센터: <a href="tel:1357" className="text-teal-600 font-semibold">1357</a></p>
              <p>소상공인통합콜센터: <a href="tel:1533-0100" className="text-teal-600 font-semibold">1533-0100</a> (내선 1번)</p>
            </div>
          </div>

          {/* 출처 정보 */}
          <div className="bg-gray-100 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">출처 정보</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{result.meta.title}</p>
              <p>{result.meta.owner}</p>
              {result.meta.sourcePublishedAt && <p>공고일: {result.meta.sourcePublishedAt}</p>}
              {result.meta.checkedAt && <p>확인일: {result.meta.checkedAt}</p>}
              {result.meta.sourceUrl && (
                <a
                  href={result.meta.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline inline-flex items-center gap-1"
                >
                  원문 공고 보기 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* 면책 조항 */}
          <p className="text-xs text-gray-400 leading-relaxed px-1">
            {result.meta.disclaimer}
          </p>

          {/* 하단 액션 */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={handleReset}
              className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              다시 체크하기
            </button>
            <Link
              to="/feed"
              className="flex-1 py-3 bg-gray-800 text-white text-center rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              홈으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── 인트로 화면 (step === -1) ───
  if (step === -1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
            <button onClick={() => navigate('/feed?tab=check')} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="ml-2 text-lg font-bold text-gray-800">30초 자격 체크</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 히어로 */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 leading-snug">{policy.policy.title}</h2>
              <p className="text-teal-100 text-sm">{policy.policy.owner}</p>
            </div>

            {/* 안내 */}
            <div className="p-6 space-y-5">
              <p className="text-gray-600 leading-relaxed">
                간단한 질문에 답하면, 이 정책의 공식 확인을 먼저 해볼 대상인지 30초 안에 체크할 수 있습니다.
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                  질문 {questions.length}개
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                  약 30초
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-teal-400 rounded-full" />
                  정보 비전송
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 leading-relaxed">
                  이 체크는 공고문 기준 사전 확인용이며, 최종 자격 여부는 반드시 공식 기관에서 확인하세요.
                  입력하신 정보는 서버로 전송되지 않고 브라우저에서만 처리됩니다.
                </p>
              </div>

              <button
                onClick={() => setStep(0)}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-teal-500/25"
              >
                30초 체크 시작
              </button>

              {policy.policy.source_url && (
                <a
                  href={policy.policy.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-teal-600 hover:underline"
                >
                  원문 공고 확인하기
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 질문 화면 ───
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 + 진행률 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={handlePrev} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium text-gray-500">{step + 1} / {questions.length}</span>
          <button
            onClick={handleReset}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            처음으로
          </button>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-teal-500 transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 질문 내용 */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {currentQ && (
          <div className="space-y-6">
            {/* 질문 텍스트 */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-snug">
                {currentQ.label}
              </h2>
              {currentQ.help_text && (
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{currentQ.help_text}</p>
              )}
            </div>

            {/* 라디오 옵션 */}
            {(currentQ.type === 'radio' || currentQ.type === 'select') && (
              <div className="space-y-3">
                {currentQ.options.map(opt => {
                  const selected = answers[currentQ.key] === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(currentQ.key, opt.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selected
                          ? 'border-teal-500 bg-teal-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'border-teal-500' : 'border-gray-300'
                        }`}>
                          {selected && <div className="w-3 h-3 rounded-full bg-teal-500" />}
                        </div>
                        <span className={`font-medium leading-snug ${
                          selected ? 'text-teal-800' : 'text-gray-700'
                        }`}>{opt.label}</span>
                      </div>
                      {opt.description && (
                        <p className="mt-1.5 ml-8 text-sm text-gray-500 leading-relaxed">{opt.description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* 다중 선택 옵션 */}
            {currentQ.type === 'multi_select' && (
              <div className="space-y-3">
                {currentQ.options.map(opt => {
                  const selected = (answers[currentQ.key] || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleMultiSelect(currentQ.key, opt.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selected
                          ? 'border-teal-500 bg-teal-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                        }`}>
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`font-medium leading-snug ${
                          selected ? 'text-teal-800' : 'text-gray-700'
                        }`}>{opt.label}</span>
                      </div>
                      {opt.description && (
                        <p className="mt-1.5 ml-8 text-sm text-gray-500 leading-relaxed">{opt.description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-white border-t">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
              canAdvance()
                ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step >= questions.length - 1 ? '체크 결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
