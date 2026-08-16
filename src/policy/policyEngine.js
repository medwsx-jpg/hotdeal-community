/**
 * 정책 진단 규칙 평가 엔진
 *
 * 설계 원칙
 * 1. 순수 함수 — 네트워크·저장소·전역 상태를 쓰지 않는다.
 * 2. 이진 판정 금지 — eligible/ineligible이 아니라 4가지 상태를 반환한다.
 * 3. 브라우저에서 실행 — 사용자 입력값이 서버로 전송되지 않는다.
 * 4. 모르면 needs_official_check — 확신할 수 없으면 공식 확인으로 넘긴다.
 */

/** 결과 상태 */
export const STATUS = {
  CHECK_FIRST: 'check_first',                 // 기본 조건 일치, 공식 확인 권장
  NEEDS_OFFICIAL_CHECK: 'needs_official_check', // 판단 불가, 공식 확인 필요
  LIKELY_MISMATCH: 'likely_mismatch',         // 명시적 배제 조건과 충돌
  REVIEW_REQUIRED: 'review_required',         // 입력·공고 상태 불명확
};

/** 단일 조건 평가 */
function evalCondition(cond, answers) {
  if (cond.always === true) return true;

  const value = answers[cond.field];

  switch (cond.op) {
    case 'eq':
      return value === cond.value;

    case 'neq':
      return value !== cond.value;

    case 'contains':
      // 다중선택 필드 전용. 배열이 아니면 false.
      return Array.isArray(value) && value.includes(cond.value);

    case 'not_contains':
      return Array.isArray(value) && !value.includes(cond.value);

    case 'in':
      return Array.isArray(cond.value) && cond.value.includes(value);

    case 'exists':
      return value !== undefined && value !== null && value !== '';

    default:
      // 모르는 연산자는 조용히 실패시키지 않고 드러낸다.
      throw new Error(`Unknown operator: ${cond.op}`);
  }
}

/** 조건식 평가 (all / any / 단일) */
function evalExpression(expr, answers) {
  if (!expr) return false;

  if (Array.isArray(expr.all)) {
    return expr.all.every((c) => evalExpression(c, answers));
  }
  if (Array.isArray(expr.any)) {
    return expr.any.some((c) => evalExpression(c, answers));
  }
  return evalCondition(expr, answers);
}

/** show_if 조건에 따라 현재 보여야 할 질문만 반환 */
export function visibleQuestions(policy, answers) {
  return policy.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((q) => !q.show_if || evalExpression(q.show_if, answers));
}

/** 필수 질문이 모두 답변됐는지 확인 */
export function missingRequired(policy, answers) {
  return visibleQuestions(policy, answers)
    .filter((q) => q.required)
    .filter((q) => {
      const v = answers[q.key];
      if (v === undefined || v === null || v === '') return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    })
    .map((q) => q.key);
}

/**
 * 정책 진단 실행
 * @returns {{
 *   status: string,
 *   title: string,
 *   body: string,
 *   limitNote: string|null,
 *   evidence: string,
 *   matchedPriority: number|null,
 *   notes: Array,
 *   unknownIf: string[],
 *   meta: object
 * }}
 */
export function evaluate(policy, answers) {
  const missing = missingRequired(policy, answers);

  // 필수 답변 누락 → 확정하지 않고 공식 확인으로 넘긴다.
  if (missing.length > 0) {
    return buildResult(policy, {
      status: STATUS.NEEDS_OFFICIAL_CHECK,
      title: '공식 확인이 필요합니다',
      body: '답변하지 않은 항목이 있어 판단할 수 없습니다. 소상공인24 공고에서 확인해 주세요.',
      evidence: `missing: ${missing.join(', ')}`,
      matchedPriority: null,
      missingRequired: missing,
    });
  }

  const rules = policy.rules.slice().sort((a, b) => a.priority - b.priority);

  for (const rule of rules) {
    if (evalExpression(rule.expression, answers)) {
      return buildResult(policy, {
        status: rule.result_status,
        title: rule.result_title,
        body: rule.result_body,
        limitNote: rule.limit_note || null,
        evidence: rule.evidence_text,
        matchedPriority: rule.priority,
        missingRequired: [],
      });
    }
  }

  // 폴백 규칙(priority 999)이 없거나 도달하지 못한 경우
  return buildResult(policy, {
    status: STATUS.NEEDS_OFFICIAL_CHECK,
    title: '공식 확인이 필요합니다',
    body: '입력하신 조건만으로는 판단하기 어렵습니다. 소상공인24 공고와 상담으로 확인해 주세요.',
    evidence: 'no rule matched',
    matchedPriority: null,
    missingRequired: [],
  });
}

/** 결과 객체 조립 — 모든 결과에 출처·기준일·주의사항을 항상 포함시킨다. */
function buildResult(policy, partial) {
  return {
    status: partial.status,
    title: partial.title,
    body: partial.body,
    limitNote: partial.limitNote || null,
    evidence: partial.evidence,
    matchedPriority: partial.matchedPriority,
    missingRequired: partial.missingRequired || [],

    // 판정 결과와 무관하게 항상 표시되어야 하는 항목
    notes: policy.always_show_notes || [],
    crossSell: policy.cross_sell_note || null,
    unknownIf: policy.unknown_if || [],

    // 신뢰의 근거 — 화면에 반드시 노출한다.
    meta: {
      policyId: policy.policy.id,
      title: policy.policy.title,
      owner: policy.policy.owner,
      sourceUrl: policy.policy.source_url,
      sourcePublishedAt: policy.policy.source_published_at,
      checkedAt: policy.policy.checked_at,
      applyUrl: policy.policy.apply_url,
      disclaimer: policy.policy.disclaimer,
      versionNo: policy.version ? policy.version.version_no : null,
    },
  };
}

/**
 * 분석용 이벤트 페이로드.
 * 사용자가 입력한 원본 답변은 절대 포함하지 않는다.
 */
export function toAnalyticsEvent(policy, result) {
  return {
    event: 'diagnostic_complete',
    slug: policy.policy.slug,
    policy_version: policy.version ? policy.version.version_no : null,
    result_status: result.status,
    matched_priority: result.matchedPriority,
  };
}
