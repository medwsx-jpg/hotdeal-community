import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Gift, ShoppingBag, Coins, Check, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Store() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // 상품 목록 가져오기
  useEffect(() => {
    fetchProducts()
  }, [])
  
  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('상품 로드 실패:', error)
      // 테이블이 없으면 기본 상품 표시
      setProducts([
        { id: 1, name: '치킨', price: 29000, image_url: '🍗', description: '바삭한 치킨' },
        { id: 2, name: '피자', price: 24900, image_url: '🍕', description: '맛있는 피자' },
        { id: 3, name: '스타벅스', price: 4000, image_url: '☕', description: '아메리카노' },
        { id: 4, name: '우유', price: 1200, image_url: '🥛', description: '신선한 우유' },
      ])
    } finally {
      setLoading(false)
    }
  }
  
  // 상품 구매
  const handlePurchase = async () => {
    if (!user || !selectedProduct) return
    
    const userPoints = profile?.points || 0
    
    if (userPoints < selectedProduct.price) {
      alert('포인트가 부족합니다!')
      setShowConfirmModal(false)
      return
    }
    
    setPurchasing(true)
    try {
    // 포인트 차감 (Atomic Update)
    const { error: pointError } = await supabase.rpc('increment_points', {
      user_id_param: user.id,
      points_param: -selectedProduct.price
    })
      
      if (pointError) throw pointError
      
      // 구매 기록 저장
      const { error: purchaseError } = await supabase
        .from('store_purchases')
        .insert({
          user_id: user.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          price: selectedProduct.price
        })
      
      if (purchaseError) throw purchaseError
      
      setShowConfirmModal(false)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('구매 실패:', error)
      alert('구매에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setPurchasing(false)
    }
  }
  
  const userPoints = profile?.points || 0
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold">🎁 스토어</h1>
          </div>
          <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1.5 rounded-full">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="font-bold text-yellow-700">{userPoints.toLocaleString()}P</span>
          </div>
        </div>
      </div>
      
      {/* 스토어 헤더 */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">스토어</span>
            <span className="text-white/80">포인트로 교환해요</span>
          </div>
          <p className="text-sm text-white/70">모은 포인트로 다양한 상품을 교환하세요!</p>
        </div>
      </div>
      
      {/* 상품 목록 */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 mt-2">로딩 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">상품이 준비 중입니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product)
                  setShowConfirmModal(true)
                }}
                className="bg-red-50 rounded-2xl p-4 text-center hover:shadow-lg transition-all border-2 border-red-100 hover:border-red-300"
              >
                {/* 상품 이미지 */}
                <div className="w-full aspect-square bg-white rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.image_url?.startsWith('http') ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{product.image_url || '🎁'}</span>
                  )}
                </div>
                
                {/* 상품 정보 */}
                <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-teal-600 font-bold">{product.price?.toLocaleString()}P</p>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 구매 확인 모달 */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                {selectedProduct.image_url?.startsWith('http') ? (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="text-4xl">{selectedProduct.image_url || '🎁'}</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h3>
              <p className="text-2xl font-bold text-teal-600">{selectedProduct.price?.toLocaleString()}P</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">보유 포인트</span>
                <span className="font-bold">{userPoints.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">필요 포인트</span>
                <span className="font-bold text-red-500">-{selectedProduct.price?.toLocaleString()}P</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">잔여 포인트</span>
                  <span className={`font-bold ${userPoints - selectedProduct.price >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                    {(userPoints - selectedProduct.price).toLocaleString()}P
                  </span>
                </div>
              </div>
            </div>
            
            {userPoints < selectedProduct.price ? (
              <div className="text-center text-red-500 text-sm mb-4">
                ⚠️ 포인트가 부족합니다
              </div>
            ) : null}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedProduct(null)
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
              >
                취소
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing || userPoints < selectedProduct.price}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {purchasing ? '처리 중...' : '교환하기'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 구매 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">교환 완료!</h3>
            <p className="text-gray-600 mb-6">
              {selectedProduct?.name} 교환이 완료되었습니다.<br />
              마이페이지에서 확인해주세요.
            </p>
            <button
             onClick={async () => {
              setShowSuccessModal(false)
              setSelectedProduct(null)
              // 프로필 다시 불러오기
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
              if (data) window.location.href = '/store' // 페이지 새로고침 대신
            }}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}