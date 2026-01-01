import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, FileText, MessageSquare, AlertTriangle, 
  TrendingUp, BarChart3, Shield, Home, Bell, Plus, X, Image as ImageIcon, Edit2, Trash2
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
  }, [user, profile, navigate])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      const [users, posts, comments] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true })
      ])
      
      setStats({
        totalUsers: users.count || 0,
        totalPosts: posts.count || 0,
        totalComments: comments.count || 0,
        totalReports: 0
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
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

  if (loading) {
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

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">신고 대기</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveTab('notices')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notices'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                공지 관리
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                게시물 관리
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                사용자 관리
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                댓글 관리
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 대시보드 */}
            {activeTab === 'dashboard' && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">통계 차트는 곧 추가됩니다</p>
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
            
            {/* 게시물 관리 */}
            {activeTab === 'posts' && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">게시물 관리 기능은 곧 추가됩니다</p>
              </div>
            )}
            
            {/* 사용자 관리 */}
            {activeTab === 'users' && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">사용자 관리 기능은 곧 추가됩니다</p>
              </div>
            )}
            
            {/* 댓글 관리 */}
            {activeTab === 'comments' && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">댓글 관리 기능은 곧 추가됩니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}