import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, Search, Bell, User, Plus, 
  Flame, ThumbsUp, MessageCircle, Bookmark,
  Clock, MapPin, DollarSign, Tag, X, Image as ImageIcon, Link as LinkIcon,
  Home, Briefcase, Menu, MoreVertical, Edit2, Trash2, Shield, Smartphone,
  ChevronUp, ChevronDown, Target, Gift, ChevronLeft, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// 🆕 배터리 아이콘 컴포넌트 (동그라미 배경 + 세로 배터리)
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
          <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="17%" stopColor="#ff8000" />
            <stop offset="33%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="67%" stopColor="#0080ff" />
            <stop offset="83%" stopColor="#8000ff" />
            <stop offset="100%" stopColor="#ff0080" />
          </linearGradient>
          <linearGradient id="rainbowBorder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="100%" stopColor="#0000ff" />
          </linearGradient>
        </defs>
        {/* 외곽 원형 테두리 (무지개) */}
        <circle cx="20" cy="20" r="19" stroke="url(#rainbowBorder)" strokeWidth="2" fill="none" />
        {/* 배경 원 */}
        <circle cx="20" cy="20" r="17.5" fill="#fefefe" />
        
        {/* 배터리 본체 외곽 (세로) */}
        <rect x="13" y="12" width="14" height="20" rx="2" stroke="url(#rainbowGradient)" strokeWidth="2" fill="none" />
        {/* 배터리 단자 (위쪽) */}
        <rect x="16" y="8" width="8" height="4" rx="1" fill="url(#rainbowGradient)" />
        
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

export default function Feed() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('all')
  const [activeMainTab, setActiveMainTab] = useState('home')
  const [expandedMenus, setExpandedMenus] = useState({ home: true, talk: false, notice: false, hotdeal: false, job: false })
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [openMenuId, setOpenMenuId] = useState(null)
  const [posts, setPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  // 🆕 대댓글용 state
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [showComments, setShowComments] = useState(null)
  const [expandedPosts, setExpandedPosts] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // 🆕 이미지 갤러리용 state
  const [galleryImages, setGalleryImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  
  const [imageZoom, setImageZoom] = useState(100)
  const [topPosts, setTopPosts] = useState({ byComments: [], byLikes: [] })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const POSTS_PER_PAGE = 20
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isInApp, setIsInApp] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isSimpleModal, setIsSimpleModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingPostId, setReportingPostId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applyingPostId, setApplyingPostId] = useState(null)
  const [showPostPointModal, setShowPostPointModal] = useState(false)
const [postEarnedPoints, setPostEarnedPoints] = useState(0)
  const [showBusinessInfo, setShowBusinessInfo] = useState(false)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [latestPostId, setLatestPostId] = useState(null)
  const [newPost, setNewPost] = useState({
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

 // 🆕 이미지 갤러리 키보드 + 안드로이드 뒤로가기 이벤트
useEffect(() => {
  if (!showGallery) return

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeGallery()
    } else if (e.key === 'ArrowLeft') {
      setCurrentImageIndex(prev => 
        prev > 0 ? prev - 1 : galleryImages.length - 1
      )
    } else if (e.key === 'ArrowRight') {
      setCurrentImageIndex(prev => 
        prev < galleryImages.length - 1 ? prev + 1 : 0
      )
    }
  }

  // 🆕 안드로이드 뒤로가기 버튼 처리
  const handlePopState = (e) => {
    if (showGallery) {
      e.preventDefault()
      closeGallery()
    }
  }

  // 🆕 갤러리 열릴 때 히스토리에 상태 추가
  window.history.pushState({ gallery: true }, '')

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('popstate', handlePopState)
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('popstate', handlePopState)
  }
}, [showGallery, galleryImages.length])

  // 인앱 브라우저 감지 & PWA 설치 프롬프트 감지
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const isKakao = /KAKAOTALK/i.test(ua)
    const isLine = /Line/i.test(ua)
    const isInsta = /Instagram/i.test(ua)
    const isFB = /FBAN|FBAV/i.test(ua)
    
    const inApp = isKakao || isLine || isInsta || isFB
    setIsInApp(inApp)

    const urlParams = new URLSearchParams(window.location.search)
    const shouldInstall = urlParams.get('install') === 'true'
    
    if (shouldInstall && !inApp) {
      setShowInstallModal(true)
      setIsSimpleModal(true)
      window.history.replaceState({}, '', window.location.pathname)
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log('✅ PWA 설치 가능!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    if (!user) {
      if (inApp) {
        fetchPosts(0, '', true)
        fetchTopPosts()
        setHasMore(false)
      } else {
        fetchPosts(0, '', true)
        fetchTopPosts()
        setHasMore(false)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [navigate, user])

  useEffect(() => {
    if (user) {
      setHasMore(true)
      setPosts([])
      setPage(0)
      fetchPosts(0, '', true)
      checkLikes()
      fetchTopPosts()
    }
  }, [user])

  // 30초마다 새 게시물 체크 (로그인 사용자만)
  useEffect(() => {
    if (!user) return
    
    const initLatestId = async () => {
      const { data } = await supabase
        .from('posts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) {
        setLatestPostId(data.id)
      }
    }
    
    initLatestId()
    
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('posts')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (data && latestPostId && data.id !== latestPostId) {
          console.log('🔔 새 게시물 감지!')
          setHasNewPosts(true)
        }
      } catch (error) {
        console.error('새 게시물 체크 실패:', error)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, latestPostId])

  useEffect(() => {
    if (!user || isInApp) return
    
    const handleScroll = () => {
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500
      
      if (bottom && !loading && hasMore) {
        console.log('📜 다음 페이지 로딩:', page)
        fetchPosts(page, searchQuery)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page, loading, hasMore, searchQuery, user, isInApp])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (user) return
    
    let hasTriggered = false
    
    const handleScrollBottom = () => {
      if (hasTriggered) return
      
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50
      
      if (bottom && posts.length >= 10) {
        hasTriggered = true
        
        if (isInApp) {
          setShowInstallModal(true)
        } else {
          navigate('/login')
        }
      }
    }
    
    window.addEventListener('scroll', handleScrollBottom)
    return () => window.removeEventListener('scroll', handleScrollBottom)
  }, [user, posts.length, isInApp, navigate])

  const loadNewPosts = async () => {
    await fetchPosts(0, '', true)
    
    const { data } = await supabase
      .from('posts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (data) {
      setLatestPostId(data.id)
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setHasNewPosts(false)
  }

  const fetchTopPosts = async () => {
    try {
      const { data: commentData } = await supabase
        .from('posts')
        .select('id, title, type, comments_count:comments(count)')
        .order('created_at', { ascending: false })
      
      const postsWithCommentCount = await Promise.all(
        (commentData || []).map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          
          return { ...post, comments_count: count || 0 }
        })
      )
      
      const topByComments = postsWithCommentCount
        .sort((a, b) => b.comments_count - a.comments_count)
        .slice(0, 3)
      
      const postsWithLikeCount = await Promise.all(
        (commentData || []).map(async (post) => {
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          
          return { ...post, likes_count: count || 0 }
        })
      )
      
      const topByLikes = postsWithLikeCount
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 3)
      
      setTopPosts({
        byComments: topByComments,
        byLikes: topByLikes
      })
    } catch (error) {
      console.error('인기 게시물 로드 실패:', error)
    }
  }

  const fetchPosts = async (pageNum = 0, search = '', reset = false, typeFilter = '', categoryFilter = '') => {
    if (loading || (!hasMore && !reset)) return
    
    try {
      setLoading(true)
      
      const start = pageNum * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1
      
      // 1️⃣ 게시물 먼저 가져오기
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)
      
      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }
      
      if (search) {
        if (search.startsWith('#')) {
          const tag = search.substring(1)
          query = query.contains('tags', [tag])
        } else {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        if (pageNum === 0 || reset) {
          setPosts([])
        }
        setHasMore(false)
        setLoading(false)
        return
      }
      
      // 2️⃣ 작성자 ID 목록 추출
      const userIds = [...new Set(data.map(p => p.user_id))]
      
      // 3️⃣ 작성자 정보 한 번에 가져오기
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, role, consecutive_days')
        .in('id', userIds)
      
      // 4️⃣ 작성자 정보 매핑용 객체 생성
      const profilesMap = {}
      profilesData?.forEach(p => {
        profilesMap[p.id] = p
      })
      
      // 5️⃣ 게시물에 작성자 정보 합치기
      const postsWithData = data.map((post) => {
        const authorProfile = profilesMap[post.user_id] || {}
        return {
          ...post,
          author: authorProfile.username || '사용자',
          authorRole: authorProfile.role || '회원',
          authorConsecutiveDays: authorProfile.consecutive_days || 0,
          timeAgo: getTimeAgo(post.created_at),
          comments_count: post.comments_count || 0,
          likes_count: post.likes_count || 0
        }
      })
      
      if (pageNum === 0 || reset) {
        setPosts(postsWithData)
      } else {
        setPosts(prev => [...prev, ...postsWithData])
      }
      
      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
      
      setPage(pageNum + 1)
      setLoading(false)
    } catch (error) {
      console.error('에러 발생:', error)
      setLoading(false)
    }
  }

  const checkLikes = async () => {
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
      
      const liked = new Set(data?.map(like => like.post_id) || [])
      setLikedPosts(liked)
    } catch (error) {
      console.error('좋아요 확인 실패:', error)
    }
  }

  const formatNumber = (num) => {
    if (!num) return ''
    const number = num.toString().replace(/[^0-9]/g, '')
    return Number(number).toLocaleString()
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMs = now - postTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `약 ${diffMins}분 전`
    if (diffHours < 24) return `약 ${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true
    
    if (activeTab === 'hotdeal-jeonje') return post.type === 'hotdeal' && post.category === '전단지'
    if (activeTab === 'hotdeal-sale') return post.type === 'hotdeal' && post.category === '행사'
    if (activeTab === 'hotdeal-event') return post.type === 'hotdeal' && post.category === '기타'
    
    if (activeTab === 'share-living') return post.type === 'share' && post.category === '생활용품'
    if (activeTab === 'share-realestate') return post.type === 'share' && post.category === '부동산'
    if (activeTab === 'share-etc') return post.type === 'share' && post.category === '기타'
    
    if (activeTab === 'job-hire') return post.type === 'job' && post.category === '구인'
    if (activeTab === 'job-tip') return post.type === 'job' && post.category === '일자리제보'
    if (activeTab === 'job-seek') return post.type === 'job' && post.category === '구직'
    
    if (activeTab === 'talk-all') return post.type === 'talk'
    if (activeTab === 'talk-chat') return post.type === 'talk' && post.category === '수다'
    if (activeTab === 'talk-comfort') return post.type === 'talk' && post.category === '토닥'
    if (activeTab === 'talk-qna') return post.type === 'talk' && post.category === 'Q&A'
    if (activeTab === 'talk-tips') return post.type === 'talk' && post.category === '꿀팁'
    
    if (activeTab === 'notice-all') return post.type === 'notice'
    if (activeTab === 'notice-announcement') return post.type === 'notice' && post.category === '공지'
    if (activeTab === 'notice-event') return post.type === 'notice' && post.category === '이벤트'
    
    return true
  })
  
  const noticePosts = filteredPosts.filter(post => post.type === 'notice')
  const regularPosts = filteredPosts.filter(post => post.type !== 'notice')
  const sortedPosts = [...noticePosts, ...regularPosts]

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

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }
  
    try {
      setLoading(true)
      
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            type: newPost.type,
            category: newPost.category,
            title: newPost.title,
            content: newPost.content,
            tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            discount: newPost.discount || null,
            price: newPost.price || null,
            hourly_pay: newPost.hourlyPay || null,
            location: newPost.location || null,
            period: newPost.period || null,
            images: selectedImages.length > 0 ? selectedImages : null
          })
          .eq('id', editingPost.id)
        
        if (error) throw error
        alert('수정되었습니다!')
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([
            {
              user_id: user.id,
              type: newPost.type,
              category: newPost.category,
              title: newPost.title,
              content: newPost.content,
              tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
              discount: newPost.discount || null,
              price: newPost.price || null,
              hourly_pay: newPost.hourlyPay || null,
              location: newPost.location || null,
              period: newPost.period || null,
              images: selectedImages.length > 0 ? selectedImages : null
            }
          ])
        
        if (error) throw error
        
        // 🆕 핫딜 글 작성 시 랜덤 포인트 지급 (7~47P)
        if (newPost.type === 'hotdeal') {
          const randomPoints = Math.floor(Math.random() * 41) + 7  // 7~47
          
          // 포인트 지급
          const { error: pointError } = await supabase
            .from('profiles')
            .update({ points: (profile?.points || 0) + randomPoints })
            .eq('id', user.id)
          
          if (!pointError) {
            setPostEarnedPoints(randomPoints)
            setShowPostPointModal(true)
          }
        } else {
          alert('게시물이 작성되었습니다!')
        }
      }
      
      setIsWriteModalOpen(false)
      setEditingPost(null)
      setSelectedImages([])
      setNewPost({
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
      
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, searchQuery, true)
      fetchTopPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (postId) => {
    if (!window.confirm('게시물을 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      
      alert('삭제되었습니다!')
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, searchQuery, true)
      fetchTopPosts()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  const handleEdit = (post) => {
    setEditingPost(post)
    setNewPost({
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
    setIsWriteModalOpen(true)
  }

  const handleActionClick = (action) => {
    if (isInApp) {
      setShowInstallModal(true)
      return
    }

    if (!user) {
      navigate('/login')
      return
    }

    action()
  }

  const handleLike = async (postId) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
  
    const isLiked = likedPosts.has(postId)
  
    try {
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1
            }
          }
          return p
        })
      )
  
      if (isLiked) {
        setLikedPosts(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
      } else {
        setLikedPosts(prev => new Set(prev).add(postId))
        
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: postId }])
      }
  
      fetchTopPosts()
    } catch (error) {
      console.error('좋아요 실패:', error)
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, searchQuery, true)
      checkLikes()
    }
  }

  const fetchComments = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('username, role, consecutive_days')
            .eq('id', comment.user_id)
            .single()

          return {
            ...comment,
            author: authorData?.username || '사용자',
            authorRole: authorData?.role || '회원',
            authorConsecutiveDays: authorData?.consecutive_days || 0,
            timeAgo: getTimeAgo(comment.created_at)
          }
        })
      )
      
      // 🆕 댓글을 계층 구조로 정리 (부모 댓글 + 대댓글)
      const parentComments = commentsWithAuthors.filter(c => !c.parent_id)
      const childComments = commentsWithAuthors.filter(c => c.parent_id)
      
      // 부모 댓글에 대댓글 연결
      const structuredComments = parentComments.map(parent => ({
        ...parent,
        replies: childComments.filter(child => child.parent_id === parent.id)
      }))
      
      setComments(prev => ({
        ...prev,
        [postId]: structuredComments
      }))
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    }
  }

  const handleAddComment = async (postId, parentId = null) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    // 🆕 대댓글인 경우 replyContent 사용, 아니면 newComment 사용
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return
  
    try {
      const tempComment = {
        id: 'temp-' + Date.now(),
        content: content.trim(),
        user_id: user.id,
        post_id: postId,
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        author: profile?.username || '사용자',
        authorRole: profile?.role || '회원',
        authorConsecutiveDays: profile?.consecutive_days || 0,
        timeAgo: '방금 전'
      }
  
      // 🆕 대댓글인 경우 부모 댓글의 replies에 추가
      if (parentId) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), tempComment]
              }
            }
            return comment
          })
        }))
      } else {
        // 일반 댓글인 경우
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), { ...tempComment, replies: [] }]
        }))
      }
  
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments_count: p.comments_count + 1
            }
          }
          return p
        })
      )
  
      // 🆕 대댓글이면 replyContent 초기화, 아니면 newComment 초기화
      if (parentId) {
        setReplyContent('')
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
  
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          user_id: user.id,
          post_id: postId,
          content: content.trim(),
          parent_id: parentId || null
        }])
        .select()
        .single()
  
      if (error) throw error
  
      // 🆕 실제 데이터로 업데이트
      if (parentId) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: comment.replies.map(r => 
                  r.id === tempComment.id ? { ...tempComment, id: data.id } : r
                )
              }
            }
            return comment
          })
        }))
      } else {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => 
            c.id === tempComment.id ? { ...tempComment, id: data.id, replies: [] } : c
          )
        }))
      }
  
      fetchTopPosts()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      fetchComments(postId)
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, searchQuery, true)
    }
  }

  const handleEditComment = async (commentId, postId) => {
    if (!editCommentText.trim()) return
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
  
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editCommentText.trim() })
        .eq('id', commentId)
  
      if (error) throw error
  
      // 🆕 UI 즉시 업데이트 (부모 댓글 + 대댓글 모두 처리)
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.map(c => {
          // 부모 댓글인 경우
          if (c.id === commentId) {
            return { ...c, content: editCommentText.trim() }
          }
          // 대댓글인 경우 replies 배열에서 찾기
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId ? { ...r, content: editCommentText.trim() } : r
              )
            }
          }
          return c
        })
      }))
  
      setEditingComment(null)
      setEditCommentText('')
      
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      alert('댓글 수정 실패: ' + error.message)
    }
  }
  
  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
  
    try {
      // 🆕 UI 즉시 업데이트 (부모 댓글 + 대댓글 모두 처리)
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId]
          .filter(c => c.id !== commentId)  // 부모 댓글 삭제
          .map(c => ({
            ...c,
            replies: c.replies ? c.replies.filter(r => r.id !== commentId) : []  // 대댓글 삭제
          }))
      }))
  
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments_count: Math.max(0, p.comments_count - 1)
            }
          }
          return p
        })
      )
  
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
  
      if (error) throw error
  
      fetchTopPosts()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('댓글 삭제 실패: ' + error.message)
      fetchComments(postId)
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, searchQuery, true)
    }
  }

  const handleReport = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!reportReason) {
      alert('신고 사유를 선택해주세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          post_id: reportingPostId,
          user_id: user.id,
          reason: reportReason
        }])

      if (error) throw error

      alert('신고가 접수되었습니다.')
      setShowReportModal(false)
      setReportingPostId(null)
      setReportReason('')
    } catch (error) {
      console.error('신고 실패:', error)
      alert('신고 실패: ' + error.message)
    }
  }

  const handleApply = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!applicationMessage.trim()) {
      alert('지원 메시지를 입력해주세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert([{
          post_id: applyingPostId,
          user_id: user.id,
          message: applicationMessage.trim()
        }])

      if (error) throw error

      alert('지원이 완료되었습니다!')
      setShowApplicationModal(false)
      setApplyingPostId(null)
      setApplicationMessage('')
    } catch (error) {
      console.error('지원 실패:', error)
      alert('지원 실패: ' + error.message)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    setPosts([])
    setPage(0)
    setHasMore(true)
    fetchPosts(0, value, true)
  }

  // 🆕 이미지 갤러리 열기
const openGallery = (images, startIndex) => {
  setGalleryImages(images)
  setCurrentImageIndex(startIndex)
  setShowGallery(true)
  setImageZoom(100)
}

// 🆕 이미지 갤러리 닫기
const closeGallery = () => {
  setShowGallery(false)
  setGalleryImages([])
  setCurrentImageIndex(0)
  setImageZoom(100)
}

  // 🆕 이전/다음 이미지
  const goToPrevImage = () => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : galleryImages.length - 1
    )
    setImageZoom(100)
  }

  const goToNextImage = () => {
    setCurrentImageIndex(prev => 
      prev < galleryImages.length - 1 ? prev + 1 : 0
    )
    setImageZoom(100)
  }

  return (
    <div className="min-h-screen pb-24 md:pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
            <button 
  onClick={() => {
    // feed 페이지로 완전 새로고침
    window.location.href = '/feed'
  }}
  className="flex items-center space-x-2"
>
  <img src="/logo.png" alt="UDT79" className="w-8 h-8 object-contain" />
  <span className="text-lg font-bold gradient-text">UDT79</span>
</button>
              <span className="hidden md:block text-sm text-gray-600">우리동네 특공대 친구</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="검색..."
                  className="w-32 md:w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
  <button
    onClick={() => {
      setSearchQuery('')
      setPosts([])
      setPage(0)
      setHasMore(true)
      fetchPosts(0, '', true)
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  >
    <X className="w-3.5 h-3.5" />
  </button>
)}
              </div>
              
              <button 
                onClick={() => {
                  setActiveMainTab('notice')
                  setActiveTab('notice-all')
                  setExpandedMenus({...expandedMenus, notice: true})
                }}
                className="flex items-center space-x-1 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-colors shadow-sm"
              >
                <Bell className="w-3 h-3" />
                <span>공지</span>
              </button>
              
              <button 
  onClick={() => navigate('/profile')}
  className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
>
  <BatteryIcon 
    level={getUserLevel(profile?.consecutive_days || 0)} 
    size={24} 
    isAdmin={profile?.role === '관리자'}
  />
  <span className="text-xs font-medium text-gray-700">
    {profile?.username || (user?.email?.split('@')[0]) || '사용자'}
  </span>
</button>

              {profile?.role === '관리자' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-semibold">관리자</span>
                </button>
              )}

              <button 
                onClick={() => handleActionClick(() => setIsWriteModalOpen(true))}
                className="hidden md:flex px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-semibold hover-lift shadow-md shadow-teal-500/30 items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>글쓰기</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 새 게시물 알림 바 */}
      {hasNewPosts && user && (
        <div 
          onClick={loadNewPosts}
          className="fixed top-14 left-0 right-0 z-40 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2.5 px-4 text-center cursor-pointer hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
        >
          <div className="flex items-center justify-center space-x-2">
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="text-sm font-medium">새 게시물이 있습니다. 클릭하여 확인하세요!</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 ${hasNewPosts && user ? 'pt-28' : 'pt-20'}`}>
        {/* PC 수평 탭 메뉴 */}
        <div className="hidden md:block mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-2 overflow-visible">
            <div className="flex items-center gap-2 justify-start">
              <button
                onClick={() => handleActionClick(() => { 
                  setActiveMainTab('home')
                  setActiveTab('all')
                  setPosts([])
                  setPage(0)
                  setHasMore(true)
                  fetchPosts(0, '', true)
                })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeMainTab === 'home' && activeTab === 'all'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                전체
              </button>

              <div className="relative">
                <button
                  onClick={() => setExpandedMenus({...expandedMenus, hotdeal: !expandedMenus.hotdeal, job: false, talk: false})}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 whitespace-nowrap ${
                    activeTab.startsWith('hotdeal')
                      ? 'bg-teal-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>핫딜</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.hotdeal ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedMenus.hotdeal && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('hotdeal-jeonje')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'hotdeal', '전단지')
                        setExpandedMenus({...expandedMenus, hotdeal: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      전단지
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('hotdeal-sale')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'hotdeal', '행사')
                        setExpandedMenus({...expandedMenus, hotdeal: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      행사
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('hotdeal-event')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'hotdeal', '기타')
                        setExpandedMenus({...expandedMenus, hotdeal: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      기타
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setExpandedMenus({...expandedMenus, job: !expandedMenus.job, hotdeal: false, talk: false})}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 whitespace-nowrap ${
                    activeTab.startsWith('job')
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>JOB</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.job ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedMenus.job && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('job-hire')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'job', '구인')
                        setExpandedMenus({...expandedMenus, job: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      구인
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('job-tip')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'job', '일자리제보')
                        setExpandedMenus({...expandedMenus, job: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      일자리제보
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('home')
                        setActiveTab('job-seek')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'job', '구직')
                        setExpandedMenus({...expandedMenus, job: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      구직
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setExpandedMenus({...expandedMenus, talk: !expandedMenus.talk, hotdeal: false, job: false})}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 whitespace-nowrap ${
                    activeTab.startsWith('talk')
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>톡</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.talk ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedMenus.talk && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('talk')
                        setActiveTab('talk-all')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'talk', '')
                        setExpandedMenus({...expandedMenus, talk: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      전체
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('talk')
                        setActiveTab('talk-chat')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'talk', '수다')
                        setExpandedMenus({...expandedMenus, talk: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      수다
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('talk')
                        setActiveTab('talk-comfort')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'talk', '토닥')
                        setExpandedMenus({...expandedMenus, talk: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      토닥
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('talk')
                        setActiveTab('talk-qna')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'talk', 'Q&A')
                        setExpandedMenus({...expandedMenus, talk: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Q&A
                    </button>
                    <button
                      onClick={() => handleActionClick(() => { 
                        setActiveMainTab('talk')
                        setActiveTab('talk-tips')
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true, 'talk', '꿀팁')
                        setExpandedMenus({...expandedMenus, talk: false})
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      꿀팁
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleActionClick(() => navigate('/challenge'))}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap text-gray-700 hover:bg-purple-100 hover:text-purple-600"
              >
                🎯 챌린지
              </button>

              <button
                onClick={() => handleActionClick(() => navigate('/store'))}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap text-gray-700 hover:bg-gray-100"
              >
                스토어
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Feed */}
          <main className="flex-1">
            {/* 모바일 탭 메뉴 */}
            <div className="md:hidden mb-4 bg-white border border-gray-200 rounded-xl p-3">
              {activeMainTab === 'home' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { 
                        setActiveTab('all')
                        setExpandedMenus({...expandedMenus, hotdeal: false, job: false})
                        setPosts([])
                        setPage(0)
                        setHasMore(true)
                        fetchPosts(0, '', true)
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      전체
                    </button>
                    
                    <button
                      onClick={() => setExpandedMenus({...expandedMenus, hotdeal: !expandedMenus.hotdeal, job: false, talk: false})}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        expandedMenus.hotdeal || activeTab.startsWith('hotdeal') ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      핫딜
                    </button>
                    
                    <button
                      onClick={() => setExpandedMenus({...expandedMenus, talk: !expandedMenus.talk, hotdeal: false, job: false})}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        expandedMenus.talk || activeTab.startsWith('talk') ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      톡
                    </button>
                    
                    <button
                      onClick={() => setExpandedMenus({...expandedMenus, job: !expandedMenus.job, hotdeal: false, talk: false})}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        expandedMenus.job || activeTab.startsWith('job') ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      JOB
                    </button>
                  </div>
                  
                  {expandedMenus.hotdeal && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setActiveTab('hotdeal-jeonje')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'hotdeal', '전단지')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-jeonje' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        전단지
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('hotdeal-sale')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'hotdeal', '행사')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-sale' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        행사
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('hotdeal-event')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'hotdeal', '기타')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-event' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        기타
                      </button>
                    </div>
                  )}

                  {expandedMenus.job && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setActiveTab('job-hire')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'job', '구인')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-hire' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        구인
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('job-tip')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'job', '일자리제보')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-tip' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        일자리제보
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('job-seek')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'job', '구직')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-seek' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        구직
                      </button>
                    </div>
                  )}

                  {expandedMenus.talk && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setActiveTab('talk-chat')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'talk', '수다')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'talk-chat' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        수다
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('talk-comfort')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'talk', '토닥')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'talk-comfort' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        토닥
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('talk-qa')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'talk', 'Q&A')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'talk-qa' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        Q&A
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveTab('talk-tip')
                          setPosts([])
                          setPage(0)
                          setHasMore(true)
                          fetchPosts(0, '', true, 'talk', '꿀팁')
                        }} 
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'talk-tip' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        꿀팁
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeMainTab === 'talk' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setActiveTab('talk-all')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'talk', '')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    전체
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('talk-chat')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'talk', '수다')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-chat' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    수다
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('talk-comfort')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'talk', '토닥')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-comfort' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    토닥
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('talk-qna')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'talk', 'Q&A')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-qna' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    Q&A
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('talk-tips')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'talk', '꿀팁')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-tips' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    꿀팁
                  </button>
                </div>
              )}

              {activeMainTab === 'notice' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setActiveTab('notice-all')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'notice', '')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    전체
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('notice-announcement')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'notice', '공지')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-announcement' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    공지
                  </button>
                  <button 
                    onClick={() => { 
                      setActiveTab('notice-event')
                      setPosts([])
                      setPage(0)
                      setHasMore(true)
                      fetchPosts(0, '', true, 'notice', '이벤트')
                    }} 
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-event' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}
                  >
                    이벤트
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {sortedPosts.length === 0 && !loading ? (
                <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
                  <p className="text-gray-500">게시물이 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-1">첫 번째 게시물을 작성해보세요!</p>
                </div>
              ) : (
                <>
                  {sortedPosts.map((post, index) => (
                   <article 
                   key={post.id}
                   id={`post-${post.id}`}
                   className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow animate-slide-up overflow-hidden"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2.5">
                          {/* 🆕 배터리 아이콘으로 변경 */}
                          <div className="w-8 h-8 flex items-center justify-center">
  <BatteryIcon 
    level={getUserLevel(post.authorConsecutiveDays || 0)} 
    size={32} 
    isAdmin={post.authorRole === '관리자'}
  />
</div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-sm text-gray-900">{post.author}</span>
                              {post.type === 'notice' && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full flex items-center space-x-0.5">
                                  <span>📌</span>
                                  <span>공지</span>
                                </span>
                              )}
                              {post.hot && (
                                <span className="px-1.5 py-0.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center space-x-0.5">
                                  <Flame className="w-2.5 h-2.5" />
                                  <span>HOT</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{post.authorRole} · {post.timeAgo}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            post.type === 'hotdeal' 
                              ? 'bg-teal-100 text-teal-700' 
                              : post.type === 'share'
                              ? 'bg-purple-100 text-purple-700'
                              : post.type === 'job'
                              ? 'bg-cyan-100 text-cyan-700'
                              : post.type === 'talk'
                              ? 'bg-orange-100 text-orange-700'
                              : post.type === 'notice'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {post.category}
                          </span>
                          
                          {user && post.user_id === user.id && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {openMenuId === post.id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                  <button
                                    onClick={() => {
                                      handleEdit(post)
                                      setOpenMenuId(null)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>수정</span>
                                  </button>
                                  <button
                                    onClick={() => {
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
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-3">
                        <h2 className="text-base font-bold mb-1 text-gray-900 hover:text-teal-600 cursor-pointer transition-colors">
                          {post.title}
                        </h2>
                        <p className={`text-sm text-gray-600 ${expandedPosts.has(post.id) ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}>
                          {post.content}
                        </p>
                        {post.content.length > 100 && (
                          <button
                            onClick={() => handleActionClick(() => {
                              setExpandedPosts(prev => {
                                const newSet = new Set(prev)
                                if (newSet.has(post.id)) {
                                  newSet.delete(post.id)
                                } else {
                                  newSet.add(post.id)
                                }
                                return newSet
                              })
                            })}
                            className="text-xs text-teal-600 hover:underline mt-1"
                          >
                            {expandedPosts.has(post.id) ? '접기' : '더보기'}
                          </button>
                        )}
                      </div>

                      {/* 🆕 Images - 갤러리로 열기 */}
                      {post.images && post.images.length > 0 && (
  <div className={`mb-3 grid gap-2 overflow-hidden ${
    post.images.length === 1 ? 'grid-cols-1' : 
    post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
  }`}>
                          {post.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={img} 
                                alt="" 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                onClick={() => handleActionClick(() => openGallery(post.images, i))}
                              />
                              {i === 3 && post.images.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">+{post.images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.type === 'job' && post.category === '구인' && (
                          <button
                            onClick={() => handleActionClick(() => {
                              setApplyingPostId(post.id)
                              setShowApplicationModal(true)
                            })}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-50 rounded-md text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>지원하기</span>
                          </button>
                        )}
                        {post.discount && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-teal-50 rounded-md text-teal-700 text-xs font-semibold border border-teal-200">
                            <Tag className="w-3 h-3" />
                            <span>{post.discount} 행사</span>
                          </div>
                        )}
                        {post.price && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 rounded-md text-emerald-700 text-xs font-semibold border border-emerald-200">
                            <DollarSign className="w-3 h-3" />
                            <span>{post.price}</span>
                          </div>
                        )}
                        {post.hourly_pay && (
                          <div className="px-2 py-1 bg-cyan-50 rounded-md text-cyan-700 text-xs font-semibold border border-cyan-200">
                            <span>시급 {formatNumber(post.hourly_pay)}원</span>
                          </div>
                        )}
                        {post.period && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-sky-50 rounded-md text-sky-700 text-xs font-semibold border border-sky-200">
                            <Clock className="w-3 h-3" />
                            <span>{post.period}</span>
                          </div>
                        )}
                        {post.location && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-md text-gray-700 text-xs border border-gray-200">
                            <MapPin className="w-3 h-3" />
                            <span>{post.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.map((tag, i) => (
                            <span 
                              key={i}
                              onClick={() => {
                                setSearchQuery(`#${tag}`)
                                fetchPosts(`#${tag}`)
                              }}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-5 text-gray-500">
                        <button 
                          onClick={() => handleActionClick(() => handleLike(post.id))}
                          className={`flex items-center space-x-1.5 transition-colors ${
                            likedPosts.has(post.id) ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs font-medium">{post.likes_count || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleActionClick(() => {
                            if (showComments === post.id) {
                              setShowComments(null)
                            } else {
                              setShowComments(post.id)
                              fetchComments(post.id)
                            }
                          })}
                          className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.comments_count || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleActionClick(() => {
                            setReportingPostId(post.id)
                            setShowReportModal(true)
                          })}
                          className="flex items-center space-x-1.5 hover:text-red-600 transition-colors ml-auto text-gray-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-xs font-medium">신고</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments === post.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3 mb-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id}>
                                {/* 부모 댓글 */}
                                <div className="flex space-x-2">
                                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                    <BatteryIcon 
                                      level={getUserLevel(comment.authorConsecutiveDays || 0)} 
                                      size={24} 
                                      isAdmin={comment.authorRole === '관리자'}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    {editingComment === comment.id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editCommentText}
                                          onChange={(e) => setEditCommentText(e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                                          rows="2"
                                          autoFocus
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleEditComment(comment.id, post.id)}
                                            className="px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors"
                                          >
                                            수정 완료
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingComment(null)
                                              setEditCommentText('')
                                            }}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                          >
                                            취소
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                                          <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-xs font-semibold text-gray-900">{comment.author}</p>
                                            <div className="flex items-center space-x-2">
                                              <p className="text-[10px] text-gray-400">{comment.timeAgo}</p>
                                              {user && comment.user_id === user.id && (
                                                <div className="flex items-center space-x-1">
                                                  <button
                                                    onClick={() => {
                                                      setEditingComment(comment.id)
                                                      setEditCommentText(comment.content)
                                                    }}
                                                    className="text-gray-500 hover:text-teal-600 transition-colors"
                                                  >
                                                    <Edit2 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                        {/* 🆕 답글 버튼 */}
                                        <button
                                          onClick={() => handleActionClick(() => {
                                            setReplyingTo(replyingTo === comment.id ? null : comment.id)
                                            setReplyContent('')
                                          })}
                                          className="mt-1 text-xs text-gray-500 hover:text-teal-600 transition-colors"
                                        >
                                          답글 달기
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 🆕 대댓글 목록 */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex space-x-2">
                                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                          <BatteryIcon 
                                            level={getUserLevel(reply.authorConsecutiveDays || 0)} 
                                            size={20} 
                                            isAdmin={reply.authorRole === '관리자'}
                                          />
                                        </div>
                                        <div className="flex-1">
                                          {editingComment === reply.id ? (
                                            <div className="space-y-2">
                                              <textarea
                                                value={editCommentText}
                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                                                rows="2"
                                                autoFocus
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => handleEditComment(reply.id, post.id)}
                                                  className="px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors"
                                                >
                                                  수정 완료
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingComment(null)
                                                    setEditCommentText('')
                                                  }}
                                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                  취소
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                              <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-xs font-semibold text-gray-900">{reply.author}</p>
                                                <div className="flex items-center space-x-2">
                                                  <p className="text-[10px] text-gray-400">{reply.timeAgo}</p>
                                                  {user && reply.user_id === user.id && (
                                                    <div className="flex items-center space-x-1">
                                                      <button
                                                        onClick={() => {
                                                          setEditingComment(reply.id)
                                                          setEditCommentText(reply.content)
                                                        }}
                                                        className="text-gray-500 hover:text-teal-600 transition-colors"
                                                      >
                                                        <Edit2 className="w-3 h-3" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteComment(reply.id, post.id)}
                                                        className="text-gray-500 hover:text-red-600 transition-colors"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <p className="text-sm text-gray-700">{reply.content}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 🆕 대댓글 입력창 */}
                                {replyingTo === comment.id && (
                                  <div className="ml-8 mt-2 flex space-x-2">
                                    <input
                                      type="text"
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="답글을 입력하세요..."
                                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddComment(post.id, comment.id)
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleActionClick(() => handleAddComment(post.id, comment.id))}
                                      className="px-3 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors"
                                    >
                                      답글
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyContent('')
                                      }}
                                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                      취소
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* 새 댓글 입력 */}
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="댓글을 입력하세요..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id)
                                }
                              }}
                            />
                            <button
                              onClick={() => handleActionClick(() => handleAddComment(post.id))}
                              className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors"
                            >
                              작성
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                  
                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600 mt-2">게시물을 불러오는 중...</p>
                    </div>
                  )}
                  
                  {!hasMore && sortedPosts.length > 0 && (
                    <div className="text-center py-8">
                      {(!user || isInApp) ? (
                        <div className="max-w-md mx-auto bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-2xl p-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎯</span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {isInApp ? '더 많은 게시물을 보려면?' : '계속 보시겠어요?'}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-6">
                            {isInApp 
                              ? '앱을 설치하고 모든 게시물을 확인하세요!' 
                              : '로그인하고 무제한으로 게시물을 확인하세요!'}
                          </p>
                          
                          {isInApp ? (
                            <button
                              onClick={() => setShowInstallModal(true)}
                              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg flex items-center justify-center space-x-2"
                            >
                              <Smartphone className="w-5 h-5" />
                              <span>앱 설치하고 더 보기</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/login')}
                              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg flex items-center justify-center space-x-2"
                            >
                              <User className="w-5 h-5" />
                              <span>로그인하고 더 보기</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">✨ 마지막 게시물입니다</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* 맨 위로 가기 버튼 */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-24 md:bottom-8 right-4 md:right-6 z-40 w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
              aria-label="맨 위로 가기"
            >
              <svg 
                className="w-6 h-6 transition-transform group-hover:-translate-y-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 10l7-7m0 0l7 7m-7-7v18" 
                />
              </svg>
            </button>
          )}

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-64 space-y-3 sticky top-20 self-start">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-sm mb-3 text-gray-900">💬 댓글 HOT</h3>
              <div className="space-y-3">
                {topPosts.byComments.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">게시물이 없습니다</p>
                ) : (
                  topPosts.byComments.map((post, index) => (
                    <div 
                      key={post.id} 
                      className="border-l-2 border-teal-500 pl-2.5 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                      onClick={() => {
                        document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-teal-600">#{index + 1}</span>
                        <span className="text-[10px] text-gray-500">{post.comments_count}개</span>
                      </div>
                      <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">{post.title}</h4>
                      <p className="text-[10px] text-gray-500">
                        {post.type === 'hotdeal' && '핫딜'}
                        {post.type === 'share' && '쉐어'}
                        {post.type === 'job' && 'JOB'}
                        {post.type === 'talk' && '톡'}
                        {post.type === 'notice' && '공지'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-sm mb-3 text-gray-900">❤️ 좋아요 HOT</h3>
              <div className="space-y-3">
                {topPosts.byLikes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">게시물이 없습니다</p>
                ) : (
                  topPosts.byLikes.map((post, index) => (
                    <div 
                      key={post.id} 
                      className="border-l-2 border-cyan-500 pl-2.5 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                      onClick={() => {
                        document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-cyan-600">#{index + 1}</span>
                        <span className="text-[10px] text-gray-500">{post.likes_count}개</span>
                      </div>
                      <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">{post.title}</h4>
                      <p className="text-[10px] text-gray-500">
                        {post.type === 'hotdeal' && '핫딜'}
                        {post.type === 'share' && '쉐어'}
                        {post.type === 'job' && 'JOB'}
                        {post.type === 'talk' && '톡'}
                        {post.type === 'notice' && '공지'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => window.open('https://open.kakao.com/o/sNlIAtbi', '_blank')}
                  className="block w-full text-left text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  광고 문의
                </button>
                <button
                  onClick={() => window.open('https://open.kakao.com/o/sNlIAtbi', '_blank')}
                  className="block w-full text-left text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  협업 제안
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="block w-full text-left text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  이용약관
                </button>
                <button
                  onClick={() => navigate('/privacy')}
                  className="block w-full text-left text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  개인정보처리방침
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowBusinessInfo(!showBusinessInfo)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-teal-600 transition-colors"
                >
                  <span>UDT79 사업자 정보</span>
                  {showBusinessInfo ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {showBusinessInfo && (
                  <div className="mt-3 space-y-1 text-[10px] text-gray-600 leading-relaxed animate-slide-down">
                    <p>상호명: 별경</p>
                    <p>대표자: [유소현]</p>
                    <p>사업자등록번호: [798-63-00757]</p>
                    <p>통신판매업신고: [제0000-서울-00000호]</p>
                    <p>주소: [충청남도 천안시 동남구 풍세로801]</p>
                    <p>이메일: asd024@naver.com</p>
                     <p className="pt-2 text-gray-500">© 2025 UDT79</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => { 
              setActiveMainTab('home'); 
              setActiveTab('all'); 
              setExpandedMenus({...expandedMenus, home: true}) 
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
              activeMainTab === 'home' ? 'text-teal-600' : 'text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">홈</span>
          </button>

          <button 
            onClick={() => handleActionClick(() => navigate('/challenge'))}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600"
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium">챌린지</span>
          </button>

          <button 
            onClick={() => handleActionClick(() => setIsWriteModalOpen(true))}
            className="flex flex-col items-center justify-center flex-1 h-full -mt-8"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>

          <button 
            onClick={() => handleActionClick(() => navigate('/store'))}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600"
          >
            <Gift className="w-5 h-5" />
            <span className="text-[10px] font-medium">스토어</span>
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">MY</span>
          </button>
        </div>
      </nav>

      {/* Write Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">로그 작성하기</h2>
              <button 
                onClick={() => {
                  setIsWriteModalOpen(false)
                  setSelectedImages([])
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">메인 카테고리</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPost({...newPost, type: 'hotdeal', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === 'hotdeal' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    핫딜
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPost({...newPost, type: 'job', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === 'job' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    JOB
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPost({...newPost, type: 'talk', category: ''})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === 'talk' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    톡
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">세부 카테고리 *</label>
                
                {newPost.type === 'hotdeal' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '전단지'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '전단지' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      전단지
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '행사'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '행사' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      행사
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '기타'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '기타' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      기타
                    </button>
                  </div>
                )}
                
                {newPost.type === 'job' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '구인'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '구인' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      구인
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '일자리제보'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '일자리제보' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      일자리제보
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '구직'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '구직' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      구직
                    </button>
                  </div>
                )}

                {newPost.type === 'talk' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '수다'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '수다' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      수다
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '토닥'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '토닥' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      토닥
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: 'Q&A'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === 'Q&A' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Q&A
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPost({...newPost, category: '꿀팁'})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newPost.category === '꿀팁' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      꿀팁
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">제목 *</label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">내용 *</label>
                <textarea
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="내용을 입력하세요"
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                />
                
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-700">이미지</span>
                  </label>
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-xs text-gray-700">링크</span>
                  </button>
                </div>
              </div>

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

              {newPost.type === 'hotdeal' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">할인율</label>
                    <input
                      type="text"
                      value={newPost.discount}
                      onChange={(e) => setNewPost({...newPost, discount: e.target.value})}
                      placeholder="예: 50%"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">가격</label>
                    <input
                      type="text"
                      value={newPost.price}
                      onChange={(e) => setNewPost({...newPost, price: e.target.value})}
                      placeholder="예: 무료"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {newPost.type === 'job' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">시급</label>
                    <input
                      type="text"
                      value={newPost.hourlyPay}
                      onChange={(e) => setNewPost({...newPost, hourlyPay: e.target.value})}
                      placeholder="예: 15,000원"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">기간</label>
                    <input
                      type="text"
                      value={newPost.period}
                      onChange={(e) => setNewPost({...newPost, period: e.target.value})}
                      placeholder="예: 1-2주"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">위치</label>
                <input
                  type="text"
                  value={newPost.location}
                  onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                  placeholder="예: 강남구"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  태그 
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (게시물을 분류하고 검색하는데 사용됩니다)
                  </span>
                </label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  placeholder="쉼표로 구분 (예: 개발자툴, 제휴할인)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 태그를 클릭하면 같은 태그가 달린 게시물을 모아볼 수 있습니다
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsWriteModalOpen(false)
                    setSelectedImages([])
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '작성 중...' : '작성 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 Image Gallery Lightbox Modal */}
      {showGallery && (
       <div 
       className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden"
       onClick={() => {
         window.history.back()  // 🆕 히스토리 뒤로가기로 닫기
       }}
       onWheel={(e) => {
        // 모바일에서는 wheel 이벤트 무시
        if ('ontouchstart' in window) return
        e.preventDefault()
        const delta = e.deltaY > 0 ? -25 : 25
        setImageZoom(prev => Math.max(25, Math.min(400, prev + delta)))
      }}
        >
          
          {/* 닫기 버튼 */}
          <button
  onClick={(e) => {
    e.stopPropagation()
    window.history.back()
  }}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* 🆕 좌측 화살표 */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevImage()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all z-10 group"
            >
              <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* 🆕 우측 화살표 */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNextImage()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all z-10 group"
            >
              <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* 🆕 이미지 카운터 */}
          {galleryImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full z-10">
              <span className="text-white text-sm font-medium">
                {currentImageIndex + 1} / {galleryImages.length}
              </span>
            </div>
          )}
          
          {/* 하단 컨트롤 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full z-10">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setImageZoom(prev => Math.max(25, prev - 25))
              }}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white font-bold text-lg"
            >
              −
            </button>
            
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {imageZoom}%
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                setImageZoom(prev => Math.min(400, prev + 25))
              }}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white font-bold text-lg"
            >
              +
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                setImageZoom(100)
              }}
              className="ml-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white text-xs font-medium"
            >
              원본
            </button>
          </div>
          
          {/* 이미지 */}
          <div 
            className="relative w-full h-full flex items-center justify-center overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={galleryImages[currentImageIndex]} 
              alt="" 
              className="transition-transform duration-200 cursor-move"
              style={{
                transform: `scale(${imageZoom / 100})`,
                maxWidth: imageZoom === 100 ? '100%' : 'none',
                maxHeight: imageZoom === 100 ? '100%' : 'none'
              }}
              draggable="false"
            />
          </div>
        </div>
      )}

      {/* 앱 설치 모달 */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          {isSimpleModal ? (
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                UDT79
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                홈 화면에 추가하시겠습니까?
              </p>
              {deferredPrompt ? (
                <button
                  onClick={async () => {
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    
                    if (outcome === 'accepted') {
                      console.log('✅ PWA 설치 완료!')
                    }
                    
                    setDeferredPrompt(null)
                    setShowInstallModal(false)
                    setIsSimpleModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover-lift shadow-lg mb-2"
                >
                  홈 화면에 추가
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowInstallModal(false)
                    setIsSimpleModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover-lift shadow-lg mb-2"
                >
                  확인
                </button>
              )}
              <button
                onClick={() => {
                  setShowInstallModal(false)
                  setIsSimpleModal(false)
                }}
                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                나중에
              </button>
            </div>
          ) : (
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative">
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                앱처럼 편하게<br />사용하시겠습니까?
              </h1>
              
              <p className="text-gray-600 mb-8 text-center">
                홈 화면에 추가
              </p>

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

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-700 font-medium mb-2">📱 설치 방법:</p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. 우측 상단 ⋯ (더보기) 클릭</li>
                  <li>2. "크롬에서 열기" 선택</li>
                  <li>3. "홈 화면에 추가" 버튼 클릭</li>
                </ol>
              </div>

              {isInApp ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const intentUrl = `intent://${window.location.host}${window.location.pathname}?install=true#Intent;scheme=https;package=com.android.chrome;end;`
                      window.location.href = intentUrl
                    }}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg"
                  >
                    예
                  </button>
                  <button
                    onClick={() => setShowInstallModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    나중에
                  </button>
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={async () => {
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    
                    if (outcome === 'accepted') {
                      console.log('✅ PWA 설치 완료!')
                    }
                    
                    setDeferredPrompt(null)
                    setShowInstallModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg"
                >
                  홈 화면에 추가
                </button>
              ) : (
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover-lift shadow-lg"
                >
                  확인
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">게시물 신고</h2>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportingPostId(null)
                  setReportReason('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600 mb-4">신고 사유를 선택해주세요</p>
              
              <button
                onClick={() => setReportReason('스팸/광고')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  reportReason === '스팸/광고'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">스팸/광고</div>
                <div className="text-xs text-gray-500 mt-1">홍보성 게시물 또는 반복적인 게시물</div>
              </button>

              <button
                onClick={() => setReportReason('욕설/비방')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  reportReason === '욕설/비방'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">욕설/비방</div>
                <div className="text-xs text-gray-500 mt-1">욕설, 비하, 혐오 표현</div>
              </button>

              <button
                onClick={() => setReportReason('음란물')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  reportReason === '음란물'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">음란물</div>
                <div className="text-xs text-gray-500 mt-1">성적인 콘텐츠 또는 부적절한 이미지</div>
              </button>

              <button
                onClick={() => setReportReason('기타')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  reportReason === '기타'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">기타</div>
                <div className="text-xs text-gray-500 mt-1">기타 부적절한 콘텐츠</div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportingPostId(null)
                  setReportReason('')
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지원하기 모달 */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">지원하기</h2>
              <button
                onClick={() => {
                  setShowApplicationModal(false)
                  setApplyingPostId(null)
                  setApplicationMessage('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                사장님에게 하고 싶은 말
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="예) 저는 성실하고 약속을 잘 지켜요. 사장님과 함께 일하고 싶어요."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                rows="6"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 성실한 자세와 열정을 보여주세요!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApplicationModal(false)
                  setApplyingPostId(null)
                  setApplicationMessage('')
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                disabled={!applicationMessage.trim()}
                className="flex-1 px-4 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                지원하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🆕 글작성 포인트 모달 */}
{showPostPointModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🎉</span>
      </div>
      
      <h2 className="text-xl font-bold mb-2">글작성 완료!</h2>
      <p className="text-teal-600 text-3xl font-black mb-2">
        +{postEarnedPoints}P
      </p>
      <p className="text-gray-500 text-sm mb-6">
        핫딜 게시글 작성 보상으로<br />
        포인트를 획득했어요! 🎁
      </p>
      
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700">
          💡 핫딜 게시글을 작성하면<br />
          <span className="font-bold text-teal-600">최대 300P</span>를 랜덤으로 받을 수 있어요!
        </p>
      </div>
      
      <button
        onClick={() => setShowPostPointModal(false)}
        className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-lg hover-lift shadow-lg"
      >
        확인
      </button>
    </div>
  </div>
)}
    </div>
  )
}