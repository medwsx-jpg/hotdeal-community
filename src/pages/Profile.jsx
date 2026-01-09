import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Camera, ArrowLeft, Save } from 'lucide-react'
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

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  // ← 여기에 추가!
useEffect(() => {
  if (!user) {
    navigate('/login')
  }
}, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // 프로필 존재 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (existingProfile) {
        // 프로필 있으면 업데이트
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
        // 프로필 없으면 생성
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
      <div className="max-w-2xl mx-auto">
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
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>

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
        </div>
      </div>
    </div>
  )
}