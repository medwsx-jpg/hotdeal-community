/**
 * 정책 엔진 테스트
 * 실행: node policyEngine.test.js
 *
 * 정책 JSON의 test_cases를 그대로 실행한다.
 * 새 정책을 추가할 때도 JSON만 바꾸면 이 파일은 수정할 필요가 없다.
 */

import { readFileSync } from 'fs';
import { evaluate, visibleQuestions, toAnalyticsEvent } from './policyEngine.js';

const policy = JSON.parse(
  readFileSync(new URL('./policy_hope_return_demolition.json', import.meta.url))
);

let pass = 0;
let fail = 0;
const failures = [];

console.log(`\n정책: ${policy.policy.title}`);
console.log(`공고 기준일: ${policy.policy.source_published_at} / 확인: ${policy.policy.checked_at}`);
console.log(`규칙 ${policy.rules.length}개 · 질문 ${policy.questions.length}개 · 테스트 ${policy.test_cases.length}건`);
console.log('─'.repeat(70));

for (const tc of policy.test_cases) {
  const result = evaluate(policy, tc.input);
  const ok = result.status === tc.expected;

  // 한도 검증 (expected_limit이 있는 경우)
  let limitOk = true;
  if (tc.expected_limit) {
    limitOk = result.limitNote && result.limitNote.includes(tc.expected_limit);
  }

  if (ok && limitOk) {
    pass++;
    const limit = result.limitNote ? ` [${result.limitNote.split(' /')[0]}]` : '';
    console.log(`  PASS  ${tc.id}  ${result.status}${limit}  (rule#${result.matchedPriority})`);
  } else {
    fail++;
    failures.push({ tc, result });
    console.log(`  FAIL  ${tc.id}  expected=${tc.expected} actual=${result.status}`);
    if (!limitOk) {
      console.log(`        한도 불일치: expected=${tc.expected_limit} actual=${result.limitNote}`);
    }
  }
}

console.log('─'.repeat(70));

// --- 구조 검증 ---
console.log('\n[구조 검증]');

const structural = [];

// 1. 모든 규칙에 evidence_text가 있는가 (원문 역추적 가능성)
const noEvidence = policy.rules.filter((r) => !r.evidence_text);
structural.push({
  name: '모든 규칙이 원문으로 역추적 가능',
  ok: noEvidence.length === 0,
  detail: noEvidence.length ? `누락 ${noEvidence.map((r) => r.priority).join(', ')}` : '',
});

// 2. 폴백 규칙 존재
const hasFallback = policy.rules.some((r) => r.expression && r.expression.always === true);
structural.push({ name: '폴백 규칙 존재', ok: hasFallback, detail: '' });

// 3. 우선순위 중복 없음
const priorities = policy.rules.map((r) => r.priority);
const dupes = priorities.filter((p, i) => priorities.indexOf(p) !== i);
structural.push({
  name: '우선순위 중복 없음',
  ok: dupes.length === 0,
  detail: dupes.length ? `중복 ${dupes.join(', ')}` : '',
});

// 4. 확정형 표현 금지 — 결과 문구에 위험 표현이 없는가
const banned = ['받을 수 있습니다', '지원 대상입니다', '신청 가능합니다', '확정'];
const badCopy = policy.rules.filter((r) =>
  banned.some((b) => (r.result_title + r.result_body).includes(b))
);
structural.push({
  name: '확정형 표현 없음',
  ok: badCopy.length === 0,
  detail: badCopy.length ? `규칙 ${badCopy.map((r) => r.priority).join(', ')}` : '',
});

// 5. 조건부 질문이 올바르게 숨겨지는가
const plannedQs = visibleQuestions(policy, { closure_status: 'planned' });
const showsClosureDate = plannedQs.some((q) => q.key === 'closure_date');
structural.push({
  name: '폐업예정 선택 시 폐업일 질문 숨김',
  ok: !showsClosureDate,
  detail: showsClosureDate ? 'closure_date가 노출됨' : '',
});

// 6. 분석 이벤트에 원본 답변이 섞이지 않는가
const sampleResult = evaluate(policy, policy.test_cases[0].input);
const evt = toAnalyticsEvent(policy, sampleResult);
const leaked = Object.keys(policy.test_cases[0].input).filter((k) => k in evt);
structural.push({
  name: '분석 이벤트에 입력값 미포함',
  ok: leaked.length === 0,
  detail: leaked.length ? `유출 ${leaked.join(', ')}` : '',
});

// 7. 모든 결과에 출처·기준일이 포함되는가
const metaOk = sampleResult.meta.sourceUrl && sampleResult.meta.checkedAt;
structural.push({ name: '결과에 출처·확인일 포함', ok: !!metaOk, detail: '' });

for (const s of structural) {
  if (s.ok) {
    pass++;
    console.log(`  PASS  ${s.name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${s.name}  ${s.detail}`);
  }
}

console.log('─'.repeat(70));
console.log(`\n결과: ${pass} PASS / ${fail} FAIL\n`);

if (fail > 0) {
  console.log('실패 상세:');
  for (const f of failures) {
    console.log(`\n  ${f.tc.id}`);
    console.log(`  입력: ${JSON.stringify(f.tc.input)}`);
    console.log(`  기대: ${f.tc.expected} / 실제: ${f.result.status}`);
    console.log(`  적용 규칙: #${f.result.matchedPriority} — ${f.result.evidence}`);
  }
  process.exit(1);
}

console.log('공개 가능 상태입니다.\n');
