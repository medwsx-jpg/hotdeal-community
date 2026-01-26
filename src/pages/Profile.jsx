import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Camera, ArrowLeft, Save, FileText, MessageCircle, Briefcase, MoreVertical, Edit2, Trash2, X, Image as ImageIcon, Plus, ShoppingBag, Package } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// 🆕 배터리 아이콘 컴포넌트
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
          <linearGradient id="rainbowGradientProfile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="17%" stopColor="#ff8000" />
            <stop offset="33%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="67%" stopColor="#0080ff" />
            <stop offset="83%" stopColor="#8000ff" />
            <stop offset="100%" stopColor="#ff0080" />
          </linearGradient>
          <linearGradient id="rainbowBorderProfile" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="100%" stopColor="#0000ff" />
          </linearGradient>
        </defs>
        {/* 외곽 원형 테두리 (무지개) */}
        <circle cx="20" cy="20" r="19" stroke="url(#rainbowBorderProfile)" strokeWidth="2" fill="none" />
        {/* 배경 원 */}
        <circle cx="20" cy="20" r="17.5" fill="#fefefe" />
        
        {/* 배터리 본체 외곽 (세로) */}
        <rect x="13" y="12" width="14" height="20" rx="2" stroke="url(#rainbowGradientProfile)" strokeWidth="2" fill="none" />
        {/* 배터리 단자 (위쪽) */}
        <rect x="16" y="8" width="8" height="4" rx="1" fill="url(#rainbowGradientProfile)" />
        
        {/* 배터리 바들 - 무지개 색상 */}
        <rect x="15" y="25" width="10" height="5" rx="1" fill="#22c55e" />
        <rect x="15" y="19" width="10" height="5" rx="1" fill="#eab308" />
        <rect x="15" y="13" width="10" height="5" rx="1" fill="#ef4444" />
      </svg>
    )
  }
  
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* 외곽 원형 테두리 (연한 빨간색) */}
      <circle cx="20" cy="20" r="19" stroke="#fca5a5" strokeWidth="1.5" fill="none" />
      {/* 회색 배경 원 */}
      <circle cx="20" cy="20" r="17.5" fill="#f3f4f6" />
      
      {/* 배터리 본체 외곽 (세로) */}
      <rect x="13" y="12" width="14" height="20" rx="2" stroke={config.color} strokeWidth="2" fill="none" />
      {/* 배터리 단자 (위쪽) */}
      <rect x="16" y="8" width="8" height="4" rx="1" fill={config.color} />
      
      {/* 배터리 바들 (아래서부터 채워짐) */}
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

// 🆕 사용자 등급 계산 함수 (연속 출석 기준)
const getUserLevel = (consecutiveDays) => {
  if (consecutiveDays >= 10) return 'vip'       // 10일 연속 → VIP
  if (consecutiveDays >= 5) return 'gold'       // 5일 연속 → 골드
  if (consecutiveDays >= 2) return 'silver'     // 2일 연속 → 실버
  if (consecutiveDays >= 1) return 'bronze'     // 1일 출석 → 브론즈
  return 'dormant'                               // 0일 → 휴면
}

// 🆕 등급 라벨
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

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  })
  // 🆕 닉네임 중복 체크
  const [isUsernameChecked, setIsUsernameChecked] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  // 🆕 사용자 등급 관련
const [userConsecutiveDays, setUserConsecutiveDays] = useState(0)
const [userLevel, setUserLevel] = useState('dormant')

  // 🆕 탭 관련 State
  // 🆕 탭 관련 State
const [activeTab, setActiveTab] = useState('main')
const [myPosts, setMyPosts] = useState([])
const [myComments, setMyComments] = useState([])
const [myPostsCount, setMyPostsCount] = useState(0)
const [myCommentsCount, setMyCommentsCount] = useState(0)
  const [receivedApplications, setReceivedApplications] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [applicationSubTab, setApplicationSubTab] = useState('received')
  
  // 🆕 게시물 수정/삭제 관련 State
  const [openMenuId, setOpenMenuId] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  
  // 🆕 댓글 수정/삭제 관련 State
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null)
  const [isEditCommentModalOpen, setIsEditCommentModalOpen] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  
  // 🆕 교환 내역 관련 State
  const [myExchanges, setMyExchanges] = useState([])
  const [exchangesLoading, setExchangesLoading] = useState(false)
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    type: 'hotdeal',
    category: '',
    tags: '',
    discount: '',
    price: '',
    hourlyPay: '',
    location: '',
    period: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])
  useEffect(() => {
    if (!user) return
    
    const fetchUserLevel = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('consecutive_days')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        const days = data?.consecutive_days || 0
        setUserConsecutiveDays(days)
        setUserLevel(getUserLevel(days))
      } catch (error) {
        console.error('등급 조회 실패:', error)
      }
    }
    
    fetchUserLevel()
  }, [user])

  // 🆕 메인 화면에서 글/댓글 카운트 조회
useEffect(() => {
  if (!user) return
  
  const fetchCounts = async () => {
    try {
      // 내가 쓴 글 개수
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      setMyPostsCount(postsCount || 0)
      
      // 내가 쓴 댓글 개수
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      setMyCommentsCount(commentsCount || 0)
    } catch (error) {
      console.error('카운트 조회 실패:', error)
    }
  }
  
  fetchCounts()
}, [user])

// 🆕 탭 변경 시 데이터 로드
useEffect(() => {
  if (!user) return
  
  if (activeTab === 'posts') {
    fetchMyPosts()
  } else if (activeTab === 'comments') {
    fetchMyComments()
  } else if (activeTab === 'applications') {
    if (applicationSubTab === 'received') {
      fetchReceivedApplications()
    } else {
      fetchMyApplications()
    }
  } else if (activeTab === 'exchanges') {
    fetchMyExchanges()
  }
}, [activeTab, applicationSubTab, user])

  // 🆕 내가 신청한 교환 내역
  const fetchMyExchanges = async () => {
    try {
      setExchangesLoading(true)
      
      const { data: exchangesData, error } = await supabase
        .from('reward_exchanges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 각 교환 건에 대해 상품 정보 가져오기
      const exchangesWithProducts = await Promise.all(
        (exchangesData || []).map(async (exchange) => {
          const { data: productData } = await supabase
            .from('store_products')
            .select('name, price, image_url')
            .eq('id', exchange.product_id)
            .single()
          
          return {
            ...exchange,
            store_products: productData
          }
        })
      )
      
      setMyExchanges(exchangesWithProducts)
    } catch (error) {
      console.error('교환 내역 로드 실패:', error)
    } finally {
      setExchangesLoading(false)
    }
  }

  // 🆕 내가 작성한 글
  const fetchMyPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMyPosts(data || [])
    } catch (error) {
      console.error('게시글 로드 실패:', error)
    }
  }

  // 🆕 내가 단 댓글
  const fetchMyComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          posts (
            id,
            title,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMyComments(data || [])
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    }
  }

  // ✅ 받은 지원 내역 (수정됨 - 2단계 쿼리)
  const fetchReceivedApplications = async () => {
    try {
      // 1단계: 내가 작성한 구인 게시물 ID들 가져오기
      const { data: myPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('type', 'job')
        .eq('category', '구인')
      
      if (postsError) throw postsError
      
      if (!myPosts || myPosts.length === 0) {
        setReceivedApplications([])
        return
      }
      
      // 2단계: 해당 게시물들에 대한 지원 가져오기
      const postIds = myPosts.map(p => p.id)
      
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })
      
      if (appError) throw appError
      
      // 3단계: 지원자 정보 가져오기
      const applicationsWithDetails = await Promise.all(
        (applications || []).map(async (app) => {
          // 지원자 프로필
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', app.user_id)
            .single()
          
          // 게시물 정보 매칭
          const post = myPosts.find(p => p.id === app.post_id)
          
          return {
            ...app,
            profiles: profileData,
            posts: post
          }
        })
      )
      
      setReceivedApplications(applicationsWithDetails)
    } catch (error) {
      console.error('받은 지원 로드 실패:', error)
    }
  }

  // 🆕 내가 지원한 내역
  const fetchMyApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          posts (
            id,
            title,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMyApplications(data || [])
    } catch (error) {
      console.error('내 지원 로드 실패:', error)
    }
  }

  // 🆕 닉네임 중복 체크
  const checkUsernameAvailability = async () => {
    if (!formData.username.trim()) {
      alert('닉네임을 입력해주세요')
      return
    }
    
    // 현재 본인 닉네임과 같으면 패스
    if (formData.username.trim() === profile?.username) {
      setIsUsernameChecked(true)
      setIsUsernameAvailable(true)
      alert('현재 사용 중인 닉네임입니다')
      return
    }
    
    try {
      setCheckingUsername(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username.trim())
        .neq('id', user.id)
        .single()
      
      if (error && error.code === 'PGRST116') {
        // 결과 없음 = 사용 가능
        setIsUsernameAvailable(true)
        setIsUsernameChecked(true)
        alert('✅ 사용 가능한 닉네임입니다!')
      } else if (data) {
        // 중복됨
        setIsUsernameAvailable(false)
        setIsUsernameChecked(true)
        alert('❌ 이미 사용 중인 닉네임입니다')
      }
    } catch (error) {
      console.error('닉네임 체크 실패:', error)
      alert('닉네임 확인에 실패했습니다')
    } finally {
      setCheckingUsername(false)
    }
  }

  // 🆕 시간 표시
  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMs = now - postTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  // 🆕 상태 라벨
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

  // 🆕 게시물 수정
  const handleEdit = (post) => {
    setEditingPost(post)
    setEditFormData({
      title: post.title,
      content: post.content,
      type: post.type,
      category: post.category,
      tags: post.tags?.join(', ') || '',
      discount: post.discount || '',
      price: post.price || '',
      hourlyPay: post.hourly_pay || '',
      location: post.location || '',
      period: post.period || ''
    })
    setSelectedImages(post.images || [])
    setIsEditModalOpen(true)
  }

  // 🆕 게시물 삭제
  const handleDelete = async (postId) => {
    if (!window.confirm('게시물을 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      
      alert('삭제되었습니다!')
      fetchMyPosts()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  // 🆕 댓글 수정 열기
  const handleEditComment = (comment) => {
    setEditingComment(comment)
    setEditCommentContent(comment.content)
    setIsEditCommentModalOpen(true)
    setOpenCommentMenuId(null)
  }

  // 🆕 댓글 수정 제출
  const handleEditCommentSubmit = async (e) => {
    e.preventDefault()
    if (!editCommentContent.trim()) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('comments')
        .update({ content: editCommentContent.trim() })
        .eq('id', editingComment.id)
      
      if (error) throw error
      
      alert('댓글이 수정되었습니다!')
      setIsEditCommentModalOpen(false)
      setEditingComment(null)
      setEditCommentContent('')
      fetchMyComments()
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      alert('댓글 수정 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      
      if (error) throw error
      
      alert('댓글이 삭제되었습니다!')
      setOpenCommentMenuId(null)
      fetchMyComments()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('댓글 삭제 실패: ' + error.message)
    }
  }

  // 🆕 이미지 선택
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    try {
      setLoading(true)
      
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, file)
          
          if (uploadError) throw uploadError
          
          const { data } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath)
          
          return data.publicUrl
        })
      )
      
      setSelectedImages([...selectedImages, ...uploadedUrls])
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 이미지 제거
  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  // 🆕 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('posts')
        .update({
          type: editFormData.type,
          category: editFormData.category,
          title: editFormData.title,
          content: editFormData.content,
          tags: editFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          discount: editFormData.discount || null,
          price: editFormData.price || null,
          hourly_pay: editFormData.hourlyPay || null,
          location: editFormData.location || null,
          period: editFormData.period || null,
          images: selectedImages.length > 0 ? selectedImages : null
        })
        .eq('id', editingPost.id)
      
      if (error) throw error
      
      alert('수정되었습니다!')
      setIsEditModalOpen(false)
      setEditingPost(null)
      setSelectedImages([])
      fetchMyPosts()
    } catch (error) {
      console.error('수정 실패:', error)
      alert('수정 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 🆕 닉네임이 변경되었는데 중복 체크 안했으면 차단
    if (formData.username.trim() !== profile?.username && !isUsernameChecked) {
      alert('닉네임 중복 확인을 해주세요')
      return
    }
    
    if (formData.username.trim() !== profile?.username && !isUsernameAvailable) {
      alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요')
      return
    }
    
    try {
      setLoading(true)
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            bio: formData.bio,
            avatar_url: formData.avatar_url
          })
          .eq('id', user.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            username: formData.username,
            bio: formData.bio,
            avatar_url: formData.avatar_url,
            role: '회원'
          }])
        
        if (error) throw error
      }
  
      alert('프로필이 저장되었습니다!')
      navigate('/feed')
    } catch (error) {
      console.error('프로필 저장 실패:', error)
      alert('프로필 저장 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
     {/* 🆕 메인 화면 */}
{activeTab === 'main' && (
  <div className="max-w-lg mx-auto">
    {/* 🆕 돌아가기 버튼 */}
    <div className="px-4 py-3">
      <button
        onClick={() => navigate('/feed')}
        className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">돌아가기</span>
      </button>
    </div>

    {/* 프로필 카드 */}
    <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
            <BatteryIcon level={userLevel} size={80} isAdmin={profile?.role === '관리자'} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-gray-900">{formData.username || user?.email}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    userLevel === 'vip' ? 'bg-green-100 text-green-700' : 
                    userLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' : 
                    userLevel === 'silver' ? 'bg-orange-100 text-orange-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {getLevelLabel(userLevel)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-500">연속 {userConsecutiveDays}일 출석 · {profile?.points || 0}P</p>
              </div>
            </div>
          </div>
  
          {/* 🆕 세로 메뉴 리스트 */}
          <div className="bg-white">
            {/* 프로필 수정 */}
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">프로필 수정</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
  
{/* 내가 쓴 글 */}
<button
  onClick={() => setActiveTab('posts')}
  className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
>
  <div className="flex items-center space-x-3">
    <FileText className="w-5 h-5 text-gray-600" />
    <span className="font-medium text-gray-900">내가 쓴 글 ({myPostsCount})</span>
  </div>
  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
</button>

{/* 내가 쓴 댓글 */}
<button
  onClick={() => setActiveTab('comments')}
  className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
>
  <div className="flex items-center space-x-3">
    <MessageCircle className="w-5 h-5 text-gray-600" />
    <span className="font-medium text-gray-900">내가 쓴 댓글 ({myCommentsCount})</span>
  </div>
  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
</button>
  
            {/* 지원 내역 */}
            <button
              onClick={() => setActiveTab('applications')}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">지원 내역</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
  
            {/* 교환 내역 */}
            <button
              onClick={() => setActiveTab('exchanges')}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">교환 내역</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
  
            {/* 1:1 문의 */}
            <button
              onClick={() => window.open('https://open.kakao.com/o/sNlIAtbi', '_blank')}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">1:1 문의 (카카오톡)</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
  
            {/* 로그아웃 */}
            <button
              onClick={async () => {
                if (window.confirm('로그아웃 하시겠습니까?')) {
                  await signOut()
                  window.location.href = '/'
                }
              }}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ArrowLeft className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-600">로그아웃</span>
              </div>
            </button>
          </div>
        </div>
      )}
  
      {/* 🆕 프로필 수정 화면 */}
      {activeTab === 'profile' && (
        <div className="max-w-lg mx-auto">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center">
              <button onClick={() => setActiveTab('main')} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold">프로필 수정</h1>
            </div>
          </div>
  
          {/* 프로필 수정 폼 */}
          <div className="bg-white p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
              <BatteryIcon level={userLevel} size={80} isAdmin={profile?.role === '관리자'} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{formData.username || user?.email}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      userLevel === 'vip' ? 'bg-green-100 text-green-700' : 
                      userLevel === 'gold' ? 'bg-yellow-100 text-yellow-700' : 
                      userLevel === 'silver' ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {getLevelLabel(userLevel)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">연속 {userConsecutiveDays}일 출석</p>
                  <p className="text-xs text-gray-500">가입일: {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
  
             {/* Username */}
             <div>
                <label className="block text-sm font-semibold mb-2">닉네임 *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({...formData, username: e.target.value})
                      setIsUsernameChecked(false)
                      setIsUsernameAvailable(false)
                    }}
                    placeholder="닉네임을 입력하세요"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={checkUsernameAvailability}
                    disabled={checkingUsername || !formData.username.trim()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
                  >
                    {checkingUsername ? '확인중...' : '중복확인'}
                  </button>
                </div>
                {isUsernameChecked && (
                  <p className={`text-xs mt-1 ${isUsernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isUsernameAvailable ? '✅ 사용 가능한 닉네임입니다' : '❌ 이미 사용 중인 닉네임입니다'}
                  </p>
                )}
              </div>
  
              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold mb-2">소개</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="자기소개를 입력하세요"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>
  
              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? '저장 중...' : '저장'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* 🆕 내가 쓴 글 화면 */}
      {activeTab === 'posts' && (
        <div className="max-w-lg mx-auto">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center">
              <button onClick={() => setActiveTab('main')} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold">내가 쓴 글</h1>
            </div>
          </div>
  
          {/* 내용 */}
          <div className="p-4 space-y-3">
            {myPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">작성한 게시물이 없습니다</p>
              </div>
            ) : (
              myPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      onClick={() => navigate(`/feed#post-${post.id}`)}
                      className="font-semibold text-gray-900 flex-1 cursor-pointer hover:text-teal-600 transition-colors"
                    >
                      {post.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' :
                        post.type === 'share' ? 'bg-purple-100 text-purple-700' :
                        post.type === 'job' ? 'bg-cyan-100 text-cyan-700' :
                        post.type === 'talk' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {post.category}
                      </span>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === post.id ? null : post.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {openMenuId === post.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(post)
                                setOpenMenuId(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>수정</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(post.id)
                                setOpenMenuId(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>삭제</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p 
                    onClick={() => navigate(`/feed#post-${post.id}`)}
                    className="text-sm text-gray-600 line-clamp-2 mb-2 cursor-pointer"
                  >
                    {post.content}
                  </p>
                  <div 
                    onClick={() => navigate(`/feed#post-${post.id}`)}
                    className="flex items-center space-x-4 text-xs text-gray-500 cursor-pointer"
                  >
                    <span>👍 {post.likes_count || 0}</span>
                    <span>💬 {post.comments_count || 0}</span>
                    <span className="ml-auto">{getTimeAgo(post.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
  
      {/* 🆕 내가 쓴 댓글 화면 */}
      {activeTab === 'comments' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center">
              <button onClick={() => setActiveTab('main')} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold">내가 쓴 댓글</h1>
            </div>
          </div>
  
          <div className="p-4 space-y-3">
            {myComments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">작성한 댓글이 없습니다</p>
              </div>
            ) : (
              myComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p 
                      onClick={() => navigate(`/feed#post-${comment.posts.id}`)}
                      className="text-xs text-gray-500 cursor-pointer hover:text-teal-600"
                    >
                      게시물: <span className="font-semibold text-gray-700">{comment.posts.title}</span>
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{getTimeAgo(comment.created_at)}</span>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {openCommentMenuId === comment.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditComment(comment)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>수정</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteComment(comment.id)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>삭제</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p 
                    onClick={() => navigate(`/feed#post-${comment.posts.id}`)}
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
  
      {/* 🆕 지원 내역 화면 */}
      {activeTab === 'applications' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center">
              <button onClick={() => setActiveTab('main')} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold">지원 내역</h1>
            </div>
          </div>
  
          {/* 서브탭 */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setApplicationSubTab('received')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  applicationSubTab === 'received'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600'
                }`}
              >
                받은 지원
              </button>
              <button
                onClick={() => setApplicationSubTab('sent')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  applicationSubTab === 'sent'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600'
                }`}
              >
                내가 지원한 내역
              </button>
            </div>
          </div>
  
          <div className="p-4">
            {applicationSubTab === 'received' && (
              <div className="space-y-3">
                {receivedApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">받은 지원이 없습니다</p>
                  </div>
                ) : (
                  receivedApplications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">게시물: {app.posts?.title}</p>
                          <p className="font-semibold text-gray-900">{app.profiles?.username || '사용자'}</p>
                        </div>
                        <span className="text-xs text-gray-400">{getTimeAgo(app.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
  
            {applicationSubTab === 'sent' && (
              <div className="space-y-3">
                {myApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">지원한 내역이 없습니다</p>
                  </div>
                ) : (
                  myApplications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/feed#post-${app.posts.id}`)}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-semibold text-gray-900">{app.posts.title}</p>
                        <span className="text-xs text-gray-400">{getTimeAgo(app.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
  
      {/* 🆕 교환 내역 화면 */}
      {activeTab === 'exchanges' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center">
              <button onClick={() => setActiveTab('main')} className="mr-3">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold">교환 내역</h1>
            </div>
          </div>
  
          <div className="p-4">
            {exchangesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
              </div>
            ) : myExchanges.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">교환 신청 내역이 없습니다</p>
                <button
                  onClick={() => navigate('/store')}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg"
                >
                  스토어 바로가기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myExchanges.map((exchange) => (
                  <div
                    key={exchange.id}
                    className={`p-4 bg-white border-2 rounded-xl hover:shadow-md transition-all ${getStatusColor(exchange.status)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {exchange.store_products?.image_url?.startsWith('http') ? (
                          <img 
                            src={exchange.store_products.image_url} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-3xl">{exchange.store_products?.image_url || '🎁'}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">
                            {exchange.store_products?.name || '삭제된 상품'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(exchange.status)}`}>
                            {getStatusLabel(exchange.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">포인트</p>
                            <p className="font-semibold text-gray-900">
                              {exchange.store_products?.price?.toLocaleString()}P
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">연락처</p>
                            <p className="font-semibold text-teal-600">{exchange.phone_number}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs">신청일시</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(exchange.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {exchange.status === 'pending' && (
                          <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 rounded-lg p-2">
                            ⏳ 관리자 확인 대기 중입니다
                          </div>
                        )}
                        {exchange.status === 'processing' && (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                            🔄 처리 중입니다. 곧 연락드리겠습니다!
                          </div>
                        )}
                        {exchange.status === 'completed' && (
                          <div className="mt-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
                            ✅ 교환이 완료되었습니다!
                          </div>
                        )}
                        {exchange.status === 'cancelled' && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                            ❌ 교환이 취소되었습니다
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🆕 게시물 수정 모달 (기존 코드 유지) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">게시물 수정</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingPost(null)
                  setSelectedImages([])
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 md:p-6 space-y-4">
              {/* 메인 카테고리 */}
              <div>
                <label className="block text-sm font-semibold mb-2">메인 카테고리</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({...editFormData, type: 'hotdeal', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.type === 'hotdeal' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    핫딜
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({...editFormData, type: 'share', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.type === 'share' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    쉐어
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({...editFormData, type: 'job', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.type === 'job' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    JOB
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({...editFormData, type: 'talk', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.type === 'talk' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    톡
                  </button>
                </div>
              </div>

              {/* 서브 카테고리 */}
              <div>
                <label className="block text-sm font-semibold mb-2">세부 카테고리 *</label>
                {editFormData.type === 'hotdeal' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '전단지'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '전단지' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>전단지</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '행사'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '행사' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>행사</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '기타'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '기타' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>기타</button>
                  </div>
                )}
                {editFormData.type === 'share' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '생활용품'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '생활용품' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>생활용품</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '부동산'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '부동산' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>부동산</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '기타'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '기타' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>기타</button>
                  </div>
                )}
                {editFormData.type === 'job' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '구인'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '구인' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>구인</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '구직'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '구직' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>구직</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: 'JOB썰'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === 'JOB썰' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>JOB썰</button>
                  </div>
                )}
                {editFormData.type === 'talk' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '수다'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '수다' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>수다</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '토닥'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '토닥' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>토닥</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: 'Q&A'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === 'Q&A' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>Q&A</button>
                    <button type="button" onClick={() => setEditFormData({...editFormData, category: '꿀팁'})} className={`px-4 py-2 rounded-lg text-sm font-medium ${editFormData.category === '꿀팁' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>꿀팁</button>
                  </div>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold mb-2">제목 *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-semibold mb-2">내용 *</label>
                <textarea
                  required
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="file"
                    id="edit-image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-image-upload"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">이미지</span>
                  </label>
                </div>
              </div>

              {/* 이미지 미리보기 */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 추가 필드 */}
              {editFormData.type === 'hotdeal' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">할인율</label>
                    <input type="text" value={editFormData.discount} onChange={(e) => setEditFormData({...editFormData, discount: e.target.value})} placeholder="예: 50%" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">가격</label>
                    <input type="text" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} placeholder="예: 9,900원" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                </div>
              )}
              {editFormData.type === 'job' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">시급</label>
                    <input type="text" value={editFormData.hourlyPay} onChange={(e) => setEditFormData({...editFormData, hourlyPay: e.target.value})} placeholder="예: 15,000원" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">기간</label>
                    <input type="text" value={editFormData.period} onChange={(e) => setEditFormData({...editFormData, period: e.target.value})} placeholder="예: 1-2주" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  </div>
                </div>
              )}

              {/* 위치 */}
              <div>
                <label className="block text-sm font-semibold mb-2">위치</label>
                <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} placeholder="예: 강남구" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-semibold mb-2">태그</label>
                <input type="text" value={editFormData.tags} onChange={(e) => setEditFormData({...editFormData, tags: e.target.value})} placeholder="쉼표로 구분" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingPost(null)
                    setSelectedImages([])
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50"
                >
                  {loading ? '수정 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 댓글 수정 모달 */}
      {isEditCommentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">댓글 수정</h2>
              <button 
                onClick={() => {
                  setIsEditCommentModalOpen(false)
                  setEditingComment(null)
                  setEditCommentContent('')
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCommentSubmit} className="p-4 md:p-6 space-y-4">
              {/* 원본 게시물 정보 */}
              {editingComment && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  게시물: <span className="font-semibold text-gray-700">{editingComment.posts?.title}</span>
                </div>
              )}

              {/* 댓글 내용 */}
              <div>
                <label className="block text-sm font-semibold mb-2">댓글 내용 *</label>
                <textarea
                  required
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  rows="4"
                  placeholder="댓글 내용을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCommentModalOpen(false)
                    setEditingComment(null)
                    setEditCommentContent('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading || !editCommentContent.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50"
                >
                  {loading ? '수정 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}