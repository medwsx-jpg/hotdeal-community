import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, Clock, Tag, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── FAQ 아코디언 아이템 ────────────────────────────────
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-gray-900 text-[0.95rem] pr-4">{question}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          <div
            className="text-[0.9375rem] text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        </div>
      )}
    </div>
  )
}

// ─── 연관 콘텐츠 카드 ────────────────────────────────────
const RelatedCard = ({ post }) => {
  const categoryColors = {
    '정부대출': 'from-teal-400 to-cyan-500',
    '미소금융': 'from-emerald-400 to-teal-500',
    '소상공인지원': 'from-blue-400 to-indigo-500',
    '금리변동': 'from-amber-400 to-orange-500'
  }
  const gradient = categoryColors[post.category] || 'from-gray-400 to-gray-500'

  return (
    <Link to={`/post/${post.id}`} className="group block">
      <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${gradient} mb-3 flex items-center justify-center p-4 group-hover:scale-[1.02] transition-transform`}>
        <span className="text-white text-center font-bold text-sm leading-snug drop-shadow-sm">
          {post.title.length > 30 ? post.title.slice(0, 30) + '...' : post.title}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1">
        {post.category || '정책자금정보'}
      </p>
      <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition-colors leading-snug">
        {post.title}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(post.created_at).toLocaleDateString('ko-KR')}
      </p>
    </Link>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────
const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [allLoanPosts, setAllLoanPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchPost()
    fetchAllLoanPosts()
  }, [id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPost(data)

      // 작성자 정보
      if (data?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname, role')
          .eq('id', data.user_id)
          .single()
        setAuthor(profileData)
      }

      // 연관 콘텐츠: 같은 카테고리 우선, 부족하면 같은 type에서 보충
      if (data) {
        const { data: related } = await supabase
          .from('posts')
          .select('id, title, category, created_at')
          .eq('type', 'loan')
          .neq('id', data.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (related) {
          const sameCategory = related.filter(p => p.category === data.category)
          const otherCategory = related.filter(p => p.category !== data.category)
          const picked = [...sameCategory, ...otherCategory].slice(0, 3)
          setRelatedPosts(picked)
        }
      }
    } catch (err) {
      console.error('게시글 로딩 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllLoanPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, category, tags')
      .eq('type', 'loan')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setAllLoanPosts(data)
  }

  // ─── 본문에서 FAQ 분리 + 내부 링크 삽입 ──────────────
  const processedContent = useMemo(() => {
    if (!post?.content) return { bodyHtml: '', faqItems: [] }

    let html = post.content

    // 1) FAQ 분리: <h2> 태그에서 "자주 묻는 질문" 또는 "FAQ" 포함된 부분부터 끝까지
    let bodyHtml = html
    let faqHtml = ''
    const faqMatch = html.match(/<h2[^>]*>.*?(?:자주 묻는 질문|FAQ).*?<\/h2>/i)
    if (faqMatch) {
      const faqStart = html.indexOf(faqMatch[0])
      bodyHtml = html.slice(0, faqStart)
      faqHtml = html.slice(faqStart)
    }

    // FAQ 파싱: h3를 질문, 그 뒤 내용을 답변으로 추출
    const faqItems = []
    if (faqHtml) {
      const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi
      let match
      const h3Positions = []
      while ((match = h3Regex.exec(faqHtml)) !== null) {
        h3Positions.push({ index: match.index, end: match.index + match[0].length, question: match[1].replace(/<[^>]*>/g, '') })
      }
      for (let i = 0; i < h3Positions.length; i++) {
        const start = h3Positions[i].end
        const end = i + 1 < h3Positions.length ? h3Positions[i + 1].index : faqHtml.length
        let answer = faqHtml.slice(start, end).trim()
        // <hr> 이후 내용(신청처 안내 등) 제거
        const hrIdx = answer.indexOf('<hr')
        if (hrIdx !== -1) answer = answer.slice(0, hrIdx).trim()
        if (answer) {
          faqItems.push({ question: h3Positions[i].question, answer })
        }
      }
    }

    // 2) 내부 링크 삽입: 다른 게시글 키워드를 자동 링크로 변환
    if (allLoanPosts.length > 0) {
      // 키워드 → postId 매핑 (현재 글 제외)
      const keywordMap = []
      const knownKeywords = [
        '새희망홀씨', '햇살론', '사잇돌대출', '사잇돌', '미소금융',
        '청년버팀목', '소상공인 정책자금', '긴급경영안정자금',
        '햇살론유스', '햇살론 일반보증', '햇살론 특례보증'
      ]
      for (const otherPost of allLoanPosts) {
        if (String(otherPost.id) === String(id)) continue
        for (const keyword of knownKeywords) {
          if (otherPost.title.includes(keyword)) {
            keywordMap.push({ keyword, postId: otherPost.id })
          }
        }
      }

      // 긴 키워드 우선 매칭 (햇살론 일반보증 > 햇살론)
      keywordMap.sort((a, b) => b.keyword.length - a.keyword.length)

      const linked = new Set()
      for (const { keyword, postId } of keywordMap) {
        if (linked.has(keyword)) continue
        // 이미 <a> 태그 안에 있는 키워드는 건너뜀
        // 첫 번째 등장만 링크로 변환
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(?!<[^>]*)(${escaped})(?![^<]*>)`, '')
        if (regex.test(bodyHtml)) {
          bodyHtml = bodyHtml.replace(regex,
            `<a href="/post/${postId}" class="text-teal-600 font-semibold hover:underline border-b border-teal-200">$1</a>`
          )
          linked.add(keyword)
        }
      }
    }

    // 신청처 안내 섹션 스타일 강화
    bodyHtml = bodyHtml.replace(
      /<h2([^>]*)>(.*?신청처 안내.*?)<\/h2>/gi,
      '<h2$1 class="!border-b-2 !border-teal-500">$2</h2>'
    )

    return { bodyHtml, faqItems }
  }, [post, allLoanPosts, id])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const getCategoryLabel = (category) => {
    const labels = { '정부대출': '정부대출', '미소금융': '미소금융', '소상공인지원': '소상공인지원', '금리변동': '금리변동' }
    return labels[category] || category || '정책자금정보'
  }

  // SEO: 본문 HTML에서 텍스트 추출 → description 생성
  const seoDescription = useMemo(() => {
    if (!post?.content) return '서민을 위한 정책자금 정보 - 우리동네플러스'
    const text = post.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return text.length > 150 ? text.slice(0, 150) + '...' : text
  }, [post])

  const seoTitle = post ? `${post.title} | 우리동네플러스` : '우리동네플러스'
  const seoUrl = `https://udt79.com/post/${id}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:site_name" content="우리동네플러스" />
        {post?.images?.[0] && <meta property="og:image" content={post.images[0]} />}
        <meta name="twitter:card" content={post?.images?.[0] ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {post?.images?.[0] && <meta name="twitter:image" content={post.images[0]} />}
        <link rel="canonical" href={seoUrl} />
      </Helmet>

      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm ml-1">뒤로</span>
          </button>
          <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">우리동네플러스</span>
          </Link>
        </div>
      </header>

      {/* 본문 영역 */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 카테고리 배지 */}
        <div className="pt-8 pb-4">
          <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full">
            {getCategoryLabel(post.category)}
          </span>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* 메타 정보 */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
          {author && (
            <span className="font-medium text-gray-700">{author.nickname || '복지플러스'}</span>
          )}
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* 본문 콘텐츠 (FAQ 제외) */}
        <div className="py-8">
          <div
            className="post-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: processedContent.bodyHtml }}
          />
        </div>

        {/* ─── FAQ 아코디언 ─────────────────────────── */}
        {processedContent.faqItems.length > 0 && (
          <div className="pb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
              {processedContent.faqItems.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        )}

        {/* 이미지 */}
        {post.images && post.images.length > 0 && (
          <div className="pb-8 space-y-4">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="pb-8 border-t border-gray-200 pt-6">
            <div className="flex items-center flex-wrap gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {post.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* ─── 연관 콘텐츠 ───────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-lg font-bold text-gray-900 mb-6">연관 콘텐츠</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map(rp => (
                <RelatedCard key={rp.id} post={rp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 하단 CTA */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 text-center">
            <p className="text-gray-600 text-sm mb-1">어떤 서민금융 상품이 나에게 맞을까?</p>
            <p className="text-gray-900 font-bold text-lg mb-4">서민금융콜센터 ☎ 1397 (무료)</p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              더 많은 정책자금 정보 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 bg-gray-50 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>우리동네플러스 | 서민을 위한 정책자금정보</p>
        </div>
      </footer>
    </div>
  )
}

export default PostDetail
