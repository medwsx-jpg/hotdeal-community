import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Clock, Heart, User, MapPin,
  ChevronUp, ChevronDown, AlertCircle, X,
  Home, Target, Plus, Tag, Image as ImageIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AuctionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [product, setProduct] = useState(null)
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [timeUrgent, setTimeUrgent] = useState(false)
  const [showBidHistory, setShowBidHistory] = useState(true)
  const [liked, setLiked] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  const [seller, setSeller] = useState(null)
  const [error, setError] = useState('')

  // 데이터 로드
  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchBids()
    }
  }, [id])

  // 좋아요 체크
  useEffect(() => {
    if (user && id) checkLike()
  }, [user, id])

  // 실시간 입찰 구독
  useEffect(() => {
    if (!auction) return

    const channel = supabase
      .channel(`auction-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `auction_id=eq.${auction.id}`
      }, (payload) => {
        // 새 입찰이 들어오면 경매 정보 + 입찰 목록 갱신
        fetchAuction()
        fetchBids()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auction.id}`
      }, (payload) => {
        setAuction(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auction?.id])

  // 카운트다운 타이머
  useEffect(() => {
    if (!auction || auction.status !== 'active') return

    const timer = setInterval(() => {
      const now = new Date()
      const end = new Date(auction.end_time)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('경매 종료')
        setTimeUrgent(false)
        clearInterval(timer)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}일 ${hours % 24}시간 ${mins}분`)
        setTimeUrgent(false)
      } else if (hours > 0) {
        setTimeLeft(`${hours}시간 ${mins}분 ${secs}초`)
        setTimeUrgent(false)
      } else if (mins > 2) {
        setTimeLeft(`${mins}분 ${secs}초`)
        setTimeUrgent(false)
      } else {
        setTimeLeft(`${mins}분 ${secs}초`)
        setTimeUrgent(true) // 2분 이내 → 긴급 표시
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [auction?.end_time, auction?.status])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('market_products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProduct(data)

      // 판매자 정보
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('id, username, consecutive_days, role')
        .eq('id', data.user_id)
        .single()
      setSeller(sellerData)

      // 경매 정보
      await fetchAuction()

      // 조회수 증가
      await supabase
        .from('market_products')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)

    } catch (error) {
      console.error('상품 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuction = async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('product_id', id)
      .single()
    if (data) setAuction(data)
  }

  const fetchBids = async () => {
    if (!id) return
    // product_id로 auction을 먼저 찾고 bids 조회
    const { data: auctionData } = await supabase
      .from('auctions')
      .select('id')
      .eq('product_id', id)
      .single()

    if (!auctionData) return

    const { data } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionData.id)
      .is('cancelled_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data) return

    // 입찰자 정보 가져오기
    const userIds = [...new Set(data.map(b => b.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.id] = p })

    setBids(data.map(b => ({
      ...b,
      bidder: profileMap[b.user_id]?.username || '사용자',
      timeAgo: getTimeAgo(b.created_at)
    })))
  }

  const checkLike = async () => {
    const { data } = await supabase
      .from('market_likes')
      .select('id')
      .eq('product_id', id)
      .eq('user_id', user.id)
      .single()
    setLiked(!!data)
  }

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    if (liked) {
      await supabase.from('market_likes').delete().eq('product_id', id).eq('user_id', user.id)
      setLiked(false)
    } else {
      await supabase.from('market_likes').insert([{ product_id: id, user_id: user.id }])
      setLiked(true)
    }
  }

  const handleBid = async () => {
    if (!user) { navigate('/login'); return }
    if (!auction || auction.status !== 'active') {
      setError('경매가 종료되었습니다.')
      return
    }

    const amount = parseInt(bidAmount.replace(/,/g, ''))
    if (!amount || isNaN(amount)) {
      setError('입찰 금액을 입력해주세요.')
      return
    }

    const minBid = auction.current_price + auction.bid_increment
    if (amount < minBid) {
      setError(`최소 입찰가는 ${minBid.toLocaleString()}원입니다.`)
      return
    }

    // 본인 상품에 입찰 방지
    if (product.user_id === user.id) {
      setError('본인 상품에는 입찰할 수 없습니다.')
      return
    }

    // 현재 최고 입찰자가 본인이면 방지
    if (auction.current_bidder_id === user.id) {
      setError('이미 최고 입찰자입니다.')
      return
    }

    try {
      setBidding(true)
      setError('')

      const { error: bidError } = await supabase
        .from('bids')
        .insert([{
          auction_id: auction.id,
          user_id: user.id,
          amount: amount
        }])

      if (bidError) throw bidError

      setBidAmount('')
      // 실시간 구독으로 자동 갱신되지만, 즉시 반영도 해줌
      await fetchAuction()
      await fetchBids()
    } catch (error) {
      setError('입찰 실패: ' + error.message)
    } finally {
      setBidding(false)
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const t = new Date(timestamp)
    const diffMs = now - t
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${Math.floor(diffHours / 24)}일 전`
  }

  const formatPrice = (num) => {
    if (!num && num !== 0) return '0'
    return Number(num).toLocaleString()
  }

  const isEnded = auction?.status !== 'active' || (auction?.end_time && new Date(auction.end_time) <= new Date())
  const isWinner = isEnded && auction?.current_bidder_id === user?.id
  const isSeller = product?.user_id === user?.id

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-3">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!product || !auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">상품을 찾을 수 없습니다</p>
          <button onClick={() => navigate('/market')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">
            마켓으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* 상단 헤더 */}
      <nav className="fixed top-0 w-full bg-white z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <button onClick={() => navigate('/market')} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base truncate flex-1 mx-4">경매 상세</h1>
          <button onClick={handleLike} className={`p-2 -mr-2 rounded-lg ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto pt-14">
        {/* 이미지 슬라이더 */}
        {product.images && product.images.length > 0 ? (
          <div className="relative bg-gray-100 aspect-square">
            <img
              src={product.images[currentImageIndex]}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowGallery(true)}
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full">
                  <span className="text-white text-xs">{currentImageIndex + 1} / {product.images.length}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 aspect-square flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* 경매 상태 카드 */}
        <div className={`mx-4 -mt-6 relative z-10 rounded-2xl shadow-lg p-5 ${
          isEnded 
            ? 'bg-gray-100 border border-gray-300' 
            : timeUrgent 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
        }`}>
          {/* 상태 표시 */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isEnded ? 'bg-gray-300 text-gray-600' : 'bg-white/20 text-white'
            }`}>
              {isEnded ? '경매 종료' : timeUrgent ? '마감 임박!' : '경매 진행중'}
            </span>
            {auction.is_extended && !isEnded && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium">
                ⏰ 연장됨
              </span>
            )}
          </div>

          {/* 현재가 */}
          <div className="mb-3">
            <p className={`text-xs ${isEnded ? 'text-gray-500' : 'text-white/80'}`}>
              {isEnded ? '최종 낙찰가' : '현재 입찰가'}
            </p>
            <p className={`text-3xl font-black ${isEnded ? 'text-gray-700' : 'text-white'}`}>
              {formatPrice(auction.current_price)}원
            </p>
          </div>

          {/* 타이머 + 입찰수 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isEnded ? 'text-gray-400' : 'text-white/80'}`} />
              <span className={`text-sm font-semibold ${
                isEnded ? 'text-gray-500' :
                timeUrgent ? 'text-white animate-pulse' : 'text-white'
              }`}>
                {isEnded ? '종료' : timeLeft}
              </span>
            </div>
            <span className={`text-sm ${isEnded ? 'text-gray-500' : 'text-white/80'}`}>
              입찰 {auction.bid_count}회
            </span>
          </div>

          {/* 낙찰자 표시 */}
          {isEnded && auction.current_bidder_id && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              {isWinner ? (
                <p className="text-green-600 font-bold text-sm">🎉 축하합니다! 낙찰되었습니다!</p>
              ) : isSeller ? (
                <p className="text-gray-600 text-sm">경매가 종료되었습니다.</p>
              ) : (
                <p className="text-gray-600 text-sm">다른 입찰자에게 낙찰되었습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 시작가 / 최소 단위 정보 */}
        <div className="mx-4 mt-4 flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-[10px] text-gray-500">시작가</p>
            <p className="text-sm font-bold text-gray-900">{formatPrice(auction.starting_price)}원</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-[10px] text-gray-500">최소 입찰 단위</p>
            <p className="text-sm font-bold text-gray-900">{formatPrice(auction.bid_increment)}원</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className="text-[10px] text-gray-500">조회</p>
            <p className="text-sm font-bold text-gray-900">{product.views_count || 0}</p>
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h2>
          
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {product.condition && <span className="px-2 py-0.5 bg-gray-100 rounded">{product.condition}</span>}
            {product.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{product.location}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          )}

          {/* 판매자 정보 */}
          {seller && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{seller.username}</p>
                <p className="text-xs text-gray-500">{seller.role || '회원'}</p>
              </div>
            </div>
          )}
        </div>

        {/* 입찰 내역 */}
        <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowBidHistory(!showBidHistory)}
            className="w-full p-4 flex items-center justify-between"
          >
            <h3 className="font-bold text-sm text-gray-900">
              입찰 내역 ({bids.length})
            </h3>
            {showBidHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBidHistory && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              {bids.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">아직 입찰이 없습니다</p>
              ) : (
                bids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                      i === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs">👑</span>}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {bid.user_id === user?.id ? `${bid.bidder} (나)` : bid.bidder}
                        </p>
                        <p className="text-[10px] text-gray-500">{bid.timeAgo}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${i === 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                      {formatPrice(bid.amount)}원
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 경매 규칙 안내 */}
        <div className="mx-4 mt-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> 경매 규칙
          </h3>
          <ul className="text-xs text-amber-700 space-y-1.5">
            <li>• 마감 2분 이내 입찰 시 자동으로 2분 연장됩니다</li>
            <li>• 최소 입찰 단위: {formatPrice(auction.bid_increment)}원</li>
            <li>• 본인 상품에는 입찰할 수 없습니다</li>
            <li>• 낙찰 후 48시간 이내 거래를 완료해주세요</li>
          </ul>
        </div>
      </div>

      {/* 하단 입찰 바 (고정) */}
      {!isEnded && !isSeller && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4">
          <div className="max-w-2xl mx-auto">
            {error && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
                <button onClick={() => setError('')} className="ml-auto">
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-gray-500">
                최소 입찰가: <span className="font-bold text-orange-600">
                  {formatPrice(auction.current_price + auction.bid_increment)}원
                </span>
              </p>
              {timeUrgent && (
                <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold animate-pulse">
                  ⏰ 마감 임박!
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* 빠른 입찰 버튼들 */}
              <div className="flex gap-1.5">
              {[
                { label: '+100', amount: 100 },
                { label: '+500', amount: 500 }
              ].map(({ label, amount }) => {
                const quickAmount = auction.current_price + amount
                return (
                  <button
                    key={label}
                    onClick={() => setBidAmount(quickAmount.toLocaleString())}
                    className="px-2.5 py-2 bg-orange-50 border border-orange-200 rounded-lg text-[11px] font-semibold text-orange-700 hover:bg-orange-100 transition-colors whitespace-nowrap"
                  >
                    {label}
                  </button>
                )
              })}
              </div>

              {/* 입찰 금액 입력 */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => {
                    const num = e.target.value.replace(/[^0-9]/g, '')
                    setBidAmount(num ? Number(num).toLocaleString() : '')
                  }}
                  placeholder="입찰가"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-orange-500 pr-8"
                  onKeyPress={(e) => { if (e.key === 'Enter') handleBid() }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>

              {/* 입찰 버튼 */}
              <button
                onClick={handleBid}
                disabled={bidding || !bidAmount}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {bidding ? '...' : '입찰'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 종료/판매자용 하단 바 */}
      {(isEnded || isSeller) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4">
          <div className="max-w-2xl mx-auto">
            {isEnded && isWinner && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold">🎉 축하합니다! 낙찰되었습니다!</p>
                <p className="text-xs text-green-600 mt-1">48시간 이내에 판매자와 연락하여 거래를 완료해주세요.</p>
              </div>
            )}
            {isEnded && !isWinner && !isSeller && (
              <button
                onClick={() => navigate('/market')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                다른 경매 보기
              </button>
            )}
            {isSeller && !isEnded && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-blue-700 font-bold text-sm">내가 등록한 경매입니다</p>
                <p className="text-xs text-blue-600 mt-1">현재 {auction.bid_count}명이 입찰 중입니다</p>
              </div>
            )}
            {isSeller && isEnded && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-gray-700 font-bold text-sm">경매가 종료되었습니다</p>
                {auction.current_bidder_id ? (
                  <p className="text-xs text-gray-500 mt-1">낙찰가: {formatPrice(auction.current_price)}원</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">입찰자가 없습니다</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 이미지 갤러리 */}
      {showGallery && product.images && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setShowGallery(false)}>
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-10">
            <X className="w-6 h-6 text-white" />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full z-10"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full z-10"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full z-10">
            <span className="text-white text-sm">{currentImageIndex + 1} / {product.images.length}</span>
          </div>
          <img
            src={product.images[currentImageIndex]}
            alt=""
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}