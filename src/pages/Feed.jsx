import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, Search, Bell, User, Plus, 
  Flame, ThumbsUp, MessageCircle, Bookmark,
  Clock, MapPin, DollarSign, Tag, X, Image as ImageIcon, Link as LinkIcon,
  Home, Briefcase, Menu, MoreVertical, Edit2, Trash2, Shield
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Feed() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
const [activeMainTab, setActiveMainTab] = useState('home')
const [expandedMenus, setExpandedMenus] = useState({ home: true, talk: false, notice: false, hotdeal: false, share: false, job: false })
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
  const [showComments, setShowComments] = useState(null)
  const [expandedPosts, setExpandedPosts] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [username, setUsername] = useState('사용자') // 추가
  const [loading, setLoading] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState(null)
  const [imageZoom, setImageZoom] = useState(100) // 100 = 100%
  const [topPosts, setTopPosts] = useState({ byComments: [], byLikes: [] })
const [page, setPage] = useState(0)
const [hasMore, setHasMore] = useState(true)
const POSTS_PER_PAGE = 20
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

  useEffect(() => {
    if (user) {
      fetchPosts()
      checkLikes()
      fetchTopPosts()
    }
  }, [user])
  // 무한 스크롤 감지
useEffect(() => {
  const handleScroll = () => {
    // 맨 아래에서 500px 전에 미리 로드
    const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500
    
    if (bottom && !loading && hasMore) {
      console.log('📜 다음 페이지 로딩:', page)
      fetchPosts(page, searchQuery)
    }
  }
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [page, loading, hasMore, searchQuery])
  
  // 프로필 정보 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return
      
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (data?.username) {
        setUsername(data.username)
      }
    }
    
    fetchUserProfile()
  }, [user])
  const fetchTopPosts = async () => {
    try {
      // 댓글 많은 순 Top 3
      const { data: commentData } = await supabase
        .from('posts')
        .select('id, title, type, comments_count:comments(count)')
        .order('created_at', { ascending: false })
      
      // 댓글 수 계산해서 정렬
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
      
      // 좋아요 많은 순 Top 3
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

  const fetchPosts = async (pageNum = 0, search = '', reset = false) => {
    // 이미 로딩 중이거나, 더 이상 없으면 중단
    if (loading || (!hasMore && !reset)) return
    
    try {
      setLoading(true)
      
      // 페이지네이션 범위 계산
      const start = pageNum * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1
      
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)  // 👈 무한 스크롤 핵심!
      
      if (search) {
        // 태그 검색 (# 포함)
        if (search.startsWith('#')) {
          const tag = search.substring(1)
          query = query.contains('tags', [tag])
        } else {
          // 일반 검색
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
          
          // 작성자 정보 가져오기
          const { data: authorData } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', post.user_id)
            .single()
          
          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            author: authorData?.username || '사용자',
            authorRole: authorData?.role || '회원',
            timeAgo: getTimeAgo(post.created_at)
          }
        })
      )
      
      // 첫 페이지거나 리셋이면 교체, 아니면 추가
      if (pageNum === 0 || reset) {
        setPosts(postsWithCounts)
      } else {
        setPosts(prev => [...prev, ...postsWithCounts])
      }
      
      // 20개 미만이면 더 이상 없음
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

  // 숫자에 천 단위 콤마 추가
const formatNumber = (num) => {
  if (!num) return ''
  // 숫자만 추출
  const number = num.toString().replace(/[^0-9]/g, '')
  // 천 단위 콤마 추가
  return Number(number).toLocaleString()
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
    // 전체
    if (activeTab === 'all') return true
    
    // 핫딜
    if (activeTab === 'hotdeal-jeonje') return post.type === 'hotdeal' && post.category === '전단지'
    if (activeTab === 'hotdeal-sale') return post.type === 'hotdeal' && post.category === '할인'
    if (activeTab === 'hotdeal-event') return post.type === 'hotdeal' && post.category === '행사'
    
    // 쉐어
    if (activeTab === 'share-living') return post.type === 'share' && post.category === '생활용품'
    if (activeTab === 'share-realestate') return post.type === 'share' && post.category === '부동산'
    if (activeTab === 'share-etc') return post.type === 'share' && post.category === '기타'
    
    // JOB
    if (activeTab === 'job-hire') return post.type === 'job' && post.category === '구인'
    if (activeTab === 'job-seek') return post.type === 'job' && post.category === '구직'
    if (activeTab === 'job-story') return post.type === 'job' && post.category === 'JOB썰'
    
    // 톡
    if (activeTab === 'talk-all') return post.type === 'talk'
    if (activeTab === 'talk-chat') return post.type === 'talk' && post.category === '수다'
    if (activeTab === 'talk-comfort') return post.type === 'talk' && post.category === '토닥'
    if (activeTab === 'talk-qna') return post.type === 'talk' && post.category === 'Q&A'
    if (activeTab === 'talk-tips') return post.type === 'talk' && post.category === '꿀팁'
    
    // 공지
    if (activeTab === 'notice-all') return post.type === 'notice'
    if (activeTab === 'notice-announcement') return post.type === 'notice' && post.category === '공지'
    if (activeTab === 'notice-event') return post.type === 'notice' && post.category === '이벤트'
    
    return true
  })
  
  // 공지 게시물 상단 고정
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
        alert('게시물이 작성되었습니다!')
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

  const handleLike = async (postId) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    const isLiked = likedPosts.has(postId)

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        setLikedPosts(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      } else {
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: postId }])

        setLikedPosts(prev => new Set(prev).add(postId))
      }

      setPosts([])
setPage(0)
setHasMore(true)
fetchPosts(0, searchQuery, true)
fetchTopPosts()
    } catch (error) {
      console.error('좋아요 실패:', error)
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
      
      // 각 댓글의 작성자 정보 가져오기
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', comment.user_id)
            .single()
          
            return {
              ...comment,
              author: authorData?.username || '사용자',
              timeAgo: getTimeAgo(comment.created_at)
            }
        })
      )
      
      setComments(prev => ({
        ...prev,
        [postId]: commentsWithAuthors
      }))
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    }
  }

  const handleAddComment = async (postId) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          user_id: user.id,
          post_id: postId,
          content: newComment.trim()
        }])

      if (error) throw error

      setNewComment('')
      fetchComments(postId)
      setPosts([])
setPage(0)
setHasMore(true)
fetchPosts(0, searchQuery, true)
fetchTopPosts()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
    }
  }
  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return
  
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editCommentText.trim() })
        .eq('id', commentId)
  
      if (error) throw error
  
      setEditingComment(null)
      setEditCommentText('')
      
      // 해당 댓글이 속한 게시물 ID 찾기
      const comment = Object.values(comments).flat().find(c => c.id === commentId)
      if (comment) {
        fetchComments(comment.post_id)
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error)
      alert('댓글 수정 실패: ' + error.message)
    }
  }
  
  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
  
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
  
      if (error) throw error
  
      fetchComments(postId)
      setPosts([])
setPage(0)
setHasMore(true)
fetchPosts(0, searchQuery, true)
fetchTopPosts()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('댓글 삭제 실패: ' + error.message)
    }
  }
  // 검색
  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // 검색 시 리셋
    setPosts([])
    setPage(0)
    setHasMore(true)
    fetchPosts(0, value, true)
  }
  return (
    <div className="min-h-screen pb-24 md:pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">동네문화</span>
              </Link>
              <span className="hidden md:block text-sm text-gray-600">아끼고 나누는 우리 동네 문화</span>
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
              
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              </button>
              
              <button 
  onClick={() => navigate('/profile')}
  className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {profile?.username?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
             <span className="text-xs font-medium text-gray-700">{username}</span>
</button>

{/* 관리자 버튼 추가 */}
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
  onClick={() => setIsWriteModalOpen(true)}
                className="hidden md:flex px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-sm font-semibold hover-lift shadow-md shadow-teal-500/30 items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>글쓰기</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-20">
        <div className="flex gap-5">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-56">
  <div className="bg-white border border-gray-200 rounded-xl p-3 sticky top-20">
    <nav className="space-y-1">
      {/* 홈 */}
      <div>
        <button
          onClick={() => setExpandedMenus({...expandedMenus, home: !expandedMenus.home})}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Home className="w-4 h-4" />
            <span>홈</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${expandedMenus.home ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedMenus.home && (
          <div className="ml-3 mt-1 space-y-1">
            {/* 전체 */}
            <button
              onClick={() => { setActiveMainTab('home'); setActiveTab('all') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'home' && activeTab === 'all'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              전체
            </button>

            {/* 핫딜 */}
            <div>
              <button
                onClick={() => setExpandedMenus({...expandedMenus, hotdeal: !expandedMenus.hotdeal})}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>핫딜</span>
                <svg 
                  className={`w-3 h-3 transition-transform ${expandedMenus.hotdeal ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedMenus.hotdeal && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('hotdeal-jeonje') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'hotdeal-jeonje'
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    전단지
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('hotdeal-sale') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'hotdeal-sale'
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    할인
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('hotdeal-event') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'hotdeal-event'
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    행사
                  </button>
                </div>
              )}
            </div>

            {/* 쉐어 */}
            <div>
              <button
                onClick={() => setExpandedMenus({...expandedMenus, share: !expandedMenus.share})}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>쉐어</span>
                <svg 
                  className={`w-3 h-3 transition-transform ${expandedMenus.share ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedMenus.share && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('share-living') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'share-living'
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    생활용품
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('share-realestate') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'share-realestate'
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    부동산
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('share-etc') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'share-etc'
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    기타
                  </button>
                </div>
              )}
            </div>

            {/* JOB */}
            <div>
              <button
                onClick={() => setExpandedMenus({...expandedMenus, job: !expandedMenus.job})}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>JOB</span>
                <svg 
                  className={`w-3 h-3 transition-transform ${expandedMenus.job ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedMenus.job && (
                <div className="ml-3 mt-1 space-y-1">
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('job-hire') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'job-hire'
                        ? 'bg-cyan-50 text-cyan-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    구인
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('job-seek') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'job-seek'
                        ? 'bg-cyan-50 text-cyan-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    구직
                  </button>
                  <button
                    onClick={() => { setActiveMainTab('home'); setActiveTab('job-story') }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors ${
                      activeTab === 'job-story'
                        ? 'bg-cyan-50 text-cyan-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    JOB썰
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 톡 */}
      <div>
        <button
          onClick={() => setExpandedMenus({...expandedMenus, talk: !expandedMenus.talk})}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>톡</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${expandedMenus.talk ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedMenus.talk && (
          <div className="ml-3 mt-1 space-y-1">
            <button
              onClick={() => { setActiveMainTab('talk'); setActiveTab('talk-all') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'talk' && activeTab === 'talk-all'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => { setActiveMainTab('talk'); setActiveTab('talk-chat') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'talk' && activeTab === 'talk-chat'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              수다
            </button>
            <button
              onClick={() => { setActiveMainTab('talk'); setActiveTab('talk-comfort') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'talk' && activeTab === 'talk-comfort'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              토닥
            </button>
            <button
              onClick={() => { setActiveMainTab('talk'); setActiveTab('talk-qna') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'talk' && activeTab === 'talk-qna'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Q&A
            </button>
            <button
              onClick={() => { setActiveMainTab('talk'); setActiveTab('talk-tips') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'talk' && activeTab === 'talk-tips'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              꿀팁
            </button>
          </div>
        )}
      </div>

      {/* 공지 */}
      <div>
        <button
          onClick={() => setExpandedMenus({...expandedMenus, notice: !expandedMenus.notice})}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>공지</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${expandedMenus.notice ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedMenus.notice && (
          <div className="ml-3 mt-1 space-y-1">
            <button
              onClick={() => { setActiveMainTab('notice'); setActiveTab('notice-all') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'notice' && activeTab === 'notice-all'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => { setActiveMainTab('notice'); setActiveTab('notice-announcement') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'notice' && activeTab === 'notice-announcement'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              공지
            </button>
            <button
              onClick={() => { setActiveMainTab('notice'); setActiveTab('notice-event') }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeMainTab === 'notice' && activeTab === 'notice-event'
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              이벤트
            </button>
          </div>
        )}
      </div>
    </nav>

    {/* 트렌딩 토픽 */}
    <div className="pt-3 mt-3 border-t border-gray-200">
      <h3 className="font-bold text-xs mb-2 text-gray-900 px-3">트렌딩 토픽</h3>
      <div className="space-y-1">
        <div className="flex items-center space-x-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
          <Flame className="w-3 h-3 text-teal-500" />
          <span className="text-gray-700">#블랙프라이데이</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
          <Flame className="w-3 h-3 text-teal-500" />
          <span className="text-gray-700">#연말알바</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
          <Flame className="w-3 h-3 text-teal-500" />
          <span className="text-gray-700">#IT기기할인</span>
        </div>
      </div>
    </div>
  </div>
</aside>

          {/* Feed */}
          <main className="flex-1">
      {/* 모바일 탭 메뉴 */}
<div className="md:hidden mb-4 bg-white border border-gray-200 rounded-xl p-3">
{activeMainTab === 'home' && (
  <div className="space-y-2">
    {/* 메인 버튼들 - 가로 배치 */}
    <div className="flex gap-2">
      <button
        onClick={() => { setActiveTab('all'); setExpandedMenus({...expandedMenus, hotdeal: false, share: false, job: false}) }}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeTab === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'
        }`}
      >
        전체
      </button>
      
      <button
        onClick={() => setExpandedMenus({...expandedMenus, hotdeal: !expandedMenus.hotdeal, share: false, job: false})}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          expandedMenus.hotdeal || activeTab.startsWith('hotdeal') ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'
        }`}
      >
        핫딜
      </button>
      
      <button
        onClick={() => setExpandedMenus({...expandedMenus, share: !expandedMenus.share, hotdeal: false, job: false})}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          expandedMenus.share || activeTab.startsWith('share') ? 'bg-purple-100 text-purple-700' : 'bg-gray-50 text-gray-700'
        }`}
      >
        쉐어
      </button>
      
      <button
        onClick={() => setExpandedMenus({...expandedMenus, job: !expandedMenus.job, hotdeal: false, share: false})}
        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          expandedMenus.job || activeTab.startsWith('job') ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-700'
        }`}
      >
        JOB
      </button>
    </div>
    
    {/* 핫딜 서브메뉴 */}
    {expandedMenus.hotdeal && (
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('hotdeal-jeonje')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-jeonje' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>전단지</button>
        <button onClick={() => setActiveTab('hotdeal-sale')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-sale' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>할인</button>
        <button onClick={() => setActiveTab('hotdeal-event')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'hotdeal-event' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>행사</button>
      </div>
    )}

    {/* 쉐어 서브메뉴 */}
    {expandedMenus.share && (
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('share-living')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'share-living' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>생활용품</button>
        <button onClick={() => setActiveTab('share-realestate')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'share-realestate' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>부동산</button>
        <button onClick={() => setActiveTab('share-etc')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'share-etc' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>기타</button>
      </div>
    )}

    {/* JOB 서브메뉴 */}
    {expandedMenus.job && (
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('job-hire')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-hire' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}>구인</button>
        <button onClick={() => setActiveTab('job-seek')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-seek' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}>구직</button>
        <button onClick={() => setActiveTab('job-story')} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === 'job-story' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}>JOB썰</button>
      </div>
    )}
  </div>
)}
 {activeMainTab === 'talk' && (
  <div className="flex gap-2">
    <button onClick={() => setActiveTab('talk-all')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>전체</button>
    <button onClick={() => setActiveTab('talk-chat')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-chat' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>수다</button>
    <button onClick={() => setActiveTab('talk-comfort')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-comfort' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>토닥</button>
    <button onClick={() => setActiveTab('talk-qna')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-qna' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>Q&A</button>
    <button onClick={() => setActiveTab('talk-tips')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'talk-tips' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>꿀팁</button>
  </div>
)}

{activeMainTab === 'notice' && (
  <div className="flex gap-2">
    <button onClick={() => setActiveTab('notice-all')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>전체</button>
    <button onClick={() => setActiveTab('notice-announcement')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-announcement' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>공지</button>
    <button onClick={() => setActiveTab('notice-event')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notice-event' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-700'}`}>이벤트</button>
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
  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow animate-slide-up"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {post.author[0]}
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
      onClick={() => {
        setExpandedPosts(prev => {
          const newSet = new Set(prev)
          if (newSet.has(post.id)) {
            newSet.delete(post.id)
          } else {
            newSet.add(post.id)
          }
          return newSet
        })
      }}
      className="text-xs text-teal-600 hover:underline mt-1"
    >
      {expandedPosts.has(post.id) ? '접기' : '더보기'}
    </button>
  )}
</div>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className={`mb-3 grid gap-2 ${
                          post.images.length === 1 ? 'grid-cols-1' : 
                          post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                        }`}>
                          {post.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                              <img 
  src={img} 
  alt="" 
  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
  onClick={() => setSelectedImageUrl(img)}
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
                        {post.discount && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-teal-50 rounded-md text-teal-700 text-xs font-semibold border border-teal-200">
                            <Tag className="w-3 h-3" />
                            <span>{post.discount} 할인</span>
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
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-1.5 transition-colors ${
                            likedPosts.has(post.id) ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs font-medium">{post.likes_count || 0}</span>
                        </button>

                        <button 
                          onClick={() => {
                            if (showComments === post.id) {
                              setShowComments(null)
                            } else {
                              setShowComments(post.id)
                              fetchComments(post.id)
                            }
                          }}
                          className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.comments_count || 0}</span>
                        </button>

                        <button className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors ml-auto">
                          <Bookmark className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.bookmarks_count || 0}</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments === post.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3 mb-3">
                          {comments[post.id]?.map((comment) => (
  <div key={comment.id} className="flex space-x-2">
    <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {comment.author[0]}
    </div>
    <div className="flex-1">
      {editingComment === comment.id ? (
        // 수정 모드
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
              onClick={() => handleEditComment(comment.id)}
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
        // 일반 모드
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
        </div>
      )}
    </div>
  </div>
))}
                          </div>

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
                              onClick={() => handleAddComment(post.id)}
                              className="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors"
                            >
                              작성
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                 ))
                }
                
                {/* 무한 스크롤 로딩 */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 mt-2">게시물을 불러오는 중...</p>
                  </div>
                )}
                
                {/* 마지막 게시물 */}
                {!hasMore && sortedPosts.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">✨ 마지막 게시물입니다</p>
                  </div>
                )}
              </>
            )}
          </div>
          </main>

       {/* Right Sidebar */}
<aside className="hidden xl:block w-64 space-y-3">
  {/* 댓글 많은 게시물 */}
  <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
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
              // 해당 게시물로 스크롤 (선택사항)
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

  {/* 좋아요 많은 게시물 */}
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
      onClick={() => { 
        setActiveMainTab('talk'); 
        setActiveTab('talk-all'); 
        setExpandedMenus({...expandedMenus, talk: true}) 
      }}
      className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
        activeMainTab === 'talk' ? 'text-teal-600' : 'text-gray-600'
      }`}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-[10px] font-medium">톡</span>
    </button>

    <button 
      onClick={() => setIsWriteModalOpen(true)}
      className="flex flex-col items-center justify-center flex-1 h-full -mt-8"
    >
      <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
        <Plus className="w-6 h-6 text-white" />
      </div>
    </button>

    <button 
      onClick={() => { 
        setActiveMainTab('notice'); 
        setActiveTab('notice-all'); 
        setExpandedMenus({...expandedMenus, notice: true}) 
      }}
      className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
        activeMainTab === 'notice' ? 'text-teal-600' : 'text-gray-600'
      }`}
    >
      <Bell className="w-5 h-5" />
      <span className="text-[10px] font-medium">공지</span>
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
             {/* 메인 카테고리 */}
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
    onClick={() => setNewPost({...newPost, type: 'share', category: ''})}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      newPost.type === 'share' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    쉐어
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

{/* 서브 카테고리 */}
<div>
  <label className="block text-sm font-semibold mb-2">세부 카테고리 *</label>
  
  {/* 핫딜 서브 */}
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
  onClick={() => setNewPost({...newPost, category: '할인'})}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    newPost.category === '할인' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
  할인
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
    </div>
  )}
  
  {/* 쉐어 서브 */}
  {newPost.type === 'share' && (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => setNewPost({...newPost, category: '생활용품'})}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          newPost.category === '생활용품' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        생활용품
      </button>
      <button
        type="button"
        onClick={() => setNewPost({...newPost, category: '부동산'})}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          newPost.category === '부동산' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        부동산
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
  
  {/* JOB 서브 */}
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
        onClick={() => setNewPost({...newPost, category: '구직'})}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          newPost.category === '구직' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        구직
      </button>
      <button
        type="button"
        onClick={() => setNewPost({...newPost, category: 'JOB썰'})}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          newPost.category === 'JOB썰' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        JOB썰
      </button>
    </div>
  )}
  {/* 톡 서브 */}
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

             {/* 핫딜만 할인율/가격 */}
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

{/* JOB만 시급/기간 */}
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

{/* 쉐어는 추가 필드 없음 */}

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
  {/* Image Lightbox Modal */}
{selectedImageUrl && (
  <div 
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-hidden"
    onClick={() => {
      setSelectedImageUrl(null)
      setImageZoom(100)
    }}
    onWheel={(e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -25 : 25
      setImageZoom(prev => Math.max(25, Math.min(400, prev + delta)))
    }}
  >
    {/* 닫기 버튼 */}
    <button
      onClick={() => {
        setSelectedImageUrl(null)
        setImageZoom(100)
      }}
      className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
    >
      <X className="w-6 h-6 text-white" />
    </button>
    
    {/* 하단 줌 컨트롤 */}
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
        src={selectedImageUrl} 
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
    </div>
  )
}