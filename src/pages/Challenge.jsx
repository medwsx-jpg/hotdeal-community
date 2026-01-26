import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, Gift, Star, Target, Trophy,
  CheckCircle, Circle, Sparkles, Coins, Zap, TrendingUp, Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// 🆕 배터리 애니메이션 컴포넌트
const AnimatedBattery = ({ level, onClick, isCharging }) => {
  const getBatteryColor = () => {
    if (level >= 100) return 'from-yellow-400 to-amber-500'
    if (level >= 50) return 'from-green-400 to-emerald-500'
    if (level >= 20) return 'from-blue-400 to-cyan-500'
    return 'from-gray-400 to-gray-500'
  }

  return (
    <div 
      onClick={onClick}
      className="relative cursor-pointer select-none active:scale-95 transition-transform"
    >
      {isCharging && (
        <div className="absolute inset-0 animate-ping">
          <div className="w-full h-full bg-yellow-400/30 rounded-full"></div>
        </div>
      )}
      
      <div className="relative w-40 h-52 md:w-48 md:h-64">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-2xl"></div>
        
        <div className="absolute top-6 w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-400">
          <div 
            className={`absolute bottom-0 w-full bg-gradient-to-t ${getBatteryColor()} transition-all duration-300 ease-out`}
            style={{ height: `${Math.min(level, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {level}%
              </div>
              <div className="text-xs md:text-sm font-bold text-white/80 mt-1">
                탭하세요!
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isCharging && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Zap className="w-12 h-12 text-yellow-400 animate-bounce" fill="currentColor" />
        </div>
      )}
    </div>
  )
}

// 🆕 숫자 팝업 애니메이션
const FloatingNumber = ({ value, id }) => {
  return (
    <div 
      key={id}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-float-up z-50"
    >
      <span className="text-2xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
        +{value}
      </span>
    </div>
  )
}

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
  
  // 🆕 게임 관련 state
  const [showGame, setShowGame] = useState(false)
  const [gameStats, setGameStats] = useState({
    energy: 0,
    level: 1,
    tap_power: 1,
    auto_chargers: 0,
    auto_power: 0,
    total_taps: 0
  })
  const [batteryLevel, setBatteryLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [floatingNumbers, setFloatingNumbers] = useState([])
  const [rankings, setRankings] = useState([])
  const [showLevelUp, setShowLevelUp] = useState(false)
  
  // 이번 달 출석 데이터 가져오기
  useEffect(() => {
    if (user) {
      fetchAttendanceData()
      loadGameData() // 🆕 게임 데이터도 로드
    }
  }, [user, currentMonth])
  
  // 🆕 자동 충전
  useEffect(() => {
    if (!user || !showGame) return
    
    const interval = setInterval(() => {
      if (gameStats.auto_power > 0) {
        handleAutoCharge()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [user, gameStats.auto_power, showGame])
  
  // 🆕 배터리 레벨 계산
  useEffect(() => {
    const energyForNextLevel = gameStats.level * 1000
    const currentLevelEnergy = gameStats.energy % energyForNextLevel
    const percentage = (currentLevelEnergy / energyForNextLevel) * 100
    setBatteryLevel(Math.min(percentage, 100))
  }, [gameStats.energy, gameStats.level])
  
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
  
  // 🆕 게임 데이터 로드
  const loadGameData = async () => {
    try {
      const { data: stats, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (stats) {
        setGameStats(stats)
      } else {
        // 새 유저 - 초기 데이터 생성
        const { data: newStats, error: insertError } = await supabase
          .from('game_stats')
          .insert([{
            user_id: user.id,
            energy: 0,
            level: 1,
            tap_power: 1,
            auto_chargers: 0,
            auto_power: 0,
            total_taps: 0
          }])
          .select()
          .single()
        
        if (insertError) throw insertError
        setGameStats(newStats)
      }
      
      loadRankings()
    } catch (error) {
      console.error('게임 데이터 로드 실패:', error)
    }
  }
  
  // 🆕 랭킹 로드
  const loadRankings = async () => {
    try {
      const { data, error } = await supabase
        .from('game_stats')
        .select(`
          user_id,
          energy,
          level,
          profiles(username)
        `)
        .order('energy', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setRankings(data || [])
    } catch (error) {
      console.error('랭킹 로드 실패:', error)
    }
  }
  
  // 🆕 배터리 탭
  const handleTap = async () => {
    if (!user) return
    
    setIsCharging(true)
    setTimeout(() => setIsCharging(false), 200)
    
    const newEnergy = gameStats.energy + gameStats.tap_power
    const newTotalTaps = gameStats.total_taps + 1
    const energyForNextLevel = gameStats.level * 1000
    
    let newLevel = gameStats.level
    if (newEnergy >= energyForNextLevel) {
      newLevel = gameStats.level + 1
      setShowLevelUp(true)
      setTimeout(() => setShowLevelUp(false), 2000)
    }
    
    setGameStats(prev => ({
      ...prev,
      energy: newEnergy,
      level: newLevel,
      total_taps: newTotalTaps
    }))
    
    // 숫자 팝업
    const id = Date.now()
    setFloatingNumbers(prev => [...prev, { id, value: gameStats.tap_power }])
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id))
    }, 1000)
    
    // DB 업데이트
    if (newTotalTaps % 10 === 0) {
      await supabase
        .from('game_stats')
        .update({
          energy: newEnergy,
          level: newLevel,
          total_taps: newTotalTaps
        })
        .eq('user_id', user.id)
    }
  }
  
  // 🆕 자동 충전
  const handleAutoCharge = async () => {
    const newEnergy = gameStats.energy + gameStats.auto_power
    const energyForNextLevel = gameStats.level * 1000
    
    let newLevel = gameStats.level
    if (newEnergy >= energyForNextLevel) {
      newLevel = gameStats.level + 1
    }
    
    setGameStats(prev => ({
      ...prev,
      energy: newEnergy,
      level: newLevel
    }))
    
    if (Date.now() % 5000 < 1000) {
      await supabase
        .from('game_stats')
        .update({ energy: newEnergy, level: newLevel })
        .eq('user_id', user.id)
    }
  }
  
  // 🆕 업그레이드
  const handleUpgrade = async (upgradeId) => {
    const upgrades = {
      tap_power: { baseCost: 100, currentLevel: gameStats.tap_power },
      auto_charger: { baseCost: 500, currentLevel: gameStats.auto_chargers }
    }
    
    const upgrade = upgrades[upgradeId]
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.currentLevel))
    
    if (gameStats.energy < cost) {
      alert('⚡ 에너지가 부족합니다!')
      return
    }
    
    let updates = { energy: gameStats.energy - cost }
    
    if (upgradeId === 'tap_power') {
      updates.tap_power = gameStats.tap_power + 1
    } else {
      updates.auto_chargers = gameStats.auto_chargers + 1
      updates.auto_power = (gameStats.auto_chargers + 1) * 2
    }
    
    try {
      await supabase
        .from('game_stats')
        .update(updates)
        .eq('user_id', user.id)
      
      setGameStats(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('업그레이드 실패:', error)
    }
  }
  
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }
  
  // 출석체크 하기
  const handleCheckIn = async () => {
    if (!user || todayChecked || loading) return
    
    setLoading(true)
    try {
      // 1~30 랜덤 포인트
      const points = Math.floor(Math.random() * 10) + 1
      
      // 출석 기록 저장
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          points_earned: points,
          checked_at: new Date().toISOString()
        })
      
      // 중복 출석 체크
      if (attendanceError) {
        if (attendanceError.code === '23505') {
          alert('이미 오늘 출석체크를 하셨습니다!')
          setTodayChecked(true)
          return
        }
        throw attendanceError
      }
      
      // 현재 프로필 정보 가져오기
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('consecutive_days, last_attendance_date')
        .eq('id', user.id)
        .single()
      
      if (fetchError) throw fetchError
      
      // 연속 출석일 계산
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const lastDate = currentProfile?.last_attendance_date
      let newConsecutiveDays = 1
      
      if (lastDate) {
        const lastDateObj = new Date(lastDate)
        const todayObj = new Date(today)
        const diffTime = todayObj - lastDateObj
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // 어제 출석했으면 연속 출석 +1
          newConsecutiveDays = (currentProfile?.consecutive_days || 0) + 1
        } else if (diffDays === 0) {
          // 같은 날 (이미 출석) - 유지
          newConsecutiveDays = currentProfile?.consecutive_days || 1
        } else if (diffDays >= 10) {
          // 10일 이상 결석 → 브론즈로 리셋
          newConsecutiveDays = 1
        } else if (diffDays >= 9) {
          // 9일 결석 → 한 단계 강등 (최소 1)
          const currentDays = currentProfile?.consecutive_days || 1
          if (currentDays >= 10) {
            newConsecutiveDays = 5  // VIP → 골드
          } else if (currentDays >= 5) {
            newConsecutiveDays = 2  // 골드 → 실버
          } else if (currentDays >= 2) {
            newConsecutiveDays = 1  // 실버 → 브론즈
          } else {
            newConsecutiveDays = 1
          }
        } else {
          // 2~8일 결석 → 1일부터 다시 시작
          newConsecutiveDays = 1
        }
      }
      
      // 프로필 업데이트 (포인트 + 연속 출석일 + 마지막 출석일)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          points: (profile?.points || 0) + points,
          consecutive_days: newConsecutiveDays,
          last_attendance_date: today
        })
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

  // 🆕 게임 화면
  if (showGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
        {/* 헤더 */}
        <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
            <button onClick={() => setShowGame(false)} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold">⚡ UDT79 이벤트미션</h1>
          </div>
        </div>
        
        {/* 콘텐츠 */}
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 text-center shadow-sm">
              <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
              <div className="text-base font-black text-gray-900">{formatNumber(gameStats.energy)}</div>
              <div className="text-xs text-gray-500">에너지</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 text-center shadow-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <div className="text-base font-black text-gray-900">{gameStats.tap_power}</div>
              <div className="text-xs text-gray-500">탭 파워</div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 text-center shadow-sm">
              <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="text-base font-black text-gray-900">{gameStats.auto_power}/s</div>
              <div className="text-xs text-gray-500">자동 충전</div>
            </div>
          </div>

          {/* 배터리 */}
          <div className="relative flex justify-center py-6 bg-white/50 backdrop-blur-md rounded-2xl">
            <AnimatedBattery 
              level={batteryLevel} 
              onClick={handleTap}
              isCharging={isCharging}
            />
            
            {floatingNumbers.map(item => (
              <FloatingNumber key={item.id} value={item.value} id={item.id} />
            ))}
          </div>

          {/* 진행도 바 */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                레벨 {gameStats.level} → {gameStats.level + 1}
              </span>
              <span className="text-xs text-gray-500">
                {formatNumber(gameStats.energy % (gameStats.level * 1000))} / {formatNumber(gameStats.level * 1000)}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                style={{ width: `${batteryLevel}%` }}
              ></div>
            </div>
          </div>

          {/* 업그레이드 */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">⬆️ 업그레이드</h3>
            
            {/* 탭 파워 */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">탭 파워</h4>
                    <p className="text-xs text-gray-500">Lv.{gameStats.tap_power}</p>
                  </div>
                </div>
                <div className="text-xs text-purple-600 font-bold">
                  효과: {gameStats.tap_power + 1}
                </div>
              </div>
              
              <button
                onClick={() => handleUpgrade('tap_power')}
                disabled={gameStats.energy < Math.floor(100 * Math.pow(1.5, gameStats.tap_power))}
                className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                  gameStats.energy >= Math.floor(100 * Math.pow(1.5, gameStats.tap_power))
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {gameStats.energy >= Math.floor(100 * Math.pow(1.5, gameStats.tap_power)) ? (
                  <>⚡ {formatNumber(Math.floor(100 * Math.pow(1.5, gameStats.tap_power)))} 에너지</>
                ) : (
                  <>🔒 {formatNumber(Math.floor(100 * Math.pow(1.5, gameStats.tap_power)))} 필요</>
                )}
              </button>
            </div>
            
            {/* 자동 충전기 */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">자동 충전기</h4>
                    <p className="text-xs text-gray-500">Lv.{gameStats.auto_chargers}</p>
                  </div>
                </div>
                <div className="text-xs text-green-600 font-bold">
                  효과: {(gameStats.auto_chargers + 1) * 2}/s
                </div>
              </div>
              
              <button
                onClick={() => handleUpgrade('auto_charger')}
                disabled={gameStats.energy < Math.floor(500 * Math.pow(1.5, gameStats.auto_chargers))}
                className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                  gameStats.energy >= Math.floor(500 * Math.pow(1.5, gameStats.auto_chargers))
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {gameStats.energy >= Math.floor(500 * Math.pow(1.5, gameStats.auto_chargers)) ? (
                  <>⚡ {formatNumber(Math.floor(500 * Math.pow(1.5, gameStats.auto_chargers)))} 에너지</>
                ) : (
                  <>🔒 {formatNumber(Math.floor(500 * Math.pow(1.5, gameStats.auto_chargers)))} 필요</>
                )}
              </button>
            </div>
          </div>

          {/* 랭킹 */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">🏆 랭킹 TOP 10</h3>
            {rankings.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 text-center shadow-sm">
                <Trophy className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">아직 랭킹이 없습니다</p>
              </div>
            ) : (
              rankings.map((rank, index) => {
                const isCurrentUser = rank.user_id === user?.id
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`
                
                return (
                  <div 
                    key={rank.user_id}
                    className={`backdrop-blur-md rounded-xl p-3 shadow-sm ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                        : 'bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {medal}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 flex items-center space-x-1">
                            <span>{rank.profiles?.username || '사용자'}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                                나
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Level {rank.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-gray-900">
                          {formatNumber(rank.energy)}
                        </div>
                        <div className="text-xs text-gray-500">에너지</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 게임 팁 */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-3">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">💡 게임 팁</h3>
                <ul className="text-xs text-gray-700 space-y-0.5">
                  <li>• 배터리를 탭하면 에너지 +{gameStats.tap_power}</li>
                  <li>• 자동 충전기로 방치 플레이 가능!</li>
                  <li>• 게시물 작성하면 보너스 에너지!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* 레벨업 축하 모달 */}
        {showLevelUp && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-5 rounded-2xl shadow-2xl animate-bounce">
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-2" fill="currentColor" />
                <h2 className="text-2xl font-black mb-1">레벨 업!</h2>
                <p className="text-lg">🎉 Level {gameStats.level} 달성!</p>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes float-up {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -150%);
            }
          }
          
          .animate-float-up {
            animation: float-up 1s ease-out forwards;
          }
        `}</style>
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
            {/* 미션 1: UDT79 이벤트미션 - 🆕 게임으로 연결 */}
            <button 
              onClick={() => setShowGame(true)}
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
  onClick={() => alert('글작성 미션: 핫딜 게시글을 작성하면 최대 300P를 랜덤으로 받을 수 있어요!')}
  className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 hover:border-red-400 transition-colors text-left"
>
  <div className="flex items-center space-x-4">
    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
      📝
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-gray-900">글작성미션</h3>
      <p className="text-sm text-gray-500">(핫딜)</p>
    </div>
    <span className="text-red-500 font-bold text-sm">최대300P</span>
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