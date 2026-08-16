import { createClient } from '@supabase/supabase-js'
import { marked } from 'marked'
import fs from 'fs'
import path from 'path'

const USER_ID = 'c2bf2c98-a275-4e27-be4e-dd6e392624a2'
const SUPABASE_URL = 'https://ejvvvwemwugsrbjuqibu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnZ2d2Vtd3Vnc3JianVxaWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5MTEsImV4cCI6MjA4MjY3MjkxMX0.NXpVHBFWJpBn5EKJB8Fdkhk9N4Ydd6C8Dba9cQ7QllU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const posts = [
  { file: '콘텐츠_11_햇살론유스.md', category: '정부대출', tags: ['햇살론유스', '청년대출', '서민대출', '저금리'] },
  { file: '콘텐츠_12_저신용자_대출.md', category: '정부대출', tags: ['저신용자', '대출', '신용점수', '서민금융'] },
  { file: '콘텐츠_13_대출거절후_방법.md', category: '정부대출', tags: ['대출거절', '대출심사', '대안대출', '서민금융'] },
  { file: '콘텐츠_14_정부지원대출_총정리.md', category: '정부대출', tags: ['정부지원대출', '서민대출', '비교', '총정리'] },
  { file: '콘텐츠_15_미소금융_생활안정.md', category: '미소금융', tags: ['미소금융', '생활안정자금', '생계비', '의료비'] },
  { file: '콘텐츠_16_긴급생활안정자금.md', category: '소상공인지원', tags: ['긴급생활안정자금', '긴급지원', '생활비', '위기가구'] },
  { file: '콘텐츠_17_신용점수_올리기.md', category: '금리변동', tags: ['신용점수', '신용등급', '올리는법', '금융생활'] },
  { file: '콘텐츠_18_대환대출_가이드.md', category: '정부대출', tags: ['대환대출', '갈아타기', '금리인하', '대출비교'] },
  { file: '콘텐츠_19_채무조정제도.md', category: '정부대출', tags: ['채무조정', '개인회생', '개인워크아웃', '파산'] },
  { file: '콘텐츠_20_서민금융_FAQ.md', category: '정부대출', tags: ['서민금융', 'FAQ', '자주묻는질문', '대출상담'] },
  { file: '콘텐츠_21_전세자금대출_비교.md', category: '정부대출', tags: ['전세자금대출', '버팀목', '카카오뱅크', '전세대출비교'] },
  { file: '콘텐츠_22_주택담보대출_금리.md', category: '금리변동', tags: ['주택담보대출', '금리비교', '갈아타기', 'LTV'] },
  { file: '콘텐츠_23_자영업자_대출.md', category: '소상공인지원', tags: ['자영업자대출', '프리랜서', '개인사업자', '소상공인'] },
  { file: '콘텐츠_24_국민취업지원제도.md', category: '소상공인지원', tags: ['국민취업지원', '구직촉진수당', '취업지원', '실업급여'] },
  { file: '콘텐츠_25_근로장려금.md', category: '소상공인지원', tags: ['근로장려금', 'EITC', '저소득', '세금환급'] },
  { file: '콘텐츠_26_주거급여.md', category: '정부대출', tags: ['주거급여', '월세지원', '수선비', '주거복지'] },
  { file: '콘텐츠_27_건강보험료_경감.md', category: '미소금융', tags: ['건강보험료', '경감', '면제', '보험료줄이기'] },
  { file: '콘텐츠_28_통신비_감면.md', category: '미소금융', tags: ['통신비감면', '저소득층', '장애인', '통신요금'] },
  { file: '콘텐츠_29_에너지바우처.md', category: '소상공인지원', tags: ['에너지바우처', '난방비', '전기요금', '저소득층지원'] },
  { file: '콘텐츠_30_숨은보조금_찾기.md', category: '소상공인지원', tags: ['숨은보조금', '정부지원금', '보조금24', '복지로'] }
]

function parseMarkdown(filePath) {
  const md = fs.readFileSync(filePath, 'utf-8')
  const titleMatch = md.match(/^# (.+)$/m)
  const title = titleMatch ? titleMatch[1] : '제목 없음'
  const sections = md.split(/^---$/m)
  const body = sections.length >= 3 ? sections.slice(2).join('\n---\n') : md
  const bodyClean = body.replace(/^>\s*udt79.+$/gm, '').trim()
  const html = marked(bodyClean)
  return { title, html }
}

async function main() {
  console.log('📝 콘텐츠 20개 등록을 시작합니다...\n')
  let success = 0
  let fail = 0

  for (const post of posts) {
    const filePath = path.join(process.cwd(), 'content', post.file)
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
