import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  TrendingUp, Search, Bell, User, Plus, 
  Flame, ThumbsUp, MessageCircle, Bookmark,
  Clock, MapPin, DollarSign, Tag, X, Image as ImageIcon, Link as LinkIcon,
  Home, Briefcase, Menu, MoreVertical, Edit2, Trash2  // 추가
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Feed() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
const [selectedImages, setSelectedImages] = useState([])
const [openMenuId, setOpenMenuId] = useState(null) // 추가
const [posts, setPosts] = useState([])  // 빈 배열로 변경
    
 
  const [loading, setLoading] = useState(false)
  
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
    }
  }, [user])

  const fetchPosts = async () => {
    console.log('1. fetchPosts 시작')
    console.log('2. 현재 user:', user)
    
    try {
      console.log('3. Supabase 쿼리 시작')
      
      setTimeout(() => console.log('3.5. 1초 후'), 1000)
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('4. 쿼리 완료 - data:', data)
      console.log('5. 쿼리 완료 - error:', error)
      
      if (error) throw error
      
      const transformed = data?.map(post => ({
        ...post,
        author: '사용자',
        authorRole: '회원',
        timeAgo: '방금 전'
      })) || []
      
      console.log('6. 변환 완료:', transformed)
      setPosts(transformed)
      setLoading(false)
    } catch (error) {
      console.error('7. 에러 발생:', error)
      setLoading(false)
    }
  }

  // 시간 계산 함수
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

  // 필터링된 게시물 (이제 서버에서 필터링하므로 불필요하지만 호환성 유지)
  const filteredPosts = posts

  // 이미지 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const imageUrls = files.map(file => URL.createObjectURL(file))
    setSelectedImages([...selectedImages, ...imageUrls])
  }

  // 이미지 제거
  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  // 게시물 작성 제출
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
        // 수정 모드
        const { error } = await supabase
          .from('posts')
          .update({
            type: newPost.type,
            category: newPost.category || (newPost.type === 'hotdeal' ? '온라인' : '단기알바'),
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
        // 작성 모드
        const { error } = await supabase
          .from('posts')
          .insert([
            {
              user_id: user.id,
              type: newPost.type,
              category: newPost.category || (newPost.type === 'hotdeal' ? '온라인' : '단기알바'),
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
      
      // 초기화
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
      
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
      alert('실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  } // <- handleSubmit 닫기
  
  // 게시물 삭제 (handleSubmit 밖으로!)
  const handleDelete = async (postId) => {
  if (!window.confirm('게시물을 삭제하시겠습니까?')) return
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    if (error) throw error
    
    alert('삭제되었습니다!')
    fetchPosts()
  } catch (error) {
    console.error('삭제 실패:', error)
    alert('삭제 실패: ' + error.message)
  }
}

// 게시물 수정 모달 열기
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
  return (
    <div className="min-h-screen pb-24 md:pb-20">
      {/* Navigation - Desktop */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            {/* Left: Logo + Slogan */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">동네문화</span>
              </Link>
              <span className="hidden md:block text-sm text-gray-600">아끼고 나누는 우리 동네 문화</span>
            </div>

            {/* Right: Menu + Actions */}
            <div className="flex items-center space-x-2">
              {/* Desktop Menu Tabs */}
              <div className="hidden md:flex items-center space-x-1 mr-2">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'all' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  전체
                </button>
                <button 
                  onClick={() => setActiveTab('hotdeal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'hotdeal' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  핫딜
                </button>
                <button 
                  onClick={() => setActiveTab('job')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'job' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  알바
                </button>
              </div>

              {/* Search - Desktop */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="검색..."
                  className="w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 transition-colors bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Mobile Search Button */}
              <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Search className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Notification */}
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              </button>
              
              {/* User Profile - Desktop only */}
              <button 
                onClick={async () => {
                  if (window.confirm('로그아웃 하시겠습니까?')) {
                    await signOut()
                    navigate('/login')
                  }
                }}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {profile?.username?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-700">{profile?.username || '사용자'}</span>
              </button>

              {/* Write Button - Desktop */}
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
          {/* Left Sidebar - Desktop only */}
          <aside className="hidden lg:block w-56 space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
              <h3 className="font-bold text-sm mb-3 text-gray-900">트렌딩 토픽</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs cursor-pointer hover:text-teal-600 transition-colors">
                  <Flame className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-gray-700">#블랙프라이데이</span>
                </div>
                <div className="flex items-center space-x-2 text-xs cursor-pointer hover:text-teal-600 transition-colors">
                  <Flame className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-gray-700">#연말알바</span>
                </div>
                <div className="flex items-center space-x-2 text-xs cursor-pointer hover:text-teal-600 transition-colors">
                  <Flame className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-gray-700">#IT기기할인</span>
                </div>
                <div className="flex items-center space-x-2 text-xs cursor-pointer hover:text-teal-600 transition-colors">
                  <Flame className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-gray-700">#무료강의</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Feed */}
          <main className="flex-1">
            <div 
              onClick={() => setIsWriteModalOpen(true)}
              className="mb-4 bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-teal-300 transition-colors"
            >
              <p className="text-sm text-gray-600">
                로그를 작성해보세요. 이번 주엔 어떤 관심으로 있나요?
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-10">
                <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
              </div>
            )}

            {/* Posts */}
            {!loading && (
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
                    <p className="text-gray-500">게시물이 없습니다.</p>
                    <p className="text-sm text-gray-400 mt-1">첫 번째 게시물을 작성해보세요!</p>
                  </div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <article 
                      key={post.id}
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
      : 'bg-cyan-100 text-cyan-700'
  }`}>
    {post.category}
  </span>
  
  {/* 본인 게시물일 때만 메뉴 표시 */}
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
                        <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                      </div>

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className={`mb-3 grid gap-2 ${
                          post.images.length === 1 ? 'grid-cols-1' : 
                          post.images.length === 2 ? 'grid-cols-2' : 
                          'grid-cols-2'
                        }`}>
                          {post.images.slice(0, 4).map((img, i) => (
                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                              <img src={img} alt="" className="w-full h-full object-cover" />
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
                          <div className="flex items-center space-x-1 px-2 py-1 bg-cyan-50 rounded-md text-cyan-700 text-xs font-semibold border border-cyan-200">
                            <DollarSign className="w-3 h-3" />
                            <span>시급 {post.hourly_pay}</span>
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
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-5 text-gray-500">
                        <button className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.comments_count}</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors ml-auto">
                          <Bookmark className="w-4 h-4" />
                          <span className="text-xs font-medium">{post.bookmarks_count}</span>
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </main>

          {/* Right Sidebar - Desktop only */}
          <aside className="hidden xl:block w-64 space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
              <h3 className="font-bold text-sm mb-3 text-gray-900">인기 급상승 🔥</h3>
              <div className="space-y-3">
                <div className="border-l-2 border-teal-500 pl-2.5">
                  <h4 className="font-semibold text-xs mb-0.5 text-gray-900">콜라뷰티 CollaBeauty</h4>
                  <p className="text-[11px] text-gray-600">새로 나온</p>
                </div>
                <div className="border-l-2 border-cyan-500 pl-2.5">
                  <h4 className="font-semibold text-xs mb-0.5 text-gray-900">ModelContext.Cloud</h4>
                  <p className="text-[11px] text-gray-600">새로 나온</p>
                </div>
                <div className="border-l-2 border-teal-400 pl-2.5">
                  <h4 className="font-semibold text-xs mb-0.5 text-gray-900">뉴트리로직 NutriLogic</h4>
                  <p className="text-[11px] text-gray-600">새로 나온</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-sm mb-3 text-gray-900">추천 멤버</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full"></div>
                    <div>
                      <p className="text-xs font-semibold">Digitalog Social</p>
                      <p className="text-[10px] text-gray-500">#디지털마케팅</p>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 bg-teal-500 text-white text-[11px] rounded-md font-medium hover-lift">
                    팔로우
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
              activeTab === 'all' ? 'text-teal-600' : 'text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">전체</span>
          </button>

          <button 
            onClick={() => setActiveTab('hotdeal')}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
              activeTab === 'hotdeal' ? 'text-teal-600' : 'text-gray-600'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">핫딜</span>
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
            onClick={() => setActiveTab('job')}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
              activeTab === 'job' ? 'text-teal-600' : 'text-gray-600'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-medium">알바</span>
          </button>

          <button 
            onClick={async () => {
              if (window.confirm('로그아웃 하시겠습니까?')) {
                await signOut()
                navigate('/login')
              }
            }}
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
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">카테고리</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPost({...newPost, type: 'hotdeal'})}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === 'hotdeal'
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    핫딜
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPost({...newPost, type: 'job'})}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newPost.type === 'job'
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    알바
                  </button>
                </div>
              </div>

              {/* Title */}
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

              {/* Content */}
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
                
                {/* Image Upload Button */}
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

              {/* Image Preview */}
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

              {/* Conditional Fields */}
              {newPost.type === 'hotdeal' ? (
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
              ) : (
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

              {/* Location */}
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

              {/* Tags */}
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

              {/* Submit Button */}
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
    </div>
  )
}