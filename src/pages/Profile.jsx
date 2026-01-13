import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Camera, ArrowLeft, Save, FileText, MessageCircle, Briefcase } from 'lucide-react'
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

  // 🆕 받은 지원 내역
  const fetchReceivedApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          posts!inner (
            id,
            title,
            user_id
          ),
          profiles (
            username
          )
        `)
        .eq('posts.user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReceivedApplications(data || [])
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

                {/* Logout */}
                <div className="pt-6 border-t border-gray-200">
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
                      onClick={() => navigate(`/feed#post-${post.id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{post.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          post.type === 'hotdeal' ? 'bg-teal-100 text-teal-700' :
                          post.type === 'share' ? 'bg-purple-100 text-purple-700' :
                          post.type === 'job' ? 'bg-cyan-100 text-cyan-700' :
                          post.type === 'talk' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {post.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👍 {post.likes_count || 0}</span>
                        <span>💬 {post.comments_count || 0}</span>
                        <span className="ml-auto">{getTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 내 댓글 탭 */}
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
                      onClick={() => navigate(`/feed#post-${comment.posts.id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">
                          게시물: <span className="font-semibold text-gray-700">{comment.posts.title}</span>
                        </p>
                        <span className="text-xs text-gray-400">{getTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-900">{comment.content}</p>
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
                              <p className="text-xs text-gray-500 mb-1">게시물: {app.posts.title}</p>
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
    </div>
  )
}