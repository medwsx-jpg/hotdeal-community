import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    Search, Plus, MapPin, Clock, Heart, MessageCircle,
    Home, Target, Gift, User, X, ChevronDown,
    Image as ImageIcon, Tag
  } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Market() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('all')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [likedProducts, setLikedProducts] = useState(new Set())
  const PRODUCTS_PER_PAGE = 20

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    sale_type: 'fixed',
    condition: '사용감있음',
    location: '',
    category: '',
    // 경매 전용
    auction_hours: '24',
    bid_increment: '500'
  })

  useEffect(() => {
    fetchProducts(0, '', true)
    if (user) {
      checkLikes()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const handleScroll = () => {
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500
      if (bottom && !loading && hasMore) {
        fetchProducts(page, searchQuery)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page, loading, hasMore, searchQuery, user])

  const fetchProducts = async (pageNum = 0, search = '', reset = false) => {
    if (loading || (!hasMore && !reset)) return

    try {
      setLoading(true)
      const start = pageNum * PRODUCTS_PER_PAGE
      const end = start + PRODUCTS_PER_PAGE - 1

      let query = supabase
        .from('market_products')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)

      // 탭 필터
      if (activeTab === 'fixed') {
        query = query.eq('sale_type', 'fixed')
      } else if (activeTab === 'auction') {
        query = query.eq('sale_type', 'auction')
      } else if (activeTab === 'free') {
        query = query.eq('sale_type', 'free')
      }

      // 검색
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        if (pageNum === 0 || reset) setProducts([])
        setHasMore(false)
        setLoading(false)
        return
      }

      // 작성자 정보 가져오기
      const userIds = [...new Set(data.map(p => p.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const profilesMap = {}
      profilesData?.forEach(p => { profilesMap[p.id] = p })

      // 경매 상품의 경매 정보 가져오기
      const auctionProductIds = data.filter(p => p.sale_type === 'auction').map(p => p.id)
      let auctionsMap = {}
      
      if (auctionProductIds.length > 0) {
        const { data: auctionsData } = await supabase
          .from('auctions')
          .select('*')
          .in('product_id', auctionProductIds)

        auctionsData?.forEach(a => { auctionsMap[a.product_id] = a })
      }

      const productsWithData = data.map(product => ({
        ...product,
        author: profilesMap[product.user_id]?.username || '사용자',
        auction: auctionsMap[product.id] || null,
        timeAgo: getTimeAgo(product.created_at)
      }))

      if (pageNum === 0 || reset) {
        setProducts(productsWithData)
      } else {
        setProducts(prev => [...prev, ...productsWithData])
      }

      setHasMore(data.length >= PRODUCTS_PER_PAGE)
      setPage(pageNum + 1)
    } catch (error) {
      console.error('상품 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLikes = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('market_likes')
        .select('product_id')
        .eq('user_id', user.id)
      setLikedProducts(new Set(data?.map(l => l.product_id) || []))
    } catch (error) {
      console.error('좋아요 확인 실패:', error)
    }
  }

  const handleLike = async (productId) => {
    if (!user) {
      navigate('/login')
      return
    }

    const isLiked = likedProducts.has(productId)

    // 즉시 UI 반영
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
      }
      return p
    }))

    if (isLiked) {
      setLikedProducts(prev => { const s = new Set(prev); s.delete(productId); return s })
      await supabase.from('market_likes').delete().eq('product_id', productId).eq('user_id', user.id)
    } else {
      setLikedProducts(prev => new Set(prev).add(productId))
      await supabase.from('market_likes').insert([{ user_id: user.id, product_id: productId }])
    }
  }

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    try {
      setLoading(true)
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/market/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(filePath, file)
          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
          return data.publicUrl
        })
      )
      setSelectedImages([...selectedImages, ...uploadedUrls])
    } catch (error) {
      alert('이미지 업로드 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!newProduct.title.trim()) { alert('제목을 입력해주세요.'); return }

    try {
      setLoading(true)

      const priceValue = newProduct.sale_type === 'free' ? 0 : parseInt(newProduct.price.replace(/,/g, '')) || 0

      // 1. 상품 등록
      const { data: productData, error: productError } = await supabase
        .from('market_products')
        .insert([{
          user_id: user.id,
          title: newProduct.title,
          description: newProduct.description,
          images: selectedImages.length > 0 ? selectedImages : null,
          price: priceValue,
          sale_type: newProduct.sale_type,
          condition: newProduct.condition,
          location: newProduct.location,
          category: newProduct.category,
          status: 'selling'
        }])
        .select()
        .single()

      if (productError) throw productError

      // 2. 경매인 경우 auctions 테이블에도 등록
      if (newProduct.sale_type === 'auction') {
        const hours = parseInt(newProduct.auction_hours) || 24
        const endTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        const bidIncrement = parseInt(newProduct.bid_increment) || 500

        const { error: auctionError } = await supabase
          .from('auctions')
          .insert([{
            product_id: productData.id,
            starting_price: priceValue,
            current_price: priceValue,
            bid_increment: bidIncrement,
            end_time: endTime,
            original_end_time: endTime,
            status: 'active'
          }])

        if (auctionError) throw auctionError
      }

      alert('상품이 등록되었습니다!')
      setShowWriteModal(false)
      setSelectedImages([])
      setNewProduct({
        title: '', description: '', price: '', sale_type: 'fixed',
        condition: '사용감있음', location: '', category: '',
        auction_hours: '24', bid_increment: '500'
      })
      setProducts([])
      setPage(0)
      setHasMore(true)
      fetchProducts(0, '', true)
    } catch (error) {
      alert('등록 실패: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setProducts([])
    setPage(0)
    setHasMore(true)
    fetchProducts(0, e.target.value, true)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setProducts([])
    setPage(0)
    setHasMore(true)
    // 탭 변경 후 fetch는 별도 호출
    setTimeout(() => fetchProducts(0, searchQuery, true), 0)
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const t = new Date(timestamp)
    const diffMs = now - t
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  const getTimeRemaining = (endTime) => {
    const now = new Date()
    const end = new Date(endTime)
    const diff = end - now
    if (diff <= 0) return '종료'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}일 ${hours % 24}시간`
    if (hours > 0) return `${hours}시간 ${mins}분`
    return `${mins}분`
  }

  const formatPrice = (num) => {
    if (!num && num !== 0) return ''
    return Number(num).toLocaleString()
  }

  const statusLabel = (status) => {
    if (status === 'reserved') return { text: '예약중', color: 'bg-green-100 text-green-700' }
    if (status === 'sold') return { text: '거래완료', color: 'bg-gray-200 text-gray-600' }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
      {/* 상단 네비 */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <button onClick={() => navigate('/feed')} className="flex items-center space-x-2">
                <img src="/logo.png" alt="UDT79" className="w-8 h-8 object-contain" />
                <span className="text-lg font-bold gradient-text">마켓</span>
              </button>
            </div>
            <div className="relative flex-1 max-w-xs ml-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="물건 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 bg-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setProducts([]); setPage(0); setHasMore(true); fetchProducts(0, '', true) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-16">
        {/* 탭 메뉴 (당근마켓 스타일) */}
        <div className="flex gap-2 mb-4 overflow-x-auto py-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'fixed', label: '중고거래' },
            { key: 'auction', label: '경매' },
            { key: 'free', label: '나눔' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? tab.key === 'auction' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.key === 'auction' && '🔨 '}{tab.label}
            </button>
          ))}
        </div>

        {/* 상품 목록 (당근마켓 스타일) */}
        <div className="space-y-0">
          {products.length === 0 && !loading ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 text-lg mb-2">등록된 상품이 없습니다</p>
              <p className="text-sm text-gray-400">첫 번째 상품을 등록해보세요!</p>
            </div>
          ) : (
            products.map((product) => {
              const label = statusLabel(product.status)
              return (
                <div
                  key={product.id}
                  className="flex gap-4 p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (product.sale_type === 'auction') {
                      navigate(`/market/auction/${product.id}`)
                    } else {
                      alert('상세 페이지 준비 중입니다.')
                    }
                  }}
                >
                  {/* 썸네일 */}
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    {label && (
                      <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${label.color}`}>
                        {label.text}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 truncate">{product.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.location && `${product.location} · `}{product.timeAgo}
                    </p>

                    {/* 가격 영역 */}
                    {product.sale_type === 'auction' && product.auction ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">경매</span>
                          <span className="font-bold text-lg text-orange-600">
                            {formatPrice(product.auction.current_price)}원
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeRemaining(product.auction.end_time)} 남음</span>
                          <span>· 입찰 {product.auction.bid_count}회</span>
                        </div>
                      </div>
                    ) : product.sale_type === 'free' ? (
                      <p className="mt-2 font-bold text-lg text-green-600">나눔 🧡</p>
                    ) : (
                      <p className="mt-2 font-bold text-lg text-gray-900">
                        {formatPrice(product.price)}원
                      </p>
                    )}

                    {/* 하단 아이콘 */}
                    <div className="flex items-center justify-end gap-3 mt-2 text-gray-400">
                      {product.chat_count > 0 && (
                        <span className="flex items-center gap-0.5 text-xs">
                          <MessageCircle className="w-3.5 h-3.5" />{product.chat_count}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(product.id) }}
                        className={`flex items-center gap-0.5 text-xs ${likedProducts.has(product.id) ? 'text-red-500' : ''}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedProducts.has(product.id) ? 'fill-current' : ''}`} />
                        {product.likes_count > 0 && product.likes_count}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 mt-2">불러오는 중...</p>
            </div>
          )}
        </div>
      </div>

      {/* 글쓰기 FAB (당근마켓 스타일) */}
      {user && (
        <button
          onClick={() => setShowWriteModal(true)}
          className="fixed bottom-24 md:bottom-24 right-4 z-40 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center space-x-2 font-semibold text-sm transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>글쓰기</span>
        </button>
      )}

      {/* 상품 등록 모달 */}
      {showWriteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">상품 등록</h2>
              <button onClick={() => { setShowWriteModal(false); setSelectedImages([]) }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* 판매 유형 */}
              <div>
                <label className="block text-sm font-semibold mb-2">판매 유형 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'fixed', label: '중고거래', icon: '💰' },
                    { key: 'auction', label: '경매', icon: '🔨' },
                    { key: 'free', label: '나눔', icon: '🧡' }
                  ].map(type => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setNewProduct({ ...newProduct, sale_type: type.key })}
                      className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        newProduct.sale_type === type.key
                          ? type.key === 'auction'
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-teal-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xl mb-1">{type.icon}</div>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 이미지 */}
              <div>
                <label className="block text-sm font-semibold mb-2">사진</label>
                <div className="flex gap-2 overflow-x-auto">
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mt-1">{selectedImages.length}/10</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                  {selectedImages.map((img, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImages(selectedImages.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold mb-2">제목 *</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="상품명을 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* 가격 (나눔이 아닌 경우) */}
              {newProduct.sale_type !== 'free' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {newProduct.sale_type === 'auction' ? '시작가 *' : '가격 *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={newProduct.price}
                      onChange={(e) => {
                        const num = e.target.value.replace(/[^0-9]/g, '')
                        setNewProduct({ ...newProduct, price: num ? Number(num).toLocaleString() : '' })
                      }}
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 pr-8"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                  </div>
                </div>
              )}

              {/* 경매 전용 설정 */}
              {newProduct.sale_type === 'auction' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-orange-800 flex items-center gap-1.5">
                  🔨 경매 설정
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-orange-700 mb-1">경매 시간</label>
                    <select
                      value={newProduct.auction_hours}
                      onChange={(e) => setNewProduct({ ...newProduct, auction_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="6">6시간</option>
                      <option value="12">12시간</option>
                      <option value="24">24시간</option>
                      <option value="48">48시간</option>
                      <option value="72">3일</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-700 mb-1">최소 입찰 단위</label>
                    <select
                      value={newProduct.bid_increment}
                      onChange={(e) => setNewProduct({ ...newProduct, bid_increment: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="500">500원</option>
                      <option value="1000">1,000원</option>
                      <option value="5000">5,000원</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-orange-600">
                    💡 마감 2분 이내 입찰 시 자동으로 2분 연장됩니다
                  </p>
                </div>
              )}

              {/* 상품 상태 */}
              {newProduct.sale_type !== 'free' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">상품 상태</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['새상품', '거의새것', '사용감있음'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, condition: c })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          newProduct.condition === c ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 설명 */}
              <div>
                <label className="block text-sm font-semibold mb-2">설명</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="상품에 대해 설명해주세요"
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* 위치 */}
              <div>
                <label className="block text-sm font-semibold mb-2">거래 희망 장소</label>
                <input
                  type="text"
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                  placeholder="예: 천안역 앞"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowWriteModal(false); setSelectedImages([]) }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 ${
                    newProduct.sale_type === 'auction'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                      : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/30'
                  }`}
                >
                  {loading ? '등록 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 하단 네비 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          <button onClick={() => navigate('/feed')} className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button onClick={() => navigate('/challenge')} className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600">
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium">챌린지</span>
          </button>
          <button onClick={() => navigate('/feed')} className="flex flex-col items-center justify-center flex-1 h-full -mt-8">
            <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>
          <button className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-orange-600">
            <Tag className="w-5 h-5" />
            <span className="text-[10px] font-medium font-bold">마켓</span>
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">MY</span>
          </button>
        </div>
      </nav>
    </div>
  )
}