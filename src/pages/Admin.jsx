import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, MessageSquare, AlertTriangle, 
  TrendingUp, BarChart3, Shield, Home, Bell, Plus, X, Image as ImageIcon, Edit2, Trash2,
  Award, Trophy, Medal, UserPlus, Eye, Calendar, Search, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // 공지 관련 상태
  const [notices, setNotices] = useState([])
  const [isWriting, setIsWriting] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [newNotice, setNewNotice] = useState({
    category: '공지',
    title: '',
    content: ''
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [noticeLoading, setNoticeLoading] = useState(false)
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalReports: 0
  })

  // 🆕 사용자 통계 상태
  const [userStats, setUserStats] = useState({
    topPosters: [],
    topCommenters: [],
    allUsers: []
  })
  const [statsPeriod, setStatsPeriod] = useState('all')

  // 🆕 신규 가입자 상태
  const [recentUsers, setRecentUsers] = useState([])

  // 🆕 게시물 관리 상태
  const [allPosts, setAllPosts] = useState([])
  const [postsPage, setPostsPage] = useState(0)
  const [postsSearch, setPostsSearch] = useState('')
  const [postsHasMore, setPostsHasMore] = useState(true)
  const POSTS_PER_PAGE = 20

  // 🆕 댓글 관리 상태
  const [allComments, setAllComments] = useState([])
  const [commentsPage, setCommentsPage] = useState(0)
  const [commentsSearch, setCommentsSearch] = useState('')
  const [commentsHasMore, setCommentsHasMore] = useState(true)
  const COMMENTS_PER_PAGE = 20

  // 🆕 신고 관리 상태
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (profile === null) {
      return
    }
    
    if (profile.role !== '관리자') {
      alert('관리자만 접근할 수 있습니다.')
      navigate('/feed')
      return
    }
    
    fetchStats()
    fetchNotices()
    fetchUserStats()
    fetchRecentUsers()
    fetchReports()
  }, [user, profile, navigate])

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchAllPosts(0, '', true)
    } else if (activeTab === 'comments') {
      fetchAllComments(0, '', true)
    }
  }, [activeTab])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      const [users, posts, comments, reportsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true })
      ])
      
      setStats({
        totalUsers: users.count || 0,
        totalPosts: posts.count || 0,
        totalComments: comments.count || 0,
        totalReports: reportsData.count || 0
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 신규 가입자 fetch
  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setRecentUsers(data || [])
    } catch (error) {
      console.error('신규 가입자 로드 실패:', error)
    }
  }

  // 🆕 전체 게시물 fetch
  const fetchAllPosts = async (pageNum = 0, search = '', reset = false) => {
    try {
      setLoading(true)
      
      const start = pageNum * POSTS_PER_PAGE
      const end = start + POSTS_PER_PAGE - 1
      
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // 작성자 정보 가져오기
      const postsWithAuthor = await Promise.all(
        (data || []).map(async (post) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', post.user_id)
            .single()
          
          return {
            ...post,
            author: authorData?.username || '익명'
          }
        })
      )
      
      if (reset) {
        setAllPosts(postsWithAuthor)
      } else {
        setAllPosts(prev => [...prev, ...postsWithAuthor])
      }
      
      setPostsHasMore(data.length === POSTS_PER_PAGE)
      setPostsPage(pageNum)
    } catch (error) {
      console.error('게시물 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 게시물 삭제
  const handleDeletePost = async (postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      
      alert('게시물이 삭제되었습니다!')
      fetchAllPosts(0, postsSearch, true)
      fetchStats()
    } catch (error) {
      console.error('게시물 삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  // 🆕 전체 댓글 fetch
  const fetchAllComments = async (pageNum = 0, search = '', reset = false) => {
    try {
      setLoading(true)
      
      const start = pageNum * COMMENTS_PER_PAGE
      const end = start + COMMENTS_PER_PAGE - 1
      
      let query = supabase
        .from('comments')
        .select(`
          *,
          posts (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .range(start, end)
      
      if (search) {
        query = query.ilike('content', `%${search}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // 작성자 정보 가져오기
      const commentsWithAuthor = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', comment.user_id)
            .single()
          
          return {
            ...comment,
            author: authorData?.username || '익명'
          }
        })
      )
      
      if (reset) {
        setAllComments(commentsWithAuthor)
      } else {
        setAllComments(prev => [...prev, ...commentsWithAuthor])
      }
      
      setCommentsHasMore(data.length === COMMENTS_PER_PAGE)
      setCommentsPage(pageNum)
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      
      if (error) throw error
      
      alert('댓글이 삭제되었습니다!')
      fetchAllComments(0, commentsSearch, true)
      fetchStats()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  // 🆕 신고 목록 fetch
  const fetchReports = async () => {
    try {
      setReportsLoading(true)
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          posts (
            id,
            title,
            content,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // 신고자 정보 가져오기
      const reportsWithInfo = await Promise.all(
        (data || []).map(async (report) => {
          // 신고자 정보
          const { data: reporterData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', report.user_id)
            .single()
          
          // 게시물 작성자 정보
          let postAuthor = '익명'
          if (report.posts?.user_id) {
            const { data: authorData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', report.posts.user_id)
              .single()
            
            postAuthor = authorData?.username || '익명'
          }
          
          return {
            ...report,
            reporter: reporterData?.username || '익명',
            postAuthor
          }
        })
      )
      
      setReports(reportsWithInfo)
    } catch (error) {
      console.error('신고 목록 로드 실패:', error)
    } finally {
      setReportsLoading(false)
    }
  }

  // 🆕 신고 처리 (신고만 삭제)
  const handleDismissReport = async (reportId) => {
    if (!window.confirm('이 신고를 무시 처리하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
      
      if (error) throw error
      
      alert('신고가 무시 처리되었습니다!')
      fetchReports()
      fetchStats()
    } catch (error) {
      console.error('신고 처리 실패:', error)
      alert('처리 실패: ' + error.message)
    }
  }

  // 🆕 신고된 게시물 삭제
  const handleDeleteReportedPost = async (reportId, postId) => {
    if (!window.confirm('이 게시물을 삭제하시겠습니까? (관련 신고도 함께 삭제됩니다)')) return
    
    try {
      // 먼저 해당 게시물에 대한 모든 신고 삭제
      await supabase
        .from('reports')
        .delete()
        .eq('post_id', postId)
      
      // 게시물 삭제
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      
      alert('게시물이 삭제되었습니다!')
      fetchReports()
      fetchStats()
    } catch (error) {
      console.error('게시물 삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  // 🆕 사용자 통계 fetch
  const fetchUserStats = async (period = 'all') => {
    try {
      setLoading(true)
      
      // 기간 필터
      let dateFilter = null
      const now = new Date()
      
      if (period === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (period === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        dateFilter = weekAgo.toISOString()
      } else if (period === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
        dateFilter = monthAgo.toISOString()
      }
      
      // 모든 사용자 정보 가져오기
      const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      
      if (profilesError) {
        console.error('프로필 로드 에러:', profilesError)
        throw profilesError
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('프로필 데이터 없음')
        setUserStats({
          topPosters: [],
          topCommenters: [],
          allUsers: []
        })
        return
      }
      
      // 각 사용자별 게시물 수, 댓글 수 계산
      const userStatsData = await Promise.all(
        profiles.map(async (profile) => {
          // 게시물 수
          let postsQuery = supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
          
          if (dateFilter) {
            postsQuery = postsQuery.gte('created_at', dateFilter)
          }
          
          const { count: postsCount } = await postsQuery
          
          // 댓글 수
          let commentsQuery = supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
          
          if (dateFilter) {
            commentsQuery = commentsQuery.gte('created_at', dateFilter)
          }
          
          const { count: commentsCount } = await commentsQuery
          
          // 좋아요 수 (받은 좋아요)
          const { data: userPosts } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', profile.id)
          
          let likesCount = 0
          if (userPosts && userPosts.length > 0) {
            const postIds = userPosts.map(p => p.id)
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .in('post_id', postIds)
            
            likesCount = count || 0
          }
          
          return {
            ...profile,
            postsCount: postsCount || 0,
            commentsCount: commentsCount || 0,
            likesCount: likesCount
          }
        })
      )
      
      // 게시물 많은 순 TOP 5
      const topPosters = [...userStatsData]
        .sort((a, b) => b.postsCount - a.postsCount)
        .slice(0, 5)
      
      // 댓글 많은 순 TOP 5
      const topCommenters = [...userStatsData]
        .sort((a, b) => b.commentsCount - a.commentsCount)
        .slice(0, 5)
      
      setUserStats({
        topPosters,
        topCommenters,
        allUsers: userStatsData
      })
      
    } catch (error) {
      console.error('사용자 통계 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'notice')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('공지 로드 실패:', error)
    }
  }

  const handleNoticeImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    try {
      setNoticeLoading(true)
      
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
      setNoticeLoading(false)
    }
  }

  const removeNoticeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const handleNoticeSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setNoticeLoading(true)
      
      if (editingNotice) {
        const { error } = await supabase
          .from('posts')
          .update({
            category: newNotice.category,
            title: newNotice.title,
            content: newNotice.content,
            images: selectedImages.length > 0 ? selectedImages : null
          })
          .eq('id', editingNotice.id)
        
        if (error) throw error
        alert('수정되었습니다!')
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([{
            user_id: user.id,
            type: 'notice',
            category: newNotice.category,
            title: newNotice.title,
            content: newNotice.content,
            images: selectedImages.length > 0 ? selectedImages : null
          }])
        
        if (error) throw error
        alert('공지가 작성되었습니다!')
      }
      
      setIsWriting(false)
      setEditingNotice(null)
      setNewNotice({ category: '공지', title: '', content: '' })
      setSelectedImages([])
      fetchNotices()
    } catch (error) {
      console.error('작성 실패:', error)
      alert('작성 실패: ' + error.message)
    } finally {
      setNoticeLoading(false)
    }
  }

  const handleNoticeEdit = (notice) => {
    setEditingNotice(notice)
    setNewNotice({
      category: notice.category,
      title: notice.title,
      content: notice.content
    })
    setSelectedImages(notice.images || [])
    setIsWriting(true)
  }

  const handleNoticeDelete = async (noticeId) => {
    if (!window.confirm('공지를 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', noticeId)
      
      if (error) throw error
      
      alert('삭제되었습니다!')
      fetchNotices()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 실패: ' + error.message)
    }
  }

  // 시간 표시 함수
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">관리자 페이지</h1>
            </div>
            <button
              onClick={() => navigate('/feed')}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>메인으로</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 사용자</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 게시물</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 댓글</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalComments}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('reports')}
            className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">신고 대기</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8 px-6 min-w-max">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveTab('notices')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notices'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                공지 관리
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'posts'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                게시물 관리
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'comments'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                댓글 관리
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1 ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>신고 관리</span>
                {stats.totalReports > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{stats.totalReports}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                사용자 관리
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 🆕 대시보드 - 사용자 통계 + 신규 가입현황 */}
            {activeTab === 'dashboard' && (
              <div>
                {/* 🆕 신규 가입 현황 */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <UserPlus className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-bold text-gray-900">🆕 신규 가입 현황</h2>
                  </div>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    {recentUsers.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">가입자가 없습니다</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        {recentUsers.map((user, index) => (
                          <div 
                            key={user.id}
                            className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {user.username?.[0] || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.username || '익명'}</p>
                                <p className="text-[10px] text-gray-500">
                                  {user.created_at ? getTimeAgo(user.created_at) : '최근'}
                                </p>
                              </div>
                              {index < 3 && (
                                <span className="text-lg">{index === 0 ? '🆕' : index === 1 ? '✨' : '👋'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 기간 필터 */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">📊 사용자 활동 통계</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStatsPeriod('all')
                        fetchUserStats('all')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        statsPeriod === 'all'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => {
                        setStatsPeriod('month')
                        fetchUserStats('month')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        statsPeriod === 'month'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      이번 달
                    </button>
                    <button
                      onClick={() => {
                        setStatsPeriod('week')
                        fetchUserStats('week')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        statsPeriod === 'week'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      이번 주
                    </button>
                    <button
                      onClick={() => {
                        setStatsPeriod('today')
                        fetchUserStats('today')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        statsPeriod === 'today'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      오늘
                    </button>
                  </div>
                </div>

                {/* TOP 랭킹 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* 게시물 TOP 5 */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <Trophy className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-gray-900">🏆 게시물 작성 TOP 5</h3>
                    </div>
                    <div className="space-y-3">
                      {userStats.topPosters.length === 0 ? (
                        <p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p>
                      ) : (
                        userStats.topPosters.map((user, index) => (
                          <div 
                            key={user.id} 
                            className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                              </span>
                              <div>
                              <p className="font-semibold text-gray-900">{user.username || '익명'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-teal-600">{user.postsCount}개</p>
                              {index < 3 && (
                                <p className="text-[10px] text-gray-500">🎁 포인트 {index === 0 ? 500 : index === 1 ? 300 : 200}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 댓글 TOP 5 */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">💬 댓글 작성 TOP 5</h3>
                    </div>
                    <div className="space-y-3">
                      {userStats.topCommenters.length === 0 ? (
                        <p className="text-sm text-gray-600 text-center py-4">데이터가 없습니다</p>
                      ) : (
                        userStats.topCommenters.map((user, index) => (
                          <div 
                            key={user.id} 
                            className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                              </span>
                              <div>
                              <p className="font-semibold text-gray-900">{user.username || '익명'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-purple-600">{user.commentsCount}개</p>
                              {index < 3 && (
                                <p className="text-[10px] text-gray-500">🎁 포인트 {index === 0 ? 300 : index === 1 ? 200 : 100}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 전체 사용자 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-900">📋 전체 사용자 통계</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">사용자명</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">게시물</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">댓글</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">좋아요</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userStats.allUsers
                          .sort((a, b) => b.postsCount - a.postsCount)
                          .map((user, index) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username || '익명'}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {user.postsCount}개
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {user.commentsCount}개
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                {user.likesCount}개
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* 공지 관리 */}
            {activeTab === 'notices' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">공지/이벤트 관리</h2>
                  <button
                    onClick={() => {
                      setIsWriting(true)
                      setEditingNotice(null)
                      setNewNotice({ category: '공지', title: '', content: '' })
                      setSelectedImages([])
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>공지 작성</span>
                  </button>
                </div>

                {/* 작성 폼 */}
                {isWriting && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-teal-200">
                    <form onSubmit={handleNoticeSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">카테고리</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewNotice({...newNotice, category: '공지'})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              newNotice.category === '공지' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            공지
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewNotice({...newNotice, category: '이벤트'})}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              newNotice.category === '이벤트' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            이벤트
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">제목 *</label>
                        <input
                          type="text"
                          required
                          value={newNotice.title}
                          onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                          placeholder="제목을 입력하세요"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">내용 *</label>
                        <textarea
                          required
                          value={newNotice.content}
                          onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                          placeholder="내용을 입력하세요"
                          rows="6"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">이미지</label>
                        <input
                          type="file"
                          id="notice-image-upload"
                          accept="image/*"
                          multiple
                          onChange={handleNoticeImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="notice-image-upload"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">이미지 추가</span>
                        </label>
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {selectedImages.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeNoticeImage(index)}
                                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsWriting(false)
                            setEditingNotice(null)
                            setNewNotice({ category: '공지', title: '', content: '' })
                            setSelectedImages([])
                          }}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={noticeLoading}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50"
                        >
                          {noticeLoading ? '작성 중...' : editingNotice ? '수정 완료' : '작성 완료'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 공지 목록 */}
                <div className="space-y-3">
                  {notices.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">작성된 공지가 없습니다</p>
                    </div>
                  ) : (
                    notices.map((notice) => (
                      <div key={notice.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                notice.category === '공지' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {notice.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(notice.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{notice.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                            {notice.images && notice.images.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {notice.images.slice(0, 3).map((img, i) => (
                                  <div key={i} className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {notice.images.length > 3 && (
                                  <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                    +{notice.images.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleNoticeEdit(notice)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleNoticeDelete(notice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* 🆕 게시물 관리 */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">📝 전체 게시물 관리</h2>
                  <div className="relative">
                    <input
                      type="text"
                      value={postsSearch}
                      onChange={(e) => {
                        setPostsSearch(e.target.value)
                        fetchAllPosts(0, e.target.value, true)
                      }}
                      placeholder="게시물 검색..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 게시물 목록 */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유형</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">제목</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allPosts.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                              게시물이 없습니다
                            </td>
                          </tr>
                        ) : (
                          allPosts.map((post, index) => (
                            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900">{postsPage * POSTS_PER_PAGE + index + 1}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' :
                                  post.type === 'share' ? 'bg-purple-100 text-purple-700' :
                                  post.type === 'job' ? 'bg-cyan-100 text-cyan-700' :
                                  post.type === 'talk' ? 'bg-orange-100 text-orange-700' :
                                  post.type === 'notice' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {post.category || post.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                {post.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{post.author}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => window.open(`/feed#post-${post.id}`, '_blank')}
                                    className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                    title="보기"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {allPosts.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => fetchAllPosts(postsPage - 1, postsSearch, true)}
                        disabled={postsPage === 0}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>이전</span>
                      </button>
                      <span className="text-sm text-gray-600">페이지 {postsPage + 1}</span>
                      <button
                        onClick={() => fetchAllPosts(postsPage + 1, postsSearch, false)}
                        disabled={!postsHasMore}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>다음</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 🆕 댓글 관리 */}
            {activeTab === 'comments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">💬 전체 댓글 관리</h2>
                  <div className="relative">
                    <input
                      type="text"
                      value={commentsSearch}
                      onChange={(e) => {
                        setCommentsSearch(e.target.value)
                        fetchAllComments(0, e.target.value, true)
                      }}
                      placeholder="댓글 검색..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">번호</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">게시물</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">댓글 내용</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성자</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작성일</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allComments.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                              댓글이 없습니다
                            </td>
                          </tr>
                        ) : (
                          allComments.map((comment, index) => (
                            <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-900">{commentsPage * COMMENTS_PER_PAGE + index + 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                                {comment.posts?.title || '삭제된 게시물'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                {comment.content}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{comment.author}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {comment.posts?.id && (
                                    <button
                                      onClick={() => window.open(`/feed#post-${comment.posts.id}`, '_blank')}
                                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                      title="게시물 보기"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {allComments.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => fetchAllComments(commentsPage - 1, commentsSearch, true)}
                        disabled={commentsPage === 0}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>이전</span>
                      </button>
                      <span className="text-sm text-gray-600">페이지 {commentsPage + 1}</span>
                      <button
                        onClick={() => fetchAllComments(commentsPage + 1, commentsSearch, false)}
                        disabled={!commentsHasMore}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>다음</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 신고 관리 */}
            {activeTab === 'reports' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">🚨 신고 관리</h2>
                  <button
                    onClick={fetchReports}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    새로고침
                  </button>
                </div>

                {reportsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">신고된 게시물이 없습니다</p>
                    <p className="text-sm text-gray-500 mt-1">깨끗한 커뮤니티 유지 중! 👍</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div 
                        key={report.id} 
                        className="bg-white border-2 border-red-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 신고 정보 */}
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                {report.reason}
                              </span>
                              <span className="text-xs text-gray-500">
                                신고자: {report.reporter}
                              </span>
                              <span className="text-xs text-gray-400">
                                {getTimeAgo(report.created_at)}
                              </span>
                            </div>

                            {/* 게시물 정보 */}
                            {report.posts ? (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-xs text-gray-500">작성자: {report.postAuthor}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{report.posts.title}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{report.posts.content}</p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                삭제된 게시물입니다
                              </div>
                            )}
                          </div>

                          {/* 관리 버튼 */}
                          <div className="flex flex-col gap-2 ml-4">
                            {report.posts && (
                              <>
                                <button
                                  onClick={() => window.open(`/feed#post-${report.posts.id}`, '_blank')}
                                  className="flex items-center space-x-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>보기</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteReportedPost(report.id, report.posts.id)}
                                  className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>삭제</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDismissReport(report.id)}
                              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>무시</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* 사용자 관리 */}
            {activeTab === 'users' && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">사용자 관리 기능은 곧 추가됩니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}