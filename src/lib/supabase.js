import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,  // 세션 유지 ✅
    storageKey: 'udt79-auth',  // 로컬스토리지 키
    storage: window.localStorage,  // localStorage 사용
    autoRefreshToken: true,  // 자동 토큰 갱신 ✅
    detectSessionInUrl: true  // URL에서 세션 감지 ✅
  }
})