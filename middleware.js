import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ejvvvwemwugsrbjuqibu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnZ2d2Vtd3Vnc3JianVxaWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5MTEsImV4cCI6MjA4MjY3MjkxMX0.NXpVHBFWJpBn5EKJB8Fdkhk9N4Ydd6C8Dba9cQ7QllU'

const SITE_URL = 'https://udt79.com'
const SITE_NAME = '우리동네플러스'
const DEFAULT_OG_IMAGE = `${SITE_URL}/cards/card_10.png`
const DEFAULT_DESCRIPTION = '서민을 위한 정책자금 정보 - 정부대출, 미소금융, 소상공인지원, 금리변동 정보를 한눈에'

// 소셜 크롤러 User-Agent 패턴
const BOT_PATTERNS = [
  'kakaotalk',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'slackbot',
  'linkedinbot',
  'telegrambot',
  'discordbot',
  'whatsapp',
  'line-poker',
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'naverbot',
  'yeti',
  'daumoa',
]

function isBot(userAgent) {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_PATTERNS.some(bot => ua.includes(bot))
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateOgHtml({ title, description, url, image, siteName }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="canonical" href="${url}" />
</head>
<body></body>
</html>`
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''

  // /post/:id 경로만 처리
  const postMatch = url.pathname.match(/^\/post\/([a-zA-Z0-9-]+)$/)

  if (!postMatch || !isBot(userAgent)) {
    // 봇이 아니거나 /post/ 경로가 아니면 → 기존 SPA로 통과
    return
  }

  const postId = postMatch[1]

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data: post, error } = await supabase
      .from('posts')
      .select('title, content, images, type, category')
      .eq('id', postId)
      .single()

    if (error || !post) {
      // 게시글 못 찾으면 기본 OG로 응답
      return new Response(
        generateOgHtml({
          title: SITE_NAME,
          description: DEFAULT_DESCRIPTION,
          url: `${SITE_URL}${url.pathname}`,
          image: DEFAULT_OG_IMAGE,
          siteName: SITE_NAME,
        }),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const rawDescription = stripHtml(post.content)
    const description = escapeHtml(
      rawDescription.length > 150 ? rawDescription.slice(0, 150) + '...' : rawDescription
    )
    const title = escapeHtml(`${post.title} - ${SITE_NAME}`)
    const image = post.images?.[0] || DEFAULT_OG_IMAGE
    const postUrl = `${SITE_URL}/post/${postId}`

    return new Response(
      generateOgHtml({ title, description, url: postUrl, image, siteName: SITE_NAME }),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    // 에러 시 기본 통과
    return
  }
}

export const config = {
  matcher: ['/post/:path*'],
}
