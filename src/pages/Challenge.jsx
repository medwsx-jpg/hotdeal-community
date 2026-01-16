import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, Gift, Star, Target, Trophy,
  CheckCircle, Circle, Sparkles, Coins
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Challenge() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('attendance') // attendance, challenge, mission
  const [attendanceData, setAttendanceData] = useState([])
  const [todayChecked, setTodayChecked] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(null)
  const [showPointModal, setShowPointModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // 이번 달 출석 데이터 가져오기
  useEffect(() => {
    if (user) {
      fetchAttendanceData()
    }
  }, [user, currentMonth])
  
  const fetchAttendanceData = async () => {
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const startDate = new Date(year, month, 1).toISOString()
      const endDate = new Date(year, month + 1, 0).toISOString()
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('checked_at', startDate)
        .lte('checked_at', endDate)
        .order('checked_at', { ascending: true })
      
      if (error) throw error
      
      setAttendanceData(data || [])
      
      // 오늘 출석했는지 확인
      const today = new Date().toDateString()
      const checkedToday = (data || []).some(
        d => new Date(d.checked_at).toDateString() === today
      )
      setTodayChecked(checkedToday)
    } catch (error) {
      console.error('출석 데이터 로드 실패:', error)
    }
  }
  
  // 출석체크 하기
  const handleCheckIn = async () => {
    if (!user || todayChecked || loading) return
    
    setLoading(true)
    try {
      // 1~60 랜덤 포인트
      const points = Math.floor(Math.random() * 10) + 1
      
      // 출석 기록 저장
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          points_earned: points,
          checked_at: new Date().toISOString()
        })
      
      if (attendanceError) throw attendanceError
      
      // 프로필 포인트 업데이트
      const currentPoints = profile?.points || 0
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ points: currentPoints + points })
        .eq('id', user.id)
      
      if (profileError) throw profileError
      
      setEarnedPoints(points)
      setShowPointModal(true)
      setTodayChecked(true)
      fetchAttendanceData()
    } catch (error) {
      console.error('출석체크 실패:', error)
      alert('출석체크에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }
  
  // 달력 생성
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    
    const days = []
    
    // 빈 칸 (이전 달)
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, status: 'empty' })
    }
    
    // 이번 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === today.toDateString()
      const isPast = date < today && !isToday
      const isFuture = date > today
      
      // 출석 여부 확인
      const attended = attendanceData.some(
        d => new Date(d.checked_at).getDate() === day
      )
      
      let status = 'pending' // 미출석 (점선)
      if (attended) status = 'checked' // 출석 완료 (이모지)
      if (isFuture) status = 'future' // 미래 (P 아이콘)
      if (isToday && !attended) status = 'today' // 오늘 (강조)
      
      days.push({ day, status, isToday })
    }
    
    return days
  }
  
  // 이번 달 출석 일수
  const attendanceCount = attendanceData.length
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold">🎯 챌린지</h1>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              📅 출석체크
            </button>
            <button
              onClick={() => setActiveTab('challenge')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'challenge'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              🏆 챌린지
            </button>
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'mission'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              ⭐ 더많은미션
            </button>
          </div>
        </div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* 출석체크 탭 */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* 출석 체크 보상 카드 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🅿️</span>
                </div>
                <h2 className="text-lg font-bold">출석 체크 보상</h2>
              </div>
              
              {/* 매일 포인트 */}
              <div className="bg-cyan-50 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">매일 포인트 랜덤 뽑기</span>
                  <span className="text-cyan-600 font-bold text-lg">1~30P</span>
                </div>
              </div>
              
              {/* 한 달 출석 보상 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-700">한 달 출석하면</span>
                    <span className="text-gray-500 text-sm ml-1">(매일 출석 시)</span>
                  </div>
                  <span className="text-blue-600 font-bold">보너스 100P</span>
                </div>
              </div>
            </div>
            
            {/* 출석 현황 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">출석 현황</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>잊지 않게 알림 받기</span>
                  <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow"></div>
                  </div>
                </div>
              </div>
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
                  <div key={day} className={`text-center text-sm font-medium py-1 ${
                    i >= 5 ? 'text-blue-500' : 'text-gray-600'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 달력 */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendar().map((item, index) => (
                  <div
                    key={index}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${
                      item.isToday ? 'ring-2 ring-purple-400 bg-purple-50' : ''
                    }`}
                  >
                    {item.day && (
                      <>
                        <span className={`text-xs ${item.isToday ? 'font-bold text-purple-600' : 'text-gray-600'}`}>
                          {item.day}
                        </span>
                        {item.status === 'checked' && (
                          <span className="text-lg">😊</span>
                        )}
                        {item.status === 'pending' && !item.isToday && (
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-orange-300 flex items-center justify-center">
                            <span className="text-orange-400 text-xs">-</span>
                          </div>
                        )}
                        {item.status === 'future' && (
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">P</span>
                          </div>
                        )}
                        {item.status === 'today' && (
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">P</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 출석 통계 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">이번 달 출석</span>
                  <span className="font-bold text-purple-600">{attendanceCount}일 / {daysInMonth}일</span>
                </div>
              </div>
            </div>
            
            {/* 출석하기 버튼 */}
            <button
              onClick={handleCheckIn}
              disabled={todayChecked || loading}
              className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
                todayChecked
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg'
              }`}
            >
              {loading ? '처리 중...' : todayChecked ? '출석완료 ✓' : '출석하기'}
            </button>
          </div>
        )}
        
        {/* 챌린지 탭 */}
        {activeTab === 'challenge' && (
          <div className="space-y-3">
            {/* 미션 1: UDT79 이벤트미션 */}
            <button 
              onClick={() => alert('이벤트 미션 준비 중입니다!')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                  🎖️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">UDT79이벤트미션</h3>
                  <p className="text-sm text-gray-500">행운을 잡아라</p>
                </div>
              </div>
            </button>

            {/* 미션 2: 글작성미션 */}
            <button 
              onClick={() => alert('글작성 미션: 핫딜 또는 JOB 게시글을 작성하면 포인트를 받을 수 있어요!')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                  📝
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">글작성미션</h3>
                  <p className="text-sm text-gray-500">(핫딜,JOB)</p>
                </div>
                <span className="text-red-500 font-bold text-sm">최대100P</span>
              </div>
            </button>

            {/* 미션 3: 영수증 올리기 */}
            <button 
              onClick={() => alert('영수증 미션: 영수증을 올리면 포인트를 받을 수 있어요! (하루 최대 3번)')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
                  🧾
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">영수증 올리기</h3>
                  <p className="text-sm text-gray-500">최대하루3번</p>
                </div>
                <span className="text-red-500 font-bold text-sm">최대100P</span>
              </div>
            </button>

            {/* 미션 4: 방문인증영수증 */}
            <button 
              onClick={() => alert('방문인증 미션: 매장 방문 후 영수증을 인증하면 포인트를 받을 수 있어요!')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                  🤳
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">방문인증영수증</h3>
                  <p className="text-sm text-gray-500">매장 방문 인증</p>
                </div>
                <span className="text-red-500 font-bold text-sm">최대100P</span>
              </div>
            </button>

            {/* 미션 5: 동네미션 */}
            <button 
              onClick={() => alert('동네미션: 우리 동네 광고를 확인하면 포인트를 받을 수 있어요!')}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-red-500 font-bold text-sm border border-red-400 px-1.5 py-0.5 rounded">광고</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">동네미션</h3>
                  <p className="text-sm text-gray-500">광고 확인하기</p>
                </div>
                <span className="text-red-500 font-bold text-sm">최대100P</span>
              </div>
            </button>
          </div>
        )}
        
        {/* 더많은미션 탭 */}
        {activeTab === 'mission' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">미션 준비 중</h3>
              <p className="text-gray-500 text-sm">
                다양한 미션으로 포인트를 모아보세요!<br />
                곧 오픈 예정입니다 ✨
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* 포인트 획득 모달 */}
      {showPointModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">출석 체크 완료!</h2>
            <p className="text-purple-600 text-2xl font-bold mb-4">
              {earnedPoints}P를 뽑았어요
            </p>
            <p className="text-gray-500 text-sm mb-6">
              한 달 매일 출석하면 선물을 드려요
            </p>
            
            {/* 코인 이미지 */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl font-bold">P</span>
              </div>
              {/* 컨페티 효과 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-32 h-32 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <button
              onClick={() => setShowPointModal(false)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold text-lg"
            >
              {earnedPoints}P 받기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}