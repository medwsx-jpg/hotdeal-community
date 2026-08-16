import { createClient } from '@supabase/supabase-js'
import { marked } from 'marked'
import fs from 'fs'
import path from 'path'

// ============================================================
// ⚠️ 아래 USER_ID에 Supabase 대시보드의 본인 user_id를 입력하세요
// (Authentication → Users → UUID 복사)
// ============================================================
const USER_ID = 'c2bf2c98-a275-4e27-be4e-dd6e392624a2'

const SUPABASE_URL = 'https://ejvvvwemwugsrbjuqibu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnZ2d2Vtd3Vnc3JianVxaWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5MTEsImV4cCI6MjA4MjY3MjkxMX0.NXpVHBFWJpBn5EKJB8Fdkhk9N4Ydd6C8Dba9cQ7QllU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 게시글 메타데이터 (제목은 마크다운 H1에서 자동 추출)
const posts = [
  {
    file: 'content/콘텐츠_1_새희망홀씨.md',
    category: '정부대출',
    tags: ['새희망홀씨', '서민대출', '저금리대출', '정부지원']
  },
  {
    file: 'content/콘텐츠_2_햇살론.md',
    category: '정부대출',
    tags: ['햇살론', '일반보증', '특례보증', '서민금융']
  },
  {
    file: 'content/콘텐츠_3_청년버팀목.md',
    category: '정부대출',
    tags: ['청년버팀목', '전세대출', '청년대출', '주택금융']
  },
  {
    file: 'content/콘텐츠_4_사잇돌.md',
    category: '정부대출',
    tags: ['사잇돌대출', '대환대출', '중금리대출', '갈아타기']
  },
  {
    file: 'content/콘텐츠_5_미소금융_창업.md',
    category: '미소금융',
    tags: ['미소금융', '창업자금', '소액대출', '무담보대출']
  },
  {
    file: 'content/콘텐츠_6_소상공인_정책자금.md',
    category: '소상공인지원',
    tags: ['소상공인', '정책자금', '소진공', '창업대출']
  },
  {
    file: 'content/콘텐츠_7_긴급경영안정자금.md',
    category: '소상공인지원',
    tags: ['긴급경영안정자금', '소상공인', '긴급대출', '재난지원']
  },
  {
    file: 'content/콘텐츠_8_기준금리_서민대출.md',
    category: '금리변동',
    tags: ['기준금리', '금리인하', '서민대출', '대환대출']
  },
  {
    file: 'content/콘텐츠_9_고정vs변동금리.md',
    category: '금리변동',
    tags: ['고정금리', '변동금리', '금리비교', '대출금리']
  },
  {
    file: 'content/콘텐츠_10_서민금융_종합비교.md',
    category: '정부대출',
    tags: ['서민금융비교', '새희망홀씨', '햇살론', '사잇돌', '미소금융']
  }
]

function parseMarkdown(filePath) {
  const md = fs.readFileSync(filePath, 'utf-8')

  // H1 제목 추출
  const titleMatch = md.match(/^# (.+)$/m)
  const title = titleMatch ? titleMatch[1] : '제목 없음'

  // H1과 첫 번째 --- 이후의 본문만 추출 (3줄 요약, 목차 제외)
  // 두 번째 --- 이후부터가 본문
  const sections = md.split(/^---$/m)
  const body = sections.length >= 3 ? sections.slice(2).join('\n---\n') : md

  // 마지막 > 블록(푸터) 제거
  const bodyClean = body.replace(/^>\s*udt79.+$/gm, '').trim()

  // marked로 HTML 변환
  const html = marked(bodyClean)

  return { title, html }
}

async function main() {
  if (USER_ID === '여기에_본인_user_id_입력') {
    console.error('❌ USER_ID를 설정해주세요!')
    console.error('   Supabase 대시보드 → Authentication → Users → UUID 복사')
    process.exit(1)
  }

  console.log('📝 콘텐츠 10개 등록을 시작합니다...\n')

  let success = 0
  let fail = 0

  for (const post of posts) {
    const filePath = path.join(process.cwd(), post.file)

    if (!fs.existsSync(filePath)) {
      console.error(`❌ 파일 없음: ${post.file}`)
      fail++
      continue
    }

    const { title, html } = parseMarkdown(filePath)

    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: USER_ID,
        type: 'loan',
        category: post.category,
        title: title,
        content: html,
        tags: post.tags
      }])

    if (error) {
      console.error(`❌ 실패: ${title}`)
      console.error(`   에러: ${error.message}`)
      fail++
    } else {
      console.log(`✅ 등록: ${title} [${post.category}]`)
      success++
    }
  }

  console.log(`\n🎉 완료! 성공: ${success}개, 실패: ${fail}개`)
}

main()
