import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Challenge from './pages/Challenge'
import Store from './pages/Store'  // 🆕 스토어 추가
import PostDetail from './pages/PostDetail'
import PolicyCheck from './pages/PolicyCheck'
import { lazy, Suspense } from 'react'
const Market = lazy(() => import('./pages/Market'))
const AuctionDetail = lazy(() => import('./pages/AuctionDetail'))

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/store" element={<Store />} />  {/* 🆕 스토어 추가 */}
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/market" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Market />
            </Suspense>
          } />
          <Route path="/market/auction/:id" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}>
              <AuctionDetail />
            </Suspense>
          } />
          <Route path="/open" element={<Navigate to="/feed" replace />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/check/:slug" element={<PolicyCheck />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  )
}

export default App