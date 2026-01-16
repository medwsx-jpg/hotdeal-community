import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, MessageSquare, AlertTriangle, 
  TrendingUp, BarChart3, Shield, Home, Bell, Plus, X, Image as ImageIcon, Edit2, Trash2,
  Award, Trophy, Medal, UserPlus, Eye, Calendar, Search, ChevronLeft, ChevronRight,
  ShoppingBag, Gift
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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

  // 스토어 관리 상태
  const [storeProducts, setStoreProducts] = useState([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image_url: '', description: '', is_active: true })
  const [productLoading, setProductLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (profile === null) return
    if (profile.role !== '관리자') { alert('관리자만 접근할 수 있습니다.'); navigate('/feed'); return }
    fetchStats(); fetchNotices(); fetchUserStats(); fetchRecentUsers(); fetchReports(); fetchStoreProducts()
  }, [user, profile, navigate])

  useEffect(() => {
    if (activeTab === 'posts') fetchAllPosts(0, '', true)
    else if (activeTab === 'comments') fetchAllComments(0, '', true)
    else if (activeTab === 'store') fetchStoreProducts()
  }, [activeTab])

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
    } catch (error) { console.error('상품 저장 실패:', error); alert('저장 실패: ' + error.message) } finally { setProductLoading(false) }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('store_products').delete().eq('id', productId)
      if (error) throw error
      alert('상품이 삭제되었습니다!'); fetchStoreProducts()
    } catch (error) { console.error('상품 삭제 실패:', error); alert('삭제 실패: ' + error.message) }
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
    } catch (error) { console.error('이미지 업로드 실패:', error); alert('이미지 업로드 실패: ' + error.message) } finally { setProductLoading(false) }
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
      const start = pageNum * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).range(start, end)
      if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      const postsWithAuthor = await Promise.all((data || []).map(async (post) => {
        const { data: authorData } = await supabase.from('profiles').select('username').eq('id', post.user_id).single()
        return { ...post, author: authorData?.username || '익명' }
      }))
      if (reset) setAllPosts(postsWithAuthor)
      else setAllPosts(prev => [...prev, ...postsWithAuthor])
      setPostsHasMore(data.length === POSTS_PER_PAGE); setPostsPage(pageNum)
    } catch (error) { console.error('게시물 로드 실패:', error) } finally { setLoading(false) }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까?\n(관련 댓글, 좋아요, 신고도 함께 삭제됩니다)')) return
    try {
      await supabase.from('comments').delete().eq('post_id', postId)
      await supabase.from('likes').delete().eq('post_id', postId)
      await supabase.from('reports').delete().eq('post_id', postId)
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      alert('게시물이 삭제되었습니다!'); fetchAllPosts(0, postsSearch, true); fetchStats()
    } catch (error) { console.error('게시물 삭제 실패:', error); alert('삭제 실패: ' + error.message) }
  }

  const fetchAllComments = async (pageNum = 0, search = '', reset = false) => {
    try {
      setLoading(true)
      const start = pageNum * COMMENTS_PER_PAGE
      const end = start + COMMENTS_PER_PAGE - 1
      let query = supabase.from('comments').select(`*, posts (id, title)`).order('created_at', { ascending: false }).range(start, end)
      if (search) query = query.ilike('content', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      const commentsWithAuthor = await Promise.all((data || []).map(async (comment) => {
        const { data: authorData } = await supabase.from('profiles').select('username').eq('id', comment.user_id).single()
        return { ...comment, author: authorData?.username || '익명' }
      }))
      if (reset) setAllComments(commentsWithAuthor)
      else setAllComments(prev => [...prev, ...commentsWithAuthor])
      setCommentsHasMore(data.length === COMMENTS_PER_PAGE); setCommentsPage(pageNum)
    } catch (error) { console.error('댓글 로드 실패:', error) } finally { setLoading(false) }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId)
      if (error) throw error
      alert('댓글이 삭제되었습니다!'); fetchAllComments(0, commentsSearch, true); fetchStats()
    } catch (error) { console.error('댓글 삭제 실패:', error); alert('삭제 실패: ' + error.message) }
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
    } catch (error) { console.error('신고 처리 실패:', error); alert('처리 실패: ' + error.message) }
  }

  const handleDeleteReportedPost = async (reportId, postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까?\n(관련 댓글, 좋아요, 신고도 함께 삭제됩니다)')) return
    try {
      await supabase.from('comments').delete().eq('post_id', postId)
      await supabase.from('likes').delete().eq('post_id', postId)
      await supabase.from('reports').delete().eq('post_id', postId)
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      alert('게시물이 삭제되었습니다!'); fetchReports(); fetchStats()
    } catch (error) { console.error('게시물 삭제 실패:', error); alert('삭제 실패: ' + error.message) }
  }

  const fetchUserStats = async (period = 'all') => {
    try {
      setLoading(true)
      let dateFilter = null
      const now = new Date()
      if (period === 'today') dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      else if (period === 'week') dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString()
      else if (period === 'month') dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username')
      if (profilesError) throw profilesError
      if (!profiles || profiles.length === 0) { setUserStats({ topPosters: [], topCommenters: [], allUsers: [] }); return }
      const userStatsData = await Promise.all(profiles.map(async (profile) => {
        let postsQuery = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
        if (dateFilter) postsQuery = postsQuery.gte('created_at', dateFilter)
        const { count: postsCount } = await postsQuery
        let commentsQuery = supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
        if (dateFilter) commentsQuery = commentsQuery.gte('created_at', dateFilter)
        const { count: commentsCount } = await commentsQuery
        const { data: userPosts } = await supabase.from('posts').select('id').eq('user_id', profile.id)
        let likesCount = 0
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map(p => p.id)
          const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).in('post_id', postIds)
          likesCount = count || 0
        }
        return { ...profile, postsCount: postsCount || 0, commentsCount: commentsCount || 0, likesCount }
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

  const handleNoticeImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    try {
      setNoticeLoading(true)
      const uploadedUrls = await Promise.all(files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
        return data.publicUrl
      }))
      setSelectedImages([...selectedImages, ...uploadedUrls])
    } catch (error) { console.error('이미지 업로드 실패:', error); alert('이미지 업로드 실패: ' + error.message) } finally { setNoticeLoading(false) }
  }

  const removeNoticeImage = (index) => { setSelectedImages(selectedImages.filter((_, i) => i !== index)) }

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
    } catch (error) { console.error('작성 실패:', error); alert('작성 실패: ' + error.message) } finally { setNoticeLoading(false) }
  }

  const handleNoticeEdit = (notice) => { setEditingNotice(notice); setNewNotice({ category: notice.category, title: notice.title, content: notice.content }); setSelectedImages(notice.images || []); setIsWriting(true) }

  const handleNoticeDelete = async (noticeId) => {
    if (!window.confirm('공지를 삭제하시겠습니까?')) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', noticeId)
      if (error) throw error
      alert('삭제되었습니다!'); fetchNotices()
    } catch (error) { console.error('삭제 실패:', error); alert('삭제 실패: ' + error.message) }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  if (loading && activeTab === 'dashboard') {
    return (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-gray-600 mt-2">로딩 중...</p></div></div>)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3"><Shield className="w-6 h-6 text-teal-600" /><h1 className="text-xl font-bold text-gray-900">관리자 페이지</h1></div>
            <button onClick={() => navigate('/feed')} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Home className="w-4 h-4" /><span>메인으로</span></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 사용자</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p></div><div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-teal-600" /></div></div></div>
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 게시물</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p></div><div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-cyan-600" /></div></div></div>
          <div className="bg-white rounded-xl p-6 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">총 댓글</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalComments}</p></div><div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-6 h-6 text-emerald-600" /></div></div></div>
          <div onClick={() => setActiveTab('reports')} className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">신고 대기</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.totalReports}</p></div><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div></div></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8 px-6 min-w-max">
              <button onClick={() => setActiveTab('dashboard')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>대시보드</button>
              <button onClick={() => setActiveTab('notices')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notices' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>공지 관리</button>
              <button onClick={() => setActiveTab('store')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1 ${activeTab === 'store' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Gift className="w-4 h-4" /><span>스토어 관리</span></button>
              <button onClick={() => setActiveTab('posts')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'posts' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>게시물 관리</button>
              <button onClick={() => setActiveTab('comments')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'comments' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>댓글 관리</button>
              <button onClick={() => setActiveTab('reports')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1 ${activeTab === 'reports' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><span>신고 관리</span>{stats.totalReports > 0 && (<span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{stats.totalReports}</span>)}</button>
              <button onClick={() => setActiveTab('users')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>사용자 관리</button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-8"><div className="flex items-center space-x-2 mb-4"><UserPlus className="w-5 h-5 text-teal-600" /><h2 className="text-lg font-bold text-gray-900">🆕 신규 가입 현황</h2></div><div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">{recentUsers.length === 0 ? (<p className="text-sm text-gray-600 text-center py-4">가입자가 없습니다</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">{recentUsers.map((user, index) => (<div key={user.id} className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow"><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{user.username?.[0] || 'U'}</div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{user.username || '익명'}</p><p className="text-[10px] text-gray-500">{user.created_at ? getTimeAgo(user.created_at) : '최근'}</p></div>{index < 3 && (<span className="text-lg">{index === 0 ? '🆕' : index === 1 ? '✨' : '👋'}</span>)}</div></div>))}</div>)}</div></div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">📊 사용자 활동 통계</h2><div className="flex gap-2">{['all', 'month', 'week', 'today'].map(p => (<button key={p} onClick={() => { setStatsPeriod(p); fetchUserStats(p) }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statsPeriod === p ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{p === 'all' ? '전체' : p === 'month' ? '이번 달' : p === 'week' ? '이번 주' : '오늘'}</button>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200"><div className="flex items-center space-x-2 mb-4"><Trophy className="w-5 h-5 text-teal-600" /><h3 className="font-bold text-gray-900">🏆 게시물 작성 TOP 5</h3></div><div className="space-y-3">{userStats.topPosters.length === 0 ? (<p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p>) : (userStats.topPosters.map((user, index) => (<div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md transition-shadow"><div className="flex items-center space-x-3"><span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}</span><p className="font-semibold text-gray-900">{user.username || '익명'}</p></div><div className="text-right"><p className="text-lg font-bold text-teal-600">{user.postsCount}개</p></div></div>)))}</div></div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"><div className="flex items-center space-x-2 mb-4"><MessageSquare className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-gray-900">💬 댓글 작성 TOP 5</h3></div><div className="space-y-3">{userStats.topCommenters.length === 0 ? (<p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p>) : (userStats.topCommenters.map((user, index) => (<div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md transition-shadow"><div className="flex items-center space-x-3"><span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}</span><p className="font-semibold text-gray-900">{user.username || '익명'}</p></div><div className="text-right"><p className="text-lg font-bold text-purple-600">{user.commentsCount}개</p></div></div>)))}</div></div>
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">공지/이벤트 관리</h2><button onClick={() => { setIsWriting(true); setEditingNotice(null); setNewNotice({ category: '공지', title: '', content: '' }); setSelectedImages([]) }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-md"><Plus className="w-4 h-4" /><span>공지 작성</span></button></div>
                {isWriting && (<div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-teal-200"><form onSubmit={handleNoticeSubmit} className="space-y-4"><div><label className="block text-sm font-semibold mb-2">카테고리</label><div className="flex gap-2">{['공지', '이벤트'].map(cat => (<button key={cat} type="button" onClick={() => setNewNotice({...newNotice, category: cat})} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newNotice.category === cat ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{cat}</button>))}</div></div><div><label className="block text-sm font-semibold mb-2">제목 *</label><input type="text" required value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} placeholder="제목을 입력하세요" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div><div><label className="block text-sm font-semibold mb-2">내용 *</label><textarea required value={newNotice.content} onChange={(e) => setNewNotice({...newNotice, content: e.target.value})} placeholder="내용을 입력하세요" rows="6" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none" /></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => { setIsWriting(false); setEditingNotice(null); setNewNotice({ category: '공지', title: '', content: '' }); setSelectedImages([]) }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">취소</button><button type="submit" disabled={noticeLoading} className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50">{noticeLoading ? '작성 중...' : editingNotice ? '수정 완료' : '작성 완료'}</button></div></form></div>)}
                <div className="space-y-3">{notices.length === 0 ? (<div className="text-center py-12 bg-gray-50 rounded-xl"><Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">작성된 공지가 없습니다</p></div>) : (notices.map((notice) => (<div key={notice.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-2 mb-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${notice.category === '공지' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{notice.category}</span><span className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</span></div><h3 className="font-bold text-gray-900 mb-1">{notice.title}</h3><p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p></div><div className="flex gap-2 ml-4"><button onClick={() => handleNoticeEdit(notice)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleNoticeDelete(notice.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></div></div>)))}</div>
              </div>
            )}

            {activeTab === 'store' && (
              <div>
                <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">🎁 스토어 상품 관리</h2><button onClick={() => { setIsAddingProduct(true); setEditingProduct(null); setNewProduct({ name: '', price: '', image_url: '', description: '', is_active: true }) }} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-md"><Plus className="w-4 h-4" /><span>상품 추가</span></button></div>
                {isAddingProduct && (<div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-teal-200"><form onSubmit={handleProductSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-2">상품명 *</label><input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="예: 스타벅스 아메리카노" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div><div><label className="block text-sm font-semibold mb-2">포인트 *</label><input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} placeholder="예: 4000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div></div><div><label className="block text-sm font-semibold mb-2">상품 이미지</label><div className="flex items-center gap-4"><input type="file" id="product-image-upload" accept="image/*" onChange={handleProductImageUpload} className="hidden" /><label htmlFor="product-image-upload" className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"><ImageIcon className="w-4 h-4 text-gray-600" /><span className="text-sm text-gray-700">이미지 업로드</span></label><span className="text-sm text-gray-500">또는</span><input type="text" value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} placeholder="이미지 URL 또는 이모지 (예: 🍕)" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div>{newProduct.image_url && (<div className="mt-2 w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">{newProduct.image_url.startsWith('http') ? (<img src={newProduct.image_url} alt="" className="w-full h-full object-cover" />) : (<span className="text-4xl">{newProduct.image_url}</span>)}</div>)}</div><div><label className="block text-sm font-semibold mb-2">설명</label><input type="text" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="상품 설명 (선택)" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /></div><div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={newProduct.is_active} onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})} className="w-4 h-4 text-teal-600" /><label htmlFor="is_active" className="text-sm text-gray-700">상품 활성화 (사용자에게 표시)</label></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); setNewProduct({ name: '', price: '', image_url: '', description: '', is_active: true }) }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">취소</button><button type="submit" disabled={productLoading} className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50">{productLoading ? '저장 중...' : editingProduct ? '수정 완료' : '상품 추가'}</button></div></form></div>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{storeProducts.length === 0 ? (<div className="col-span-full text-center py-12 bg-gray-50 rounded-xl"><Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">등록된 상품이 없습니다</p></div>) : (storeProducts.map((product) => (<div key={product.id} className={`bg-white border-2 rounded-xl p-4 hover:shadow-md transition-shadow ${product.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}><div className="flex items-start gap-4"><div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">{product.image_url?.startsWith('http') ? (<img src={product.image_url} alt="" className="w-full h-full object-cover" />) : (<span className="text-3xl">{product.image_url || '🎁'}</span>)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-gray-900 truncate">{product.name}</h3>{!product.is_active && (<span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">비활성</span>)}</div><p className="text-teal-600 font-bold">{product.price?.toLocaleString()}P</p>{product.description && (<p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>)}</div></div><div className="flex gap-2 mt-4 pt-4 border-t border-gray-100"><button onClick={() => { setEditingProduct(product); setNewProduct({ name: product.name, price: product.price?.toString() || '', image_url: product.image_url || '', description: product.description || '', is_active: product.is_active }); setIsAddingProduct(true) }} className="flex-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-1"><Edit2 className="w-3.5 h-3.5" /><span>수정</span></button><button onClick={() => handleDeleteProduct(product.id)} className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /><span>삭제</span></button></div></div>)))}</div>
              </div>
            )}

            {activeTab === 'posts' && (<div><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">📝 전체 게시물 관리</h2><div className="relative"><input type="text" value={postsSearch} onChange={(e) => { setPostsSearch(e.target.value); fetchAllPosts(0, e.target.value, true) }} placeholder="게시물 검색..." className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div></div><div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유형</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">제목</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th><th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th></tr></thead><tbody className="divide-y divide-gray-200">{allPosts.length === 0 ? (<tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">게시물이 없습니다</td></tr>) : (allPosts.map((post, index) => (<tr key={post.id} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 text-sm text-gray-900">{postsPage * POSTS_PER_PAGE + index + 1}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' : post.type === 'job' ? 'bg-cyan-100 text-cyan-700' : post.type === 'talk' ? 'bg-orange-100 text-orange-700' : post.type === 'notice' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{post.category || post.type}</span></td><td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{post.title}</td><td className="px-4 py-3 text-sm text-gray-600">{post.author}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => window.open(`/feed#post-${post.id}`, '_blank')} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="보기"><Eye className="w-4 h-4" /></button><button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="삭제"><Trash2 className="w-4 h-4" /></button></div></td></tr>)))}</tbody></table></div></div></div>)}

            {activeTab === 'comments' && (<div><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">💬 전체 댓글 관리</h2><div className="relative"><input type="text" value={commentsSearch} onChange={(e) => { setCommentsSearch(e.target.value); fetchAllComments(0, e.target.value, true) }} placeholder="댓글 검색..." className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div></div><div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">게시물</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">댓글 내용</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th><th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th></tr></thead><tbody className="divide-y divide-gray-200">{allComments.length === 0 ? (<tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">댓글이 없습니다</td></tr>) : (allComments.map((comment, index) => (<tr key={comment.id} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 text-sm text-gray-900">{commentsPage * COMMENTS_PER_PAGE + index + 1}</td><td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{comment.posts?.title || '삭제된 게시물'}</td><td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{comment.content}</td><td className="px-4 py-3 text-sm text-gray-600">{comment.author}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2">{comment.posts?.id && (<button onClick={() => window.open(`/feed#post-${comment.posts.id}`, '_blank')} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="게시물 보기"><Eye className="w-4 h-4" /></button>)}<button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="삭제"><Trash2 className="w-4 h-4" /></button></div></td></tr>)))}</tbody></table></div></div></div>)}

            {activeTab === 'reports' && (<div><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold text-gray-900">🚨 신고 관리</h2><button onClick={fetchReports} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">새로고침</button></div>{reportsLoading ? (<div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div><p className="text-sm text-gray-600 mt-2">로딩 중...</p></div>) : reports.length === 0 ? (<div className="text-center py-12 bg-gray-50 rounded-xl"><AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">신고된 게시물이 없습니다</p><p className="text-sm text-gray-500 mt-1">깨끗한 커뮤니티 유지 중! 👍</p></div>) : (<div className="space-y-4">{reports.map((report) => (<div key={report.id} className="bg-white border-2 border-red-200 rounded-xl p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-2 mb-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{report.reason}</span><span className="text-xs text-gray-500">신고자: {report.reporter}</span><span className="text-xs text-gray-400">{getTimeAgo(report.created_at)}</span></div>{report.posts ? (<div className="bg-gray-50 rounded-lg p-4"><div className="flex items-center space-x-2 mb-2"><span className="text-xs text-gray-500">작성자: {report.postAuthor}</span></div><h4 className="font-bold text-gray-900 mb-1">{report.posts.title}</h4><p className="text-sm text-gray-600 line-clamp-2">{report.posts.content}</p></div>) : (<div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">삭제된 게시물입니다</div>)}</div><div className="flex flex-col gap-2 ml-4">{report.posts && (<><button onClick={() => window.open(`/feed#post-${report.posts.id}`, '_blank')} className="flex items-center space-x-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"><Eye className="w-4 h-4" /><span>보기</span></button><button onClick={() => handleDeleteReportedPost(report.id, report.posts.id)} className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /><span>삭제</span></button></>)}<button onClick={() => handleDismissReport(report.id)} className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"><X className="w-4 h-4" /><span>무시</span></button></div></div></div>))}</div>)}</div>)}

            {activeTab === 'users' && (<div className="text-center py-12"><Users className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">사용자 관리 기능은 곧 추가됩니다</p></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}