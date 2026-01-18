import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Camera, ArrowLeft, Save, FileText, MessageCircle, Briefcase, MoreVertical, Edit2, Trash2, X, Image as ImageIcon, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  })

  // 🆕 탭 관련 State
  const [activeTab, setActiveTab] = useState('profile')
  const [myPosts, setMyPosts] = useState([])
  const [myComments, setMyComments] = useState([])
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
    }
  }, [activeTab, applicationSubTab, user])

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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">돌아가기</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 🆕 탭 메뉴 */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 min-w-[100px] px-4 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                프로필수정
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-[100px] px-4 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'posts'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                내 글
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 min-w-[100px] px-4 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'comments'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                내 댓글
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 min-w-[100px] px-4 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'applications'
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                지원
              </button>
            </div>
          </div>

          {/* 🆕 탭 콘텐츠 */}
          <div className="p-6 md:p-8">
            {/* 프로필수정 탭 */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {formData.username?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">가입일: {new Date(user?.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold mb-2">사용자 이름 *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="사용자 이름을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
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
                    onClick={() => navigate('/feed')}
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

                {/* 🆕 1:1 문의 */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => window.open('https://open.kakao.com/o/sNlIAtbi', '_blank')}
                    className="w-full px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-gray-900 rounded-lg font-semibold transition-colors border-2 border-yellow-200 flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-5 h-5 text-yellow-600" />
                    <span>1:1 문의 (카카오톡)</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('로그아웃 하시겠습니까?')) {
                        await signOut()
                        window.location.href = '/'
                      }
                    }}
                    className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </form>
            )}

            {/* 내 글 탭 */}
            {activeTab === 'posts' && (
              <div className="space-y-3">
                {myPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">작성한 게시물이 없습니다</p>
                  </div>
                ) : (
                  myPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
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
                          
                          {/* 🆕 점 3개 메뉴 */}
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
            )}

            {/* 내 댓글 탭 - 🆕 점 3개 메뉴 추가 */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                {myComments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">작성한 댓글이 없습니다</p>
                  </div>
                ) : (
                  myComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
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
                          
                          {/* 🆕 댓글 점 3개 메뉴 */}
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
            )}

            {/* 지원 탭 */}
            {activeTab === 'applications' && (
              <div>
                {/* 서브탭 */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setApplicationSubTab('received')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      applicationSubTab === 'received'
                        ? 'text-teal-600 border-b-2 border-teal-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    받은 지원
                  </button>
                  <button
                    onClick={() => setApplicationSubTab('sent')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      applicationSubTab === 'sent'
                        ? 'text-teal-600 border-b-2 border-teal-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    내가 지원한 내역
                  </button>
                </div>

                {/* 받은 지원 */}
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
                          className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all"
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

                {/* 내가 지원한 내역 */}
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
                          className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
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
            )}
          </div>
        </div>
      </div>

      {/* 🆕 게시물 수정 모달 */}
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