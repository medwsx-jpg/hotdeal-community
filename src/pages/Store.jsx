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
const [showPhoneModal, setShowPhoneModal] = useState(false)  // 🆕 추가
const [phoneNumber, setPhoneNumber] = useState('')           // 🆕 추가
  
  // 상품 목록 가져오기
  useEffect(() => {
    fetchProducts()
  }, [])

  // 🆕 전화번호 포맷팅 함수
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}
  
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
  
 // 🆕 교환 확인 (전화번호 입력 포함)
const handleConfirmExchange = async () => {
  if (!phoneNumber || phoneNumber.length < 12) {
    alert('올바른 전화번호를 입력해주세요.')
    return
  }
  
  setPurchasing(true)
  try {
    // 1. 교환 내역 저장
    const { error: exchangeError } = await supabase
      .from('reward_exchanges')
      .insert([{
        user_id: user.id,
        item_name: selectedProduct.name,
        item_image: selectedProduct.image_url,
        points: selectedProduct.price,
        phone: phoneNumber,
        status: 'pending'
      }])
    
    if (exchangeError) throw exchangeError
    
    // 2. 포인트 차감
    const { error: pointError } = await supabase.rpc('increment_points', {
      user_id_param: user.id,
      points_param: -selectedProduct.price
    })
    
    if (pointError) throw pointError
    
    // 3. 성공 모달 표시
    setShowPhoneModal(false)
    setPhoneNumber('')
    setShowSuccessModal(true)
    
  } catch (error) {
    console.error('교환 실패:', error)
    alert('교환 실패: ' + error.message)
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
                if (!user) {
                  alert('로그인이 필요합니다.')
                  navigate('/login')
                  return
                }
                
                const userPoints = profile?.points || 0
                if (userPoints < product.price) {
                  alert('포인트가 부족합니다.')
                  return
                }
                
                setSelectedProduct(product)
                setShowPhoneModal(true)  // 🆕 변경: 전화번호 모달 표시
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
      
      {/* 🆕 전화번호 입력 모달 */}
{showPhoneModal && selectedProduct && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">기프티콘 받을 번호</h2>
        <button
          onClick={() => {
            setShowPhoneModal(false)
            setPhoneNumber('')
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 선택한 상품 정보 */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            {selectedProduct.image_url?.startsWith('http') ? (
              <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">{selectedProduct.image_url || '🎁'}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
            <p className="text-sm text-teal-600 font-semibold">{selectedProduct.price?.toLocaleString()}P</p>
          </div>
        </div>
      </div>

      {/* 전화번호 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          전화번호 *
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
          placeholder="010-1234-5678"
          maxLength="13"
          className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
        />
        <p className="text-xs text-gray-500 mt-2">
          💬 입력하신 번호로 카카오톡 기프티콘이 발송됩니다
        </p>
      </div>

      {/* 주의사항 */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 font-medium mb-2">⚠️ 확인해주세요</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 전화번호를 정확히 입력해주세요</li>
          <li>• 교환 후 1-3일 내 발송됩니다</li>
          <li>• 발송 후에는 취소가 불가능합니다</li>
        </ul>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowPhoneModal(false)
            setPhoneNumber('')
          }}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleConfirmExchange}
          disabled={purchasing || phoneNumber.length < 12}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover-lift shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-gray-600 mb-2">
  {selectedProduct?.name}
</p>
<p className="text-sm text-gray-500 mb-8">
  {phoneNumber}로<br />
  1-3일 내 기프티콘이 발송됩니다
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