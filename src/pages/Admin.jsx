import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, MessageSquare, AlertTriangle, 
  TrendingUp, BarChart3, Shield, Home, Bell, Plus, X, Image as ImageIcon, Edit2, Trash2,
  Award, Trophy, Medal, UserPlus, Eye, Calendar, Search, ChevronLeft, ChevronRight,
  ShoppingBag, Gift, Activity, UserCheck, UserX, Zap, Coins, DollarSign
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// 배터리 아이콘 컴포넌트 (동그라미 배경 + 세로 배터리)
const BatteryIcon = ({ level, size = 32, isAdmin = false }) => {
  const colors = {
    vip: { color: '#22c55e', bars: 3 },      // 초록 - 3칸 (10일 연속)
    gold: { color: '#eab308', bars: 3 },     // 노랑 - 3칸 (5일 연속)
    silver: { color: '#f97316', bars: 2 },   // 주황 - 2칸 (2일 연속)
    bronze: { color: '#f97316', bars: 1 },   // 주황 - 1칸 (1일 출석)
    dormant: { color: '#ef4444', bars: 0 }   // 빨강 - 0칸 (휴면)
  }
  
  const config = colors[level] || colors.dormant
  
  // 관리자용 무지개 그라데이션
  if (isAdmin) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="rainbowGradientAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="17%" stopColor="#ff8000" />
            <stop offset="33%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="67%" stopColor="#0080ff" />
            <stop offset="83%" stopColor="#8000ff" />
            <stop offset="100%" stopColor="#ff0080" />
          </linearGradient>
          <linearGradient id="rainbowBorderAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="100%" stopColor="#0000ff" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" stroke="url(#rainbowBorderAdmin)" strokeWidth="2" fill="none" />
        <circle cx="20" cy="20" r="17.5" fill="#fefefe" />
        <rect x="13" y="12" width="14" height="20" rx="2" stroke="url(#rainbowGradientAdmin)" strokeWidth="2" fill="none" />
        <rect x="16" y="8" width="8" height="4" rx="1" fill="url(#rainbowGradientAdmin)" />
        <rect x="15" y="25" width="10" height="5" rx="1" fill="#22c55e" />
        <rect x="15" y="19" width="10" height="5" rx="1" fill="#eab308" />
        <rect x="15" y="13" width="10" height="5" rx="1" fill="#ef4444" />
      </svg>
    )
  }
  
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="#fca5a5" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="17.5" fill="#f3f4f6" />
      <rect x="13" y="12" width="14" height="20" rx="2" stroke={config.color} strokeWidth="2" fill="none" />
      <rect x="16" y="8" width="8" height="4" rx="1" fill={config.color} />
      {config.bars >= 1 && (
        <rect x="15" y="25" width="10" height="5" rx="1" fill={config.color} />
      )}
      {config.bars >= 2 && (
        <rect x="15" y="19" width="10" height="5" rx="1" fill={config.color} />
      )}
      {config.bars >= 3 && (
        <rect x="15" y="13" width="10" height="5" rx="1" fill={config.color} />
      )}
    </svg>
  )
}

// 사용자 등급 계산 함수 (연속 출석 기준)
const getUserLevel = (consecutiveDays) => {
  if (consecutiveDays >= 10) return 'vip'       // 10일 연속 → VIP
  if (consecutiveDays >= 5) return 'gold'       // 5일 연속 → 골드
  if (consecutiveDays >= 2) return 'silver'     // 2일 연속 → 실버
  if (consecutiveDays >= 1) return 'bronze'     // 1일 출석 → 브론즈
  return 'dormant'                               // 0일 → 휴면
}

const getLevelLabel = (level) => {
  const labels = { 
    vip: '🟢 VIP', 
    gold: '🟡 골드', 
    silver: '🟠 실버', 
    bronze: '🟤 브론즈',
    dormant: '🔴 휴면' 
  }
  return labels[level] || labels.dormant
}

export default function Admin() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const [notices, setNotices] = useState([])
  const [isWriting, setIsWriting] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [newNotice, setNewNotice] = useState({ category: '공지', title: '', content: '' })
  const [selectedImages, setSelectedImages] = useState([])
  const [noticeLoading, setNoticeLoading] = useState(false)
  
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalReports: 0 })
  const [userStats, setUserStats] = useState({ topPosters: [], topCommenters: [], allUsers: [] })
  const [statsPeriod, setStatsPeriod] = useState('all')
  const [recentUsers, setRecentUsers] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [postsPage, setPostsPage] = useState(0)
  const [postsSearch, setPostsSearch] = useState('')
  const [postsHasMore, setPostsHasMore] = useState(true)
  const POSTS_PER_PAGE = 20
  const [allComments, setAllComments] = useState([])
  const [commentsPage, setCommentsPage] = useState(0)
  const [commentsSearch, setCommentsSearch] = useState('')
  const [commentsHasMore, setCommentsHasMore] = useState(true)
  const COMMENTS_PER_PAGE = 20
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)

  const [storeProducts, setStoreProducts] = useState([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', description: '', is_active: true })
  const [productLoading, setProductLoading] = useState(false)

  const [signupStats, setSignupStats] = useState({ today: 0, week: 0, month: 0, total: 0 })
  const [weeklySignups, setWeeklySignups] = useState([])
  const [usersWithActivity, setUsersWithActivity] = useState([])
  const [dormantUsers, setDormantUsers] = useState([])
  const [levelCounts, setLevelCounts] = useState({ vip: 0, gold: 0, silver: 0, bronze: 0, dormant: 0 })

  // 사용자 관리용
  const [allUsersWithPoints, setAllUsersWithPoints] = useState([])
  const [usersSearch, setUsersSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [pointAction, setPointAction] = useState({ type: 'add', amount: '', reason: '' })
  const [pointLoading, setPointLoading] = useState(false)

  // 🆕 사용자별 글 관리용
const [selectedUserForPosts, setSelectedUserForPosts] = useState(null)
const [userPosts, setUserPosts] = useState([])
const [userPostsLoading, setUserPostsLoading] = useState(false)

  // 🆕 관리자 알림용
  const [adminAlerts, setAdminAlerts] = useState([])
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [lastCheckedReports, setLastCheckedReports] = useState(
    parseInt(localStorage.getItem('lastCheckedReports') || '0')
  )
  const [lastCheckedExchanges, setLastCheckedExchanges] = useState(
    parseInt(localStorage.getItem('lastCheckedExchanges') || '0')
  )

  // 🆕 복권 지급용
  const [lotteryUsername, setLotteryUsername] = useState('')
  const [lotteryAmount, setLotteryAmount] = useState(1)
  const [lotteryLoading, setLotteryLoading] = useState(false)

  // 🆕 교환 내역 관리용
  const [exchanges, setExchanges] = useState([])
  const [exchangesFilter, setExchangesFilter] = useState('all') // all, pending, processing, completed, cancelled
  const [exchangesLoading, setExchangesLoading] = useState(false)
  const [exchangeStats, setExchangeStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 })

  // 🆕 브라우저 알림 권한 요청
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 🆕 주기적으로 새 알림 체크 (30초마다)
  useEffect(() => {
    if (profile?.role !== '관리자') return
    
    // 초기 체크
    checkNewAlerts()
    
    // 30초마다 체크
    const interval = setInterval(() => {
      checkNewAlerts()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [profile, lastCheckedReports, lastCheckedExchanges])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (profile === null) return
    if (profile.role !== '관리자') { alert('관리자만 접근할 수 있습니다.'); navigate('/feed'); return }
    fetchStats()
    fetchNotices()
    fetchUserStats()
    fetchRecentUsers()
    fetchReports()
    fetchStoreProducts()
    fetchSignupStats()
    fetchWeeklySignups()
    fetchUsersWithActivity()
    fetchExchanges() // 🆕 추가
  }, [user, profile, navigate])

  useEffect(() => {
    if (activeTab === 'posts') fetchAllPosts(0, '', true)
    else if (activeTab === 'comments') fetchAllComments(0, '', true)
    else if (activeTab === 'store') fetchStoreProducts()
    else if (activeTab === 'users') fetchAllUsersWithPoints()
    else if (activeTab === 'exchanges') fetchExchanges() // 🆕 추가
  }, [activeTab])

  // 🆕 교환 내역 조회 (수정됨 - 2단계 조회)
  const fetchExchanges = async (statusFilter = 'all') => {
    try {
      setExchangesLoading(true)
      
      let query = supabase
        .from('reward_exchanges')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      const { data: exchangesData, error } = await query
      if (error) throw error
      
      // 각 교환 건에 대해 사용자와 상품 정보 가져오기
      const exchangesWithDetails = await Promise.all(
        (exchangesData || []).map(async (exchange) => {
          // 사용자 정보
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, points')
            .eq('id', exchange.user_id)
            .single()
          
          // 상품 정보
          const { data: productData } = await supabase
            .from('store_products')
            .select('name, price, image_url')
            .eq('id', exchange.product_id)
            .single()
          
          return {
            ...exchange,
            profiles: profileData,
            store_products: productData
          }
        })
      )
      
      setExchanges(exchangesWithDetails)
      
      // 통계 계산
      const stats = {
        total: exchangesWithDetails?.length || 0,
        pending: exchangesWithDetails?.filter(e => e.status === 'pending').length || 0,
        processing: exchangesWithDetails?.filter(e => e.status === 'processing').length || 0,
        completed: exchangesWithDetails?.filter(e => e.status === 'completed').length || 0,
        cancelled: exchangesWithDetails?.filter(e => e.status === 'cancelled').length || 0
      }
      setExchangeStats(stats)
    } catch (error) {
      console.error('교환 내역 로드 실패:', error)
    } finally {
      setExchangesLoading(false)
    }
  }

  // 🆕 교환 상태 변경
  const handleUpdateExchangeStatus = async (exchangeId, newStatus) => {
    if (!window.confirm(`상태를 '${getStatusLabel(newStatus)}'(으)로 변경하시겠습니까?`)) return
    
    try {
      const { error } = await supabase
        .from('reward_exchanges')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', exchangeId)
      
      if (error) throw error
      
      alert('상태가 변경되었습니다!')
      fetchExchanges(exchangesFilter)
    } catch (error) {
      alert('상태 변경 실패: ' + error.message)
    }
  }

  // 🆕 상태 라벨 변환
  const getStatusLabel = (status) => {
    const labels = {
      pending: '대기중',
      processing: '처리중',
      completed: '완료',
      cancelled: '취소'
    }
    return labels[status] || status
  }

  // 🆕 상태 색상
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const fetchAllUsersWithPoints = async (search = '') => {
    try {
      setLoading(true)
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (search) query = query.ilike('username', `%${search}%`)
      
      const { data: users, error } = await query
      if (error) throw error
      
      const usersWithData = await Promise.all((users || []).map(async (u) => {
        const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
        const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', u.id)
        const level = getUserLevel(u.consecutive_days || 0)
        return { ...u, postsCount: postsCount || 0, commentsCount: commentsCount || 0, level, levelLabel: getLevelLabel(level) }
      }))
      
      setAllUsersWithPoints(usersWithData)
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 포인트 지급/차감
  const handlePointAction = async (e) => {
    e.preventDefault()
    if (!selectedUser || !pointAction.amount) return
    
    try {
      setPointLoading(true)
      const amount = parseInt(pointAction.amount)
      const finalAmount = pointAction.type === 'add' ? amount : -amount
      
      // Atomic Update 사용
      const { error: updateError } = await supabase.rpc('increment_points', {
        user_id_param: selectedUser.id,
        points_param: finalAmount
      })
      
      if (updateError) throw updateError
      
      alert(`${pointAction.type === 'add' ? '지급' : '차감'} 완료! (${amount}P)`)
      setSelectedUser(null)
      setPointAction({ type: 'add', amount: '', reason: '' })
      fetchAllUsersWithPoints(usersSearch)
    } catch (error) {
      alert('포인트 처리 실패: ' + error.message)
    } finally {
      setPointLoading(false)
    }
  }

  // 🆕 복권 지급
  const handleGiveLottery = async () => {
    if (!lotteryUsername.trim()) {
      alert('닉네임을 입력해주세요')
      return
    }
    
    setLotteryLoading(true)
    try {
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('id, username, lottery_tickets')
        .eq('username', lotteryUsername.trim())
        .single()
      
      if (findError || !user) {
        alert('해당 닉네임의 사용자를 찾을 수 없습니다')
        return
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ lottery_tickets: (user.lottery_tickets || 0) + lotteryAmount })
        .eq('id', user.id)
      
      if (error) throw error
      
      alert(`${user.username}님에게 복권 ${lotteryAmount}개 지급 완료!`)
      setLotteryUsername('')
      setLotteryAmount(1)
    } catch (error) {
      console.error('복권 지급 실패:', error)
      alert('복권 지급에 실패했습니다')
    } finally {
      setLotteryLoading(false)
    }
  }

  // 🆕 관리자 알림 체크
  const checkNewAlerts = async () => {
    try {
      const alerts = []
      
      // 새 신고 체크
      const { count: newReportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gt('id', lastCheckedReports)
      
      if (newReportsCount && newReportsCount > 0) {
        // 최신 신고 정보 가져오기
        const { data: latestReport } = await supabase
          .from('reports')
          .select('*, posts(title)')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        alerts.push({
          type: 'report',
          count: newReportsCount,
          message: `새로운 신고가 ${newReportsCount}건 접수되었습니다!`,
          detail: latestReport?.posts?.title ? `최근: "${latestReport.posts.title}"` : '',
          latestId: latestReport?.id
        })
      }
      
      // 새 교환 신청 체크 (pending 상태만)
      const { count: newExchangesCount } = await supabase
        .from('reward_exchanges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gt('id', lastCheckedExchanges)
      
      if (newExchangesCount && newExchangesCount > 0) {
        // 최신 교환 신청 정보 가져오기
        const { data: latestExchange } = await supabase
          .from('reward_exchanges')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        // 상품 정보 가져오기
        let productName = ''
        if (latestExchange?.product_id) {
          const { data: product } = await supabase
            .from('store_products')
            .select('name')
            .eq('id', latestExchange.product_id)
            .single()
          productName = product?.name || ''
        }
        
        alerts.push({
          type: 'exchange',
          count: newExchangesCount,
          message: `새로운 교환 신청이 ${newExchangesCount}건 있습니다!`,
          detail: productName ? `최근: "${productName}"` : '',
          latestId: latestExchange?.id
        })
      }
      
      if (alerts.length > 0) {
        setAdminAlerts(alerts)
        setShowAlertModal(true)
        
        // 브라우저 알림 (권한 있으면)
        if (Notification.permission === 'granted') {
          new Notification('🔔 관리자 알림', {
            body: alerts.map(a => a.message).join('\n'),
            icon: '/favicon.ico',
            requireInteraction: true
          })
        }
      }
    } catch (error) {
      console.error('알림 체크 실패:', error)
    }
  }

  // 🆕 알림 확인 처리
  const handleDismissAlerts = () => {
    // 마지막 확인 ID 업데이트
    adminAlerts.forEach(alert => {
      if (alert.type === 'report' && alert.latestId) {
        localStorage.setItem('lastCheckedReports', alert.latestId.toString())
        setLastCheckedReports(alert.latestId)
      }
      if (alert.type === 'exchange' && alert.latestId) {
        localStorage.setItem('lastCheckedExchanges', alert.latestId.toString())
        setLastCheckedExchanges(alert.latestId)
      }
    })
    
    setShowAlertModal(false)
    setAdminAlerts([])
  }

  // 🆕 알림 확인 후 해당 탭으로 이동
  const handleGoToAlert = (type) => {
    handleDismissAlerts()
    setActiveTab(type === 'report' ? 'reports' : 'exchanges')
  }

  // 🆕 특정 사용자의 모든 글 가져오기
const fetchUserPosts = async (userId) => {
  try {
    setUserPostsLoading(true)
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    setUserPosts(data || [])
  } catch (error) {
    console.error('사용자 글 목록 로드 실패:', error)
  } finally {
    setUserPostsLoading(false)
  }
}

// 🆕 회원 정지/해제
const handleBanUser = async (userId, currentBanStatus) => {
  const action = currentBanStatus ? '해제' : '정지'
  if (!window.confirm(`이 회원을 ${action}하시겠습니까?`)) return
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId)
    
    if (error) throw error
    
    alert(`회원 ${action} 완료!`)
    fetchAllUsersWithPoints(usersSearch)
    if (selectedUserForPosts) {
      setSelectedUserForPosts({...selectedUserForPosts, is_banned: !currentBanStatus})
    }
  } catch (error) {
    alert(`회원 ${action} 실패: ` + error.message)
  }
}

// 🆕 권한 변경 (관리자 ↔ 일반)
const handleChangeRole = async (userId, currentRole, username) => {
  const newRole = currentRole === '관리자' ? '일반' : '관리자'
  if (!window.confirm(`${username || '이 회원'}의 권한을 "${newRole}"(으)로 변경하시겠습니까?`)) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    alert(`권한 변경 완료! → ${newRole}`)
    fetchAllUsersWithPoints(usersSearch)
    if (selectedUserForPosts) {
      setSelectedUserForPosts({...selectedUserForPosts, role: newRole})
    }
  } catch (error) {
    alert('권한 변경 실패: ' + error.message)
  }
}

// 🆕 사용자 글 삭제 (개별)
const handleDeleteUserPost = async (postId) => {
  if (!window.confirm('이 게시물을 삭제하시겠습니까?')) return
  
  try {
    await supabase.from('comments').delete().eq('post_id', postId)
    await supabase.from('likes').delete().eq('post_id', postId)
    await supabase.from('reports').delete().eq('post_id', postId)
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    
    if (error) throw error
    
    alert('게시물이 삭제되었습니다!')
    fetchUserPosts(selectedUserForPosts.id)
    fetchStats()
  } catch (error) {
    alert('삭제 실패: ' + error.message)
  }
}

  // 이미지 업로드 (공지용)
  const handleNoticeImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    try {
      setNoticeLoading(true)
      const uploadedUrls = []
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `notices/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError
        
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)
        
        uploadedUrls.push(data.publicUrl)
      }
      
      setSelectedImages([...selectedImages, ...uploadedUrls])
    } catch (error) {
      alert('이미지 업로드 실패: ' + error.message)
    } finally {
      setNoticeLoading(false)
    }
  }

  const fetchSignupStats = async () => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      
      const { count: todayCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart)
      const { count: weekCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString())
      const { count: monthCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart)
      const { count: totalCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      
      setSignupStats({ today: todayCount || 0, week: weekCount || 0, month: monthCount || 0, total: totalCount || 0 })
    } catch (error) { console.error('가입 통계 로드 실패:', error) }
  }

  const fetchWeeklySignups = async () => {
    try {
      const days = []
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
      for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', dayStart.toISOString()).lt('created_at', dayEnd.toISOString())
        days.push({ day: dayNames[date.getDay()], date: `${date.getMonth() + 1}/${date.getDate()}`, count: count || 0, isToday: i === 0 })
      }
      setWeeklySignups(days)
    } catch (error) { console.error('주간 가입 추이 로드 실패:', error) }
  }

  const fetchUsersWithActivity = async () => {
    try {
      // 1. 전체 사용자의 등급별 현황 집계 (전체 회원 기준)
      const { data: allProfiles, error: allError } = await supabase.from('profiles').select('consecutive_days')
      if (allError) throw allError
      
      const counts = { vip: 0, gold: 0, silver: 0, bronze: 0, dormant: 0 }
      ;(allProfiles || []).forEach(p => {
        const level = getUserLevel(p.consecutive_days || 0)
        counts[level]++
      })
      setLevelCounts(counts)
      
      // 2. 최근 가입자 20명 (신규 가입 현황용)
      const { data: users, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      
      const usersWithStats = await Promise.all((users || []).map(async (user) => {
        const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const level = getUserLevel(user.consecutive_days || 0)
        return { ...user, postsCount: postsCount || 0, commentsCount: commentsCount || 0, level, levelLabel: getLevelLabel(level) }
      }))
      setUsersWithActivity(usersWithStats)
      
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const dormant = usersWithStats.filter(u => u.level === 'dormant' && new Date(u.created_at) < sevenDaysAgo)
      setDormantUsers(dormant)
    } catch (error) { console.error('사용자 활동 로드 실패:', error) }
  }

  const fetchStoreProducts = async () => {
    try {
      const { data, error } = await supabase.from('store_products').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setStoreProducts(data || [])
    } catch (error) { console.error('스토어 상품 로드 실패:', error) }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      setProductLoading(true)
      const productData = { name: newProduct.name, price: parseInt(newProduct.price), image_url: newProduct.image_url, description: newProduct.description, is_active: newProduct.is_active }
      if (editingProduct) {
        const { error } = await supabase.from('store_products').update(productData).eq('id', editingProduct.id)
        if (error) throw error
        alert('상품이 수정되었습니다!')
      } else {
        const { error } = await supabase.from('store_products').insert([productData])
        if (error) throw error
        alert('상품이 추가되었습니다!')
      }
      setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ name: '', price: '', image_url: '', description: '', is_active: true }); fetchStoreProducts()
    } catch (error) { alert('저장 실패: ' + error.message) } finally { setProductLoading(false) }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('store_products').delete().eq('id', productId)
      if (error) throw error
      alert('상품이 삭제되었습니다!'); fetchStoreProducts()
    } catch (error) { alert('삭제 실패: ' + error.message) }
  }

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setProductLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `store/${fileName}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
      setNewProduct({...newProduct, image_url: data.publicUrl})
    } catch (error) { alert('이미지 업로드 실패: ' + error.message) } finally { setProductLoading(false) }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [users, posts, comments, reportsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true })
      ])
      setStats({ totalUsers: users.count || 0, totalPosts: posts.count || 0, totalComments: comments.count || 0, totalReports: reportsData.count || 0 })
    } catch (error) { console.error('통계 로드 실패:', error) } finally { setLoading(false) }
  }

  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10)
      if (error) throw error
      setRecentUsers(data || [])
    } catch (error) { console.error('신규 가입자 로드 실패:', error) }
  }

  const fetchAllPosts = async (pageNum = 0, search = '', reset = false) => {
    try {
      setLoading(true)
      const start = pageNum * POSTS_PER_PAGE; const end = start + POSTS_PER_PAGE - 1
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).range(start, end)
      if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      const postsWithAuthor = await Promise.all((data || []).map(async (post) => {
        const { data: authorData } = await supabase.from('profiles').select('username').eq('id', post.user_id).single()
        return { ...post, author: authorData?.username || '익명' }
      }))
      if (reset) setAllPosts(postsWithAuthor); else setAllPosts(prev => [...prev, ...postsWithAuthor])
      setPostsHasMore(data.length === POSTS_PER_PAGE); setPostsPage(pageNum)
    } catch (error) { console.error('게시물 로드 실패:', error) } finally { setLoading(false) }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까?')) return
    try {
      await supabase.from('comments').delete().eq('post_id', postId)
      await supabase.from('likes').delete().eq('post_id', postId)
      await supabase.from('reports').delete().eq('post_id', postId)
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      alert('게시물이 삭제되었습니다!'); fetchAllPosts(0, postsSearch, true); fetchStats()
    } catch (error) { alert('삭제 실패: ' + error.message) }
  }

  const fetchAllComments = async (pageNum = 0, search = '', reset = false) => {
    try {
      setLoading(true)
      const start = pageNum * COMMENTS_PER_PAGE; const end = start + COMMENTS_PER_PAGE - 1
      let query = supabase.from('comments').select(`*, posts (id, title)`).order('created_at', { ascending: false }).range(start, end)
      if (search) query = query.ilike('content', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      const commentsWithAuthor = await Promise.all((data || []).map(async (comment) => {
        const { data: authorData } = await supabase.from('profiles').select('username').eq('id', comment.user_id).single()
        return { ...comment, author: authorData?.username || '익명' }
      }))
      if (reset) setAllComments(commentsWithAuthor); else setAllComments(prev => [...prev, ...commentsWithAuthor])
      setCommentsHasMore(data.length === COMMENTS_PER_PAGE); setCommentsPage(pageNum)
    } catch (error) { console.error('댓글 로드 실패:', error) } finally { setLoading(false) }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId)
      if (error) throw error
      alert('댓글이 삭제되었습니다!'); fetchAllComments(0, commentsSearch, true); fetchStats()
    } catch (error) { alert('삭제 실패: ' + error.message) }
  }

  const fetchReports = async () => {
    try {
      setReportsLoading(true)
      const { data, error } = await supabase.from('reports').select(`*, posts (id, title, content, user_id)`).order('created_at', { ascending: false })
      if (error) throw error
      const reportsWithInfo = await Promise.all((data || []).map(async (report) => {
        const { data: reporterData } = await supabase.from('profiles').select('username').eq('id', report.user_id).single()
        let postAuthor = '익명'
        if (report.posts?.user_id) {
          const { data: authorData } = await supabase.from('profiles').select('username').eq('id', report.posts.user_id).single()
          postAuthor = authorData?.username || '익명'
        }
        return { ...report, reporter: reporterData?.username || '익명', postAuthor }
      }))
      setReports(reportsWithInfo)
    } catch (error) { console.error('신고 목록 로드 실패:', error) } finally { setReportsLoading(false) }
  }

  const handleDismissReport = async (reportId) => {
    if (!window.confirm('이 신고를 무시 처리하시겠습니까?')) return
    try {
      const { error } = await supabase.from('reports').delete().eq('id', reportId)
      if (error) throw error
      alert('신고가 무시 처리되었습니다!'); fetchReports(); fetchStats()
    } catch (error) { alert('처리 실패: ' + error.message) }
  }

  const handleDeleteReportedPost = async (reportId, postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까?')) return
    try {
      await supabase.from('comments').delete().eq('post_id', postId)
      await supabase.from('likes').delete().eq('post_id', postId)
      await supabase.from('reports').delete().eq('post_id', postId)
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      alert('게시물이 삭제되었습니다!'); fetchReports(); fetchStats()
    } catch (error) { alert('삭제 실패: ' + error.message) }
  }

  const fetchUserStats = async (period = 'all') => {
    try {
      setLoading(true)
      let dateFilter = null
      const now = new Date()
      if (period === 'today') dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      else if (period === 'week') dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString()
      else if (period === 'month') dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      const { data: profiles } = await supabase.from('profiles').select('id, username')
      if (!profiles?.length) { setUserStats({ topPosters: [], topCommenters: [], allUsers: [] }); return }
      const userStatsData = await Promise.all(profiles.map(async (profile) => {
        let postsQuery = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
        if (dateFilter) postsQuery = postsQuery.gte('created_at', dateFilter)
        const { count: postsCount } = await postsQuery
        let commentsQuery = supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
        if (dateFilter) commentsQuery = commentsQuery.gte('created_at', dateFilter)
        const { count: commentsCount } = await commentsQuery
        return { ...profile, postsCount: postsCount || 0, commentsCount: commentsCount || 0 }
      }))
      const topPosters = [...userStatsData].sort((a, b) => b.postsCount - a.postsCount).slice(0, 5)
      const topCommenters = [...userStatsData].sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 5)
      setUserStats({ topPosters, topCommenters, allUsers: userStatsData })
    } catch (error) { console.error('사용자 통계 로드 실패:', error) } finally { setLoading(false) }
  }

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').eq('type', 'notice').order('created_at', { ascending: false })
      if (error) throw error
      setNotices(data || [])
    } catch (error) { console.error('공지 로드 실패:', error) }
  }

  const handleNoticeSubmit = async (e) => {
    e.preventDefault()
    try {
      setNoticeLoading(true)
      if (editingNotice) {
        const { error } = await supabase.from('posts').update({ category: newNotice.category, title: newNotice.title, content: newNotice.content, images: selectedImages.length > 0 ? selectedImages : null }).eq('id', editingNotice.id)
        if (error) throw error
        alert('수정되었습니다!')
      } else {
        const { error } = await supabase.from('posts').insert([{ user_id: user.id, type: 'notice', category: newNotice.category, title: newNotice.title, content: newNotice.content, images: selectedImages.length > 0 ? selectedImages : null }])
        if (error) throw error
        alert('공지가 작성되었습니다!')
      }
      setIsWriting(false); setEditingNotice(null); setNewNotice({ category: '공지', title: '', content: '' }); setSelectedImages([]); fetchNotices()
    } catch (error) { alert('작성 실패: ' + error.message) } finally { setNoticeLoading(false) }
  }

  const handleNoticeEdit = (notice) => { setEditingNotice(notice); setNewNotice({ category: notice.category, title: notice.title, content: notice.content }); setSelectedImages(notice.images || []); setIsWriting(true) }

  const handleNoticeDelete = async (noticeId) => {
    if (!window.confirm('공지를 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', noticeId)
      if (error) throw error
      alert('삭제되었습니다!'); fetchNotices()
    } catch (error) { alert('삭제 실패: ' + error.message) }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date(); const time = new Date(timestamp)
    const diffMs = now - time; const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMins / 60); const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  const maxWeeklyCount = Math.max(...weeklySignups.map(d => d.count), 1)

  if (loading && activeTab === 'dashboard') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-gray-600 mt-2">로딩 중...</p></div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3"><Shield className="w-6 h-6 text-teal-600" /><h1 className="text-xl font-bold text-gray-900">관리자 페이지</h1></div>
            <button onClick={() => navigate('/feed')} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"><Home className="w-4 h-4" /><span>메인으로</span></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 사용자</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p></div><div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-teal-600" /></div></div></div>
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 게시물</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p></div><div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-cyan-600" /></div></div></div>
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 댓글</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalComments}</p></div><div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-6 h-6 text-emerald-600" /></div></div></div>
          <div onClick={() => setActiveTab('reports')} className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">신고 대기</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.totalReports}</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8 px-6 min-w-max">
              {['dashboard', 'notices', 'store', 'posts', 'comments', 'reports', 'users', 'exchanges'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? (tab === 'reports' ? 'border-red-500 text-red-600' : 'border-teal-500 text-teal-600') : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'dashboard' && '대시보드'}
                  {tab === 'notices' && '공지 관리'}
                  {tab === 'store' && <span className="flex items-center space-x-1"><Gift className="w-4 h-4" /><span>스토어 관리</span></span>}
                  {tab === 'posts' && '게시물 관리'}
                  {tab === 'comments' && '댓글 관리'}
                  {tab === 'reports' && <span className="flex items-center space-x-1"><span>신고 관리</span>{stats.totalReports > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{stats.totalReports}</span>}</span>}
                  {tab === 'users' && '사용자 관리'}
                  {tab === 'exchanges' && <span className="flex items-center space-x-1"><ShoppingBag className="w-4 h-4" /><span>교환 내역</span>{exchangeStats.pending > 0 && <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">{exchangeStats.pending}</span>}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4"><UserPlus className="w-5 h-5 text-teal-600" /><h2 className="text-lg font-bold text-gray-900">📊 가입 통계</h2></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200"><div className="flex items-center justify-between"><div><p className="text-xs text-blue-600 font-medium">오늘</p><p className="text-2xl font-bold text-blue-700">{signupStats.today}명</p></div><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"><Zap className="w-5 h-5 text-blue-600" /></div></div></div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200"><div className="flex items-center justify-between"><div><p className="text-xs text-green-600 font-medium">이번 주</p><p className="text-2xl font-bold text-green-700">{signupStats.week}명</p></div><div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div></div></div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200"><div className="flex items-center justify-between"><div><p className="text-xs text-purple-600 font-medium">이번 달</p><p className="text-2xl font-bold text-purple-700">{signupStats.month}명</p></div><div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center"><Calendar className="w-5 h-5 text-purple-600" /></div></div></div>
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border-2 border-teal-200"><div className="flex items-center justify-between"><div><p className="text-xs text-teal-600 font-medium">전체</p><p className="text-2xl font-bold text-teal-700">{signupStats.total}명</p></div><div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-teal-600" /></div></div></div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4"><BarChart3 className="w-5 h-5 text-cyan-600" /><h2 className="text-lg font-bold text-gray-900">📈 최근 7일 가입 추이</h2></div>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
                    <div className="flex items-end justify-between h-32 gap-2">
                      {weeklySignups.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center justify-end h-24">
                            <span className="text-xs font-bold text-cyan-700 mb-1">{day.count}</span>
                            <div className={`w-full max-w-[40px] rounded-t-lg transition-all ${day.isToday ? 'bg-gradient-to-t from-cyan-500 to-cyan-400' : 'bg-gradient-to-t from-cyan-300 to-cyan-200'}`} style={{ height: `${Math.max((day.count / maxWeeklyCount) * 80, 4)}px`, minHeight: '4px' }} />
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-semibold ${day.isToday ? 'text-cyan-600' : 'text-gray-500'}`}>{day.day}</p>
                            <p className={`text-[10px] ${day.isToday ? 'text-cyan-500 font-bold' : 'text-gray-400'}`}>{day.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4"><Activity className="w-5 h-5 text-teal-600" /><h2 className="text-lg font-bold text-gray-900">🔋 등급별 현황</h2></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-300"><div className="flex items-center justify-between"><div><p className="text-xs text-green-600 font-medium">🟢 VIP (10일+)</p><p className="text-2xl font-bold text-green-700">{levelCounts.vip}명</p></div><BatteryIcon level="vip" size={40} /></div></div>
  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-300"><div className="flex items-center justify-between"><div><p className="text-xs text-yellow-600 font-medium">🟡 골드 (5~9일)</p><p className="text-2xl font-bold text-yellow-700">{levelCounts.gold}명</p></div><BatteryIcon level="gold" size={40} /></div></div>
  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-300"><div className="flex items-center justify-between"><div><p className="text-xs text-orange-600 font-medium">🟠 실버 (2~4일)</p><p className="text-2xl font-bold text-orange-700">{levelCounts.silver}명</p></div><BatteryIcon level="silver" size={40} /></div></div>
  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border-2 border-amber-300"><div className="flex items-center justify-between"><div><p className="text-xs text-amber-600 font-medium">🟤 브론즈 (1일)</p><p className="text-2xl font-bold text-amber-700">{levelCounts.bronze}명</p></div><BatteryIcon level="bronze" size={40} /></div></div>
  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-300"><div className="flex items-center justify-between"><div><p className="text-xs text-red-600 font-medium">🔴 휴면 (0일)</p><p className="text-2xl font-bold text-red-700">{levelCounts.dormant}명</p></div><BatteryIcon level="dormant" size={40} /></div></div>
</div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2"><Activity className="w-5 h-5 text-teal-600" /><h2 className="text-lg font-bold text-gray-900">🆕 신규 가입 현황</h2></div>
                    {dormantUsers.length > 0 && <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium"><UserX className="w-3.5 h-3.5" /><span>휴면 사용자 {dormantUsers.length}명</span></div>}
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
  <div className="flex items-center space-x-1.5 text-xs"><BatteryIcon level="vip" size={18} /><span className="text-gray-600">VIP (10일+ 연속)</span></div>
  <div className="flex items-center space-x-1.5 text-xs"><BatteryIcon level="gold" size={18} /><span className="text-gray-600">골드 (5~9일 연속)</span></div>
  <div className="flex items-center space-x-1.5 text-xs"><BatteryIcon level="silver" size={18} /><span className="text-gray-600">실버 (2~4일 연속)</span></div>
  <div className="flex items-center space-x-1.5 text-xs"><BatteryIcon level="bronze" size={18} /><span className="text-gray-600">브론즈 (1일 출석)</span></div>
  <div className="flex items-center space-x-1.5 text-xs"><BatteryIcon level="dormant" size={18} /><span className="text-gray-600">휴면 (미출석)</span></div>
</div>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    {usersWithActivity.length === 0 ? <p className="text-sm text-gray-600 text-center py-4">가입자가 없습니다</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {usersWithActivity.map((u, index) => (
                          <div key={u.id} className={`bg-white rounded-lg p-3 hover:shadow-md transition-shadow border-l-4 ${u.level === 'vip' ? 'border-l-green-500' : u.level === 'gold' ? 'border-l-yellow-500' : u.level === 'silver' ? 'border-l-orange-500' : u.level === 'bronze' ? 'border-l-amber-500' : 'border-l-red-400'}`}>
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0"><BatteryIcon level={u.level} size={36} /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{u.username || '익명'}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-gray-500"><span>글 {u.postsCount}</span><span>·</span><span>댓글 {u.commentsCount}</span></div>
                              </div>
                              {index < 3 && <span className="text-lg">{index === 0 ? '🆕' : index === 1 ? '✨' : '👋'}</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">가입: {u.created_at ? getTimeAgo(u.created_at) : '최근'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">📊 사용자 활동 통계</h2>
                  <div className="flex gap-2">{['all', 'month', 'week', 'today'].map(p => (<button key={p} onClick={() => { setStatsPeriod(p); fetchUserStats(p) }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statsPeriod === p ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{p === 'all' ? '전체' : p === 'month' ? '이번 달' : p === 'week' ? '이번 주' : '오늘'}</button>))}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    <div className="flex items-center space-x-2 mb-4"><Trophy className="w-5 h-5 text-teal-600" /><h3 className="font-bold text-gray-900">🏆 게시물 작성 TOP 5</h3></div>
                    <div className="space-y-3">{userStats.topPosters.length === 0 ? <p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p> : userStats.topPosters.map((u, index) => (<div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md"><div className="flex items-center space-x-3"><span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}</span><p className="font-semibold text-gray-900">{u.username || '익명'}</p></div><p className="text-lg font-bold text-teal-600">{u.postsCount}개</p></div>))}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center space-x-2 mb-4"><MessageSquare className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-gray-900">💬 댓글 작성 TOP 5</h3></div>
                    <div className="space-y-3">{userStats.topCommenters.length === 0 ? <p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p> : userStats.topCommenters.map((u, index) => (<div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md"><div className="flex items-center space-x-3"><span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}</span><p className="font-semibold text-gray-900">{u.username || '익명'}</p></div><p className="text-lg font-bold text-purple-600">{u.commentsCount}개</p></div>))}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">공지/이벤트 관리</h2><button onClick={() => { setIsWriting(true); setEditingNotice(null); setNewNotice({ category: '공지', title: '', content: '' }); setSelectedImages([]) }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-md"><Plus className="w-4 h-4" /><span>공지 작성</span></button></div>
                {isWriting && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-teal-200">
                    <form onSubmit={handleNoticeSubmit} className="space-y-4">
                      <div><label className="block text-sm font-semibold mb-2">카테고리</label><div className="flex gap-2">{['공지', '이벤트'].map(cat => <button key={cat} type="button" onClick={() => setNewNotice({...newNotice, category: cat})} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newNotice.category === cat ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{cat}</button>)}</div></div>
                      <div><label className="block text-sm font-semibold mb-2">제목 *</label><input type="text" required value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} placeholder="제목을 입력하세요" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div>
                      <div><label className="block text-sm font-semibold mb-2">내용 *</label><textarea required value={newNotice.content} onChange={(e) => setNewNotice({...newNotice, content: e.target.value})} placeholder="내용을 입력하세요" rows="6" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none" /></div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2">이미지 첨부</label>
                        <div className="flex items-center gap-4">
                          <input type="file" id="notice-image-upload" accept="image/*" multiple onChange={handleNoticeImageUpload} className="hidden" />
                          <label htmlFor="notice-image-upload" className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">이미지 선택</span>
                          </label>
                          <span className="text-sm text-gray-500">{selectedImages.length}개 선택됨</span>
                        </div>
                        {selectedImages.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedImages.map((url, idx) => (
                              <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setIsWriting(false); setEditingNotice(null); setNewNotice({ category: '공지', title: '', content: '' }); setSelectedImages([]) }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">취소</button><button type="submit" disabled={noticeLoading} className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50">{noticeLoading ? '작성 중...' : editingNotice ? '수정 완료' : '작성 완료'}</button></div>
                    </form>
                  </div>
                )}
                <div className="space-y-3">{notices.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-xl"><Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">작성된 공지가 없습니다</p></div> : notices.map(notice => (
                  <div key={notice.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1"><div className="flex items-center space-x-2 mb-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${notice.category === '공지' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{notice.category}</span><span className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</span></div><h3 className="font-bold text-gray-900 mb-1">{notice.title}</h3><p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p></div>
                      <div className="flex gap-2 ml-4"><button onClick={() => handleNoticeEdit(notice)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleNoticeDelete(notice.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  </div>
                ))}</div>
              </div>
            )}

{activeTab === 'store' && (
              <div>
                {/* 🆕 복권 지급 섹션 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎰 복권 지급
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">테스트중</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">닉네임</label>
                      <input
                        type="text"
                        value={lotteryUsername}
                        onChange={(e) => setLotteryUsername(e.target.value)}
                        placeholder="닉네임 입력"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">지급 개수</label>
                      <input
                        type="number"
                        value={lotteryAmount}
                        onChange={(e) => setLotteryAmount(parseInt(e.target.value) || 1)}
                        min="1"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={handleGiveLottery}
                        disabled={lotteryLoading}
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold disabled:opacity-50 hover:from-purple-600 hover:to-pink-600"
                      >
                        {lotteryLoading ? '처리 중...' : '🎫 복권 지급하기'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">🎁 스토어 상품 관리</h2><button onClick={() => { setIsAddingProduct(true); setEditingProduct(null); setNewProduct({ name: '', price: '', image_url: '', description: '', is_active: true }) }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-md"><Plus className="w-4 h-4" /><span>상품 추가</span></button></div>
                {isAddingProduct && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-teal-200">
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-2">상품명 *</label><input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="예: 스타벅스 아메리카노" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div><div><label className="block text-sm font-semibold mb-2">포인트 *</label><input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} placeholder="예: 4000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div></div>
                      <div><label className="block text-sm font-semibold mb-2">상품 이미지</label><div className="flex items-center gap-4"><input type="file" id="product-image-upload" accept="image/*" onChange={handleProductImageUpload} className="hidden" /><label htmlFor="product-image-upload" className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"><ImageIcon className="w-4 h-4 text-gray-600" /><span className="text-sm text-gray-700">이미지 업로드</span></label><span className="text-sm text-gray-500">또는</span><input type="text" value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} placeholder="이미지 URL 또는 이모지" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div>{newProduct.image_url && <div className="mt-2 w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">{newProduct.image_url.startsWith('http') ? <img src={newProduct.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">{newProduct.image_url}</span>}</div>}</div>
                      <div><label className="block text-sm font-semibold mb-2">설명</label><input type="text" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="상품 설명 (선택)" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div>
                      <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={newProduct.is_active} onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})} className="w-4 h-4 text-teal-600" /><label htmlFor="is_active" className="text-sm text-gray-700">상품 활성화</label></div>
                      <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ name: '', price: '', image_url: '', description: '', is_active: true }) }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">취소</button><button type="submit" disabled={productLoading} className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50">{productLoading ? '저장 중...' : editingProduct ? '수정 완료' : '상품 추가'}</button></div>
                    </form>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{storeProducts.length === 0 ? <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl"><Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">등록된 상품이 없습니다</p></div> : storeProducts.map(product => (
                  <div key={product.id} className={`bg-white border-2 rounded-xl p-4 hover:shadow-md ${product.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start gap-4"><div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">{product.image_url?.startsWith('http') ? <img src={product.image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">{product.image_url || '🎁'}</span>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-gray-900 truncate">{product.name}</h3>{!product.is_active && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">비활성</span>}</div><p className="text-teal-600 font-bold">{product.price?.toLocaleString()}P</p>{product.description && <p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>}</div></div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100"><button onClick={() => { setEditingProduct(product); setNewProduct({ name: product.name, price: product.price?.toString() || '', image_url: product.image_url || '', description: product.description || '', is_active: product.is_active }); setIsAddingProduct(true) }} className="flex-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 flex items-center justify-center gap-1"><Edit2 className="w-3.5 h-3.5" /><span>수정</span></button><button onClick={() => handleDeleteProduct(product.id)} className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /><span>삭제</span></button></div>
                  </div>
                ))}</div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">📝 전체 게시물 관리</h2><div className="relative"><input type="text" value={postsSearch} onChange={(e) => { setPostsSearch(e.target.value); fetchAllPosts(0, e.target.value, true) }} placeholder="게시물 검색..." className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div></div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유형</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">제목</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th><th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th></tr></thead><tbody className="divide-y divide-gray-200">{allPosts.length === 0 ? <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">게시물이 없습니다</td></tr> : allPosts.map((post, index) => <tr key={post.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-900">{postsPage * POSTS_PER_PAGE + index + 1}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' : post.type === 'job' ? 'bg-cyan-100 text-cyan-700' : post.type === 'talk' ? 'bg-orange-100 text-orange-700' : post.type === 'notice' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{post.category || post.type}</span></td><td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{post.title}</td><td className="px-4 py-3 text-sm text-gray-600">{post.author}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => window.open(`/feed#post-${post.id}`, '_blank')} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="보기"><Eye className="w-4 h-4" /></button><button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="삭제"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div></div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">💬 전체 댓글 관리</h2><div className="relative"><input type="text" value={commentsSearch} onChange={(e) => { setCommentsSearch(e.target.value); fetchAllComments(0, e.target.value, true) }} placeholder="댓글 검색..." className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div></div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">게시물</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">댓글 내용</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th><th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th></tr></thead><tbody className="divide-y divide-gray-200">{allComments.length === 0 ? <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">댓글이 없습니다</td></tr> : allComments.map((comment, index) => <tr key={comment.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-900">{commentsPage * COMMENTS_PER_PAGE + index + 1}</td><td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{comment.posts?.title || '삭제된 게시물'}</td><td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{comment.content}</td><td className="px-4 py-3 text-sm text-gray-600">{comment.author}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2">{comment.posts?.id && <button onClick={() => window.open(`/feed#post-${comment.posts.id}`, '_blank')} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="게시물 보기"><Eye className="w-4 h-4" /></button>}<button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="삭제"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div></div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">🚨 신고 관리</h2><button onClick={fetchReports} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">새로고침</button></div>
                {reportsLoading ? <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-gray-600 mt-2">로딩 중...</p></div> : reports.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-xl"><AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">신고된 게시물이 없습니다</p><p className="text-sm text-gray-500 mt-1">깨끗한 커뮤니티 유지 중! 👍</p></div> : (
                  <div className="space-y-4">{reports.map(report => (
                    <div key={report.id} className="bg-white border-2 border-red-200 rounded-xl p-5 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{report.reason}</span><span className="text-xs text-gray-500">신고자: {report.reporter}</span><span className="text-xs text-gray-400">{getTimeAgo(report.created_at)}</span></div>
                          {report.posts ? <div className="bg-gray-50 rounded-lg p-4"><div className="flex items-center space-x-2 mb-2"><span className="text-xs text-gray-500">작성자: {report.postAuthor}</span></div><h4 className="font-bold text-gray-900 mb-1">{report.posts.title}</h4><p className="text-sm text-gray-600 line-clamp-2">{report.posts.content}</p></div> : <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">삭제된 게시물입니다</div>}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {report.posts && <><button onClick={() => window.open(`/feed#post-${report.posts.id}`, '_blank')} className="flex items-center space-x-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100"><Eye className="w-4 h-4" /><span>보기</span></button><button onClick={() => handleDeleteReportedPost(report.id, report.posts.id)} className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"><Trash2 className="w-4 h-4" /><span>삭제</span></button></>}
                          <button onClick={() => handleDismissReport(report.id)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"><X className="w-4 h-4" /><span>무시</span></button>
                        </div>
                      </div>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

{activeTab === 'users' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-bold text-gray-900">👥 사용자 관리</h2>
      <div className="relative">
        <input 
          type="text" 
          value={usersSearch} 
          onChange={(e) => { setUsersSearch(e.target.value); fetchAllUsersWithPoints(e.target.value) }} 
          placeholder="사용자 검색..." 
          className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" 
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>
    </div>

    {loading ? (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
      </div>
    ) : allUsersWithPoints.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">사용자가 없습니다</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUsersWithPoints.map((u) => (
          <div key={u.id} className={`bg-white border-2 rounded-xl p-4 hover:shadow-md ${u.is_banned ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <BatteryIcon level={u.level} size={48} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{u.username || '익명'}</h3>
                  <div className="flex items-center gap-1">
                    {u.role === '관리자' && <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-semibold">관리자</span>}
                    {u.is_banned && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">정지</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.level === 'vip' ? 'bg-green-100 text-green-700' : u.level === 'gold' ? 'bg-yellow-100 text-yellow-700' : u.level === 'silver' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {u.levelLabel}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span>글 {u.postsCount}</span>
                  <span>댓글 {u.commentsCount}</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-teal-600" />
                    <span className="text-lg font-bold text-teal-700">{(u.points || 0).toLocaleString()}P</span>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(u)}
                    className="px-3 py-1 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600"
                  >
                    포인트
                  </button>
                </div>

                {/* 🆕 글 보기 + 정지 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUserForPosts(u)
                      fetchUserPosts(u.id)
                    }}
                    className="flex-1 px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-xs font-medium hover:bg-cyan-600 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>글 보기</span>
                  </button>
                  <button
                    onClick={() => handleBanUser(u.id, u.is_banned)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${u.is_banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {u.is_banned ? '해제' : '정지'}
                  </button>
                </div>

                {/* 🆕 권한 변경 버튼 */}
                <button
                  onClick={() => handleChangeRole(u.id, u.role, u.username)}
                  className={`w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${u.role === '관리자' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{u.role === '관리자' ? '관리자 → 일반' : '일반 → 관리자'}</span>
                </button>

                <p className="text-[10px] text-gray-400 mt-2">가입: {u.created_at ? getTimeAgo(u.created_at) : '최근'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* 🆕 사용자 글 목록 모달 */}
    {selectedUserForPosts && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-4 border-b">
            <div className="flex items-center gap-3">
              <BatteryIcon level={selectedUserForPosts.level} size={40} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{selectedUserForPosts.username || '익명'}</h3>
                  {selectedUserForPosts.role === '관리자' && <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full font-semibold">관리자</span>}
                  {selectedUserForPosts.is_banned && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">정지</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedUserForPosts.level === 'vip' ? 'bg-green-100 text-green-700' : selectedUserForPosts.level === 'gold' ? 'bg-yellow-100 text-yellow-700' : selectedUserForPosts.level === 'silver' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedUserForPosts.levelLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-600">글 {selectedUserForPosts.postsCount}개 · 댓글 {selectedUserForPosts.commentsCount}개 · {(selectedUserForPosts.points || 0).toLocaleString()}P</p>
              </div>
            </div>
            <button onClick={() => {setSelectedUserForPosts(null); setUserPosts([])}} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-3">📝 작성한 글 ({userPosts.length}개)</h4>
            
            {userPostsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">작성한 글이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' : post.type === 'job' ? 'bg-cyan-100 text-cyan-700' : post.type === 'talk' ? 'bg-orange-100 text-orange-700' : post.type === 'notice' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {post.category || post.type}
                          </span>
                          <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <h5 className="font-semibold text-gray-900 mb-1 truncate">{post.title}</h5>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => window.open(`/feed#post-${post.id}`, '_blank')}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUserPost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {setSelectedUserForPosts(null); setUserPosts([])}}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              닫기
            </button>
            <button
              onClick={() => handleBanUser(selectedUserForPosts.id, selectedUserForPosts.is_banned)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white ${selectedUserForPosts.is_banned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {selectedUserForPosts.is_banned ? '회원 정지 해제' : '회원 정지'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 포인트 관리 모달 (기존 유지) */}
    {selectedUser && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">포인트 관리</h3>
            <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <BatteryIcon level={selectedUser.level} size={48} />
              <div>
                <p className="font-bold text-gray-900">{selectedUser.username || '익명'}</p>
                <p className="text-sm text-gray-600">{selectedUser.levelLabel}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-4 h-4 text-teal-600" />
                  <span className="text-lg font-bold text-teal-700">{(selectedUser.points || 0).toLocaleString()}P</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePointAction} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">액션</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPointAction({...pointAction, type: 'add'})}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pointAction.type === 'add' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  💰 지급
                </button>
                <button
                  type="button"
                  onClick={() => setPointAction({...pointAction, type: 'subtract'})}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pointAction.type === 'subtract' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  ➖ 차감
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">포인트 *</label>
              <input
                type="number"
                required
                min="1"
                value={pointAction.amount}
                onChange={(e) => setPointAction({...pointAction, amount: e.target.value})}
                placeholder="포인트 입력"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">사유 (선택)</label>
              <input
                type="text"
                value={pointAction.reason}
                onChange={(e) => setPointAction({...pointAction, reason: e.target.value})}
                placeholder="예: 이벤트 참여 보상"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pointLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold shadow-lg disabled:opacity-50 ${pointAction.type === 'add' ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                {pointLoading ? '처리 중...' : pointAction.type === 'add' ? '지급하기' : '차감하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)}

            {/* 🆕 교환 내역 탭 */}
            {activeTab === 'exchanges' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">🛒 교환 신청 내역</h2>
                  <button 
                    onClick={() => fetchExchanges(exchangesFilter)} 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    새로고침
                  </button>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">전체</p>
                        <p className="text-2xl font-bold text-gray-700">{exchangeStats.total}</p>
                      </div>
                      <ShoppingBag className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => { setExchangesFilter('pending'); fetchExchanges('pending') }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-600 font-medium">대기중</p>
                        <p className="text-2xl font-bold text-yellow-700">{exchangeStats.pending}</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => { setExchangesFilter('processing'); fetchExchanges('processing') }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium">처리중</p>
                        <p className="text-2xl font-bold text-blue-700">{exchangeStats.processing}</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => { setExchangesFilter('completed'); fetchExchanges('completed') }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600 font-medium">완료</p>
                        <p className="text-2xl font-bold text-green-700">{exchangeStats.completed}</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => { setExchangesFilter('cancelled'); fetchExchanges('cancelled') }}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-red-600 font-medium">취소</p>
                        <p className="text-2xl font-bold text-red-700">{exchangeStats.cancelled}</p>
                      </div>
                      <UserX className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                </div>

                {/* 필터 버튼 */}
                <div className="flex gap-2 mb-4">
                  {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setExchangesFilter(status); fetchExchanges(status) }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        exchangesFilter === status 
                          ? 'bg-teal-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? '전체' : getStatusLabel(status)}
                    </button>
                  ))}
                </div>

                {/* 교환 내역 리스트 */}
                {exchangesLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
                  </div>
                ) : exchanges.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">교환 신청 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exchanges.map((exchange) => (
                      <div key={exchange.id} className={`bg-white border-2 rounded-xl p-5 hover:shadow-md ${getStatusColor(exchange.status)}`}>
                        <div className="flex items-start justify-between gap-4">
                          {/* 왼쪽: 상품 정보 */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                              {exchange.store_products?.image_url?.startsWith('http') ? (
                                <img src={exchange.store_products.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-3xl">{exchange.store_products?.image_url || '🎁'}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{exchange.store_products?.name || '삭제된 상품'}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(exchange.status)}`}>
                                  {getStatusLabel(exchange.status)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">신청자</p>
                                  <p className="font-semibold text-gray-900">{exchange.profiles?.username || '익명'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">연락처</p>
                                  <p className="font-semibold text-teal-600">{exchange.phone_number}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">포인트</p>
                                  <p className="font-semibold text-gray-900">{exchange.store_products?.price?.toLocaleString()}P</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">신청일시</p>
                                  <p className="font-semibold text-gray-900">{new Date(exchange.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 오른쪽: 상태 변경 버튼 */}
                          <div className="flex flex-col gap-2">
                            {exchange.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateExchangeStatus(exchange.id, 'processing')}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 whitespace-nowrap"
                                >
                                  처리중으로
                                </button>
                                <button
                                  onClick={() => handleUpdateExchangeStatus(exchange.id, 'cancelled')}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </>
                            )}
                            
                            {exchange.status === 'processing' && (
                              <>
                                <button
                                  onClick={() => handleUpdateExchangeStatus(exchange.id, 'completed')}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 whitespace-nowrap"
                                >
                                  완료
                                </button>
                                <button
                                  onClick={() => handleUpdateExchangeStatus(exchange.id, 'cancelled')}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </>
                            )}
                            
                            {(exchange.status === 'completed' || exchange.status === 'cancelled') && (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-2xl">
                                  {exchange.status === 'completed' ? '✅' : '❌'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
       )}
       </div>
     </div>
   </div>

   {/* 🆕 관리자 알림 모달 */}
   {showAlertModal && adminAlerts.length > 0 && (
     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
       <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-bounce-once">
         {/* 헤더 */}
         <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl p-4 text-white">
           <div className="flex items-center justify-center space-x-2">
             <span className="text-3xl">🔔</span>
             <h2 className="text-xl font-bold">관리자 알림</h2>
           </div>
         </div>
         
         {/* 알림 내용 */}
         <div className="p-6 space-y-4">
           {adminAlerts.map((alert, index) => (
             <div 
               key={index}
               className={`p-4 rounded-xl border-2 ${
                 alert.type === 'report' 
                   ? 'bg-red-50 border-red-200' 
                   : 'bg-yellow-50 border-yellow-200'
               }`}
             >
               <div className="flex items-start space-x-3">
                 <span className="text-2xl">
                   {alert.type === 'report' ? '🚨' : '🛒'}
                 </span>
                 <div className="flex-1">
                   <p className={`font-bold ${
                     alert.type === 'report' ? 'text-red-700' : 'text-yellow-700'
                   }`}>
                     {alert.message}
                   </p>
                   {alert.detail && (
                     <p className="text-sm text-gray-600 mt-1">{alert.detail}</p>
                   )}
                 </div>
               </div>
               
               <button
                 onClick={() => handleGoToAlert(alert.type)}
                 className={`mt-3 w-full py-2 rounded-lg font-semibold text-white ${
                   alert.type === 'report'
                     ? 'bg-red-500 hover:bg-red-600'
                     : 'bg-yellow-500 hover:bg-yellow-600'
                 }`}
               >
                 {alert.type === 'report' ? '신고 관리로 이동' : '교환 내역으로 이동'}
               </button>
             </div>
           ))}
         </div>
         
         {/* 닫기 버튼 */}
         <div className="p-4 border-t border-gray-200">
           <button
             onClick={handleDismissAlerts}
             className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
           >
             확인했습니다
           </button>
           <p className="text-xs text-gray-400 text-center mt-2">
             * 30초마다 새 알림을 확인합니다
           </p>
         </div>
       </div>
     </div>
   )}
 </div>
)
}