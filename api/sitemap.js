// 동적 사이트맵 생성 (Vercel Serverless Function)
// /sitemap.xml 요청 시 고정 페이지 + 30초 체크 + Supabase 게시글을 합쳐 XML로 응답합니다.

const SITE = 'https://udt79.com'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ejvvvwemwugsrbjuqibu.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnZ2d2Vtd3Vnc3JianVxaWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5MTEsImV4cCI6MjA4MjY3MjkxMX0.NXpVHBFWJpBn5EKJB8Fdkhk9N4Ydd6C8Dba9cQ7QllU'

// 고정 페이지
const STATIC_URLS = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/feed', changefreq: 'daily', priority: '0.9' },
  { loc: '/check', changefreq: 'weekly', priority: '0.9' },
  { loc: '/landing', changefreq: 'weekly', priority: '0.6' },
  { loc: '/challenge', changefreq: 'weekly', priority: '0.6' },
  { loc: '/market', changefreq: 'weekly', priority: '0.6' },
  { loc: '/store', changefreq: 'weekly', priority: '0.5' },
  { loc: '/terms', changefreq: 'monthly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'monthly', priority: '0.3' },
]

// 30초 체크 페이지 (신규 정책 추가 시 여기에 slug만 추가)
const CHECK_SLUGS = [
  'eitc-2026',
  'energy-voucher-2026',
  'small-biz-fund-2026',
  'biz-voucher-2026',
  'hope-return-demolition-2026',
  'fresh-start-fund-2026',
  'maternity-benefit-uninsured-2026',
  'learning-card-2026',
  'job-support-2026',
  'youth-employ-fund-2026',
  'startup-innovation-fund-2026',
  'refinance-loan-2026',
  'micro-loan-2026',
  'sunshine-loan-2026',
  'youth-rent-2026',
  'youth-savings-2026',
]

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function urlTag({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(SITE + loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n')
}

export default async function handler(req, res) {
  const urls = []

  // 1. 고정 페이지
  STATIC_URLS.forEach(u => urls.push(urlTag(u)))

  // 2. 30초 체크 페이지
  CHECK_SLUGS.forEach(slug =>
    urls.push(urlTag({ loc: `/check/${slug}`, changefreq: 'weekly', priority: '0.8' }))
  )

  // 3. 게시글 (Supabase에서 최신 1000개)
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?select=id,created_at,updated_at&order=created_at.desc&limit=1000`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )
    if (resp.ok) {
      const posts = await resp.json()
      posts.forEach(p => {
        const d = p.updated_at || p.created_at
        urls.push(urlTag({
          loc: `/post/${p.id}`,
          lastmod: d ? String(d).slice(0, 10) : undefined,
          changefreq: 'monthly',
          priority: '0.7',
        }))
      })
    }
  } catch (e) {
    // 게시글 조회 실패 시에도 고정 페이지만으로 사이트맵을 반환합니다
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
