// 동료 평가 문항 (10개 리커트 + 2개 주관식)
export const EVAL_QUESTIONS = [
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

// 항목당 10점 만점, 10개 항목 = 100점 만점
export const SCORE_OPTIONS = [2, 4, 6, 8, 10] as const;

export const SCORE_LABELS: Record<number, string> = {
  2: "매우 부족",
  4: "부족",
  6: "보통",
  8: "우수",
  10: "매우 우수",
};
