// 평가 불가 표시 값
export const SCORE_NA = -1;

// ===== 전직원 동료 평가 (peer) =====
export const PEER_QUESTIONS = [
  { id: "q1", text: "업무 목표를 명확히 이해하고 달성하기 위해 노력한다.", category: "업무 수행" },
  { id: "q2", text: "맡은 업무를 기한 내에 완수한다.", category: "업무 수행" },
  { id: "q3", text: "업무 품질이 기대 수준을 충족한다.", category: "업무 수행" },
  { id: "q4", text: "팀원들과 원활하게 소통하고 협업한다.", category: "협업" },
  { id: "q5", text: "다른 팀원의 의견을 존중하고 경청한다.", category: "협업" },
  { id: "q6", text: "팀의 공동 목표 달성에 적극적으로 기여한다.", category: "협업" },
  { id: "q7", text: "새로운 아이디어나 방법을 제안한다.", category: "성장" },
  { id: "q8", text: "피드백을 수용하고 개선하려는 자세를 보인다.", category: "성장" },
  { id: "q9", text: "자기 개발을 위해 지속적으로 노력한다.", category: "성장" },
  { id: "q10", text: "팀 분위기에 긍정적인 영향을 준다.", category: "태도" },
] as const;

export const PEER_SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const PEER_MAX_SCORE = 10;

// ===== 콘텐츠팀 평가 (content) =====
export const CONTENT_QUESTIONS = [
  { id: "cq1", text: "요청한 광고주의 핵심 소구점(USP)과 기획 의도를 충분히 반영했나요?", category: "기획력" },
  { id: "cq2", text: "해당 콘텐츠가 광고 효율(성과)을 내기에 충분한 경쟁력이 있다고 보시나요?", category: "기획력" },
  { id: "cq3", text: "제작물의 시각적/기술적 완성도(디자인/영상 퀄리티)에 만족하시나요?", category: "완성도" },
  { id: "cq4", text: "오탈자, 팩트 오류, 링크 누락 등 기본적인 검수가 잘 되어 있었나요?", category: "완성도" },
  { id: "cq5", text: "업무 협의 과정에서 소통이 원활하고 피드백 반영이 적극적이었나요?", category: "협업/소통" },
  { id: "cq6", text: "합의된 일정 내에 결과물을 제출과 수정 후 재제출까지 소요 시간이 적절했나요?", category: "협업/소통" },
  { id: "cq7", text: "해당 담당자와 다음 프로젝트에서도 다시 협업하고 싶나요?", category: "종합" },
] as const;

export const CONTENT_SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
export const CONTENT_MAX_SCORE = 5;
export const CONTENT_SCORE_LABELS: Record<number, string> = {
  1: "매우 미흡",
  2: "미흡",
  3: "보통",
  4: "우수",
  5: "매우 우수",
};

// 콘텐츠팀 주관식 질문
export const CONTENT_SUBJECTIVE = "(주관식) 특별히 잘한 점 또는 개선이 필요한 점이 있다면 자유롭게 작성해주세요.";

// 콘텐츠팀 대상 팀명
export const CONTENT_TEAM_NAME = "콘텐츠마케터";

// ===== 템플릿 설정 =====
export type TemplateId = "peer" | "content";

export interface EvalTemplate {
  id: TemplateId;
  name: string;
  questions: readonly { id: string; text: string; category: string }[];
  scoreOptions: readonly number[];
  maxScore: number;
  scoreLabels?: Record<number, string>;
  hasNaOption: boolean;
  subjectivePrompt?: string;
}

export const TEMPLATES: Record<TemplateId, EvalTemplate> = {
  peer: {
    id: "peer",
    name: "전직원 동료 평가",
    questions: PEER_QUESTIONS,
    scoreOptions: PEER_SCORE_OPTIONS as unknown as readonly number[],
    maxScore: PEER_MAX_SCORE,
    hasNaOption: true,
  },
  content: {
    id: "content",
    name: "콘텐츠팀 평가",
    questions: CONTENT_QUESTIONS,
    scoreOptions: CONTENT_SCORE_OPTIONS as unknown as readonly number[],
    maxScore: CONTENT_MAX_SCORE,
    scoreLabels: CONTENT_SCORE_LABELS,
    hasNaOption: true,
    subjectivePrompt: CONTENT_SUBJECTIVE,
  },
};

export function getTemplate(templateId: string): EvalTemplate {
  return TEMPLATES[templateId as TemplateId] || TEMPLATES.peer;
}

// 하위 호환용
export const EVAL_QUESTIONS = PEER_QUESTIONS;
export const SCORE_OPTIONS = PEER_SCORE_OPTIONS;
