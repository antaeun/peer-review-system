"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getTemplate, SCORE_NA, type TemplateId } from "@/lib/questions";

interface Employee {
  id: string;
  name: string;
  team: string;
  position: string;
}

interface EvalData {
  evaluator: Employee;
  round: { id: string; title: string; message: string | null; endDate: string };
  template: TemplateId;
  isSubmitted: boolean;
  exclusionConfirmed: boolean;
  teammates: Employee[];
  exclusions: { targetId: string; reason: string; target: Employee }[];
  responses: {
    targetId: string;
    scores: Record<string, number>;
    strength: string | null;
    improvement: string | null;
    isDraft: boolean;
    target: Employee;
  }[];
}

type Step = "exclusion" | "evaluate" | "done";

export default function EvalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<EvalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("exclusion");
  const [loading, setLoading] = useState(false);

  // 제외 상태
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [excludeReasons, setExcludeReasons] = useState<Record<string, string>>({});

  // 평가 응답
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [strengths, setStrengths] = useState<Record<string, string>>({});
  const [improvements, setImprovements] = useState<Record<string, string>>({});

  // 현재 평가 대상 인덱스
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/eval/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invalid token");
        return r.json();
      })
      .then((d: EvalData) => {
        setData(d);
        // 콘텐츠팀 평가는 제외 단계 건너뛰기
        if (d.isSubmitted) {
          setStep("done");
        } else if (d.template === "content" || d.exclusionConfirmed) {
          setStep("evaluate");
        }
        // 기존 제외 로드
        const exIds = new Set(d.exclusions.map((e) => e.targetId));
        setExcludedIds(exIds);
        const reasons: Record<string, string> = {};
        d.exclusions.forEach((e) => {
          reasons[e.targetId] = e.reason;
        });
        setExcludeReasons(reasons);
        // 기존 응답 로드
        const s: Record<string, Record<string, number>> = {};
        const st: Record<string, string> = {};
        const im: Record<string, string> = {};
        d.responses.forEach((r) => {
          s[r.targetId] = r.scores;
          if (r.strength) st[r.targetId] = r.strength;
          if (r.improvement) im[r.targetId] = r.improvement;
        });
        setScores(s);
        setStrengths(st);
        setImprovements(im);
      })
      .catch(() => setError("유효하지 않은 링크입니다"));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center">로딩 중...</div>;

  const tmpl = getTemplate(data.template);
  const evalTargets = data.teammates.filter((t) => !excludedIds.has(t.id));
  const currentTarget = evalTargets[currentIdx];

  async function saveExclusions() {
    setLoading(true);
    try {
      const exclusions = Array.from(excludedIds).map((targetId) => ({
        targetId,
        reason: excludeReasons[targetId] || "협업 부족",
      }));

      const res = await fetch(`/api/eval/${token}/exclusions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclusions }),
      });

      if (!res.ok) throw new Error();
      toast.success("제외 대상이 저장되었습니다");
      setStep("evaluate");
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  function setScore(targetId: string, questionId: string, score: number) {
    setScores((prev) => ({
      ...prev,
      [targetId]: { ...prev[targetId], [questionId]: score },
    }));
  }

  function validateCurrentTarget(): boolean {
    if (!currentTarget) return false;
    const targetScores = scores[currentTarget.id];
    if (!targetScores) {
      toast.error("모든 항목을 평가해주세요");
      return false;
    }
    for (const q of tmpl.questions) {
      if (targetScores[q.id] === undefined || targetScores[q.id] === 0) {
        toast.error(`"${q.text}" 항목을 평가해주세요`);
        return false;
      }
    }
    return true;
  }

  function goToNext() {
    if (!validateCurrentTarget()) return;
    setCurrentIdx(currentIdx + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPrev() {
    setCurrentIdx(currentIdx - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    const responses = evalTargets
      .filter((t) => scores[t.id])
      .map((t) => ({
        targetId: t.id,
        scores: scores[t.id] || {},
        strength: strengths[t.id] || "",
        improvement: improvements[t.id] || "",
      }));

    await fetch(`/api/eval/${token}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses, submit: false }),
    });
    toast.success("임시 저장되었습니다");
  }

  async function submitAll() {
    // 모든 대상에 대해 모든 문항이 채워졌는지 확인 (평가 불가도 허용)
    for (const target of evalTargets) {
      const targetScores = scores[target.id];
      if (!targetScores) {
        toast.error(`${target.name}님의 평가가 비어있습니다`);
        return;
      }
      for (const q of tmpl.questions) {
        if (targetScores[q.id] === undefined || targetScores[q.id] === 0) {
          toast.error(`${target.name}님의 "${q.text}" 항목이 비어있습니다`);
          return;
        }
      }
    }

    if (!confirm("최종 제출 후에는 수정할 수 없습니다. 제출하시겠습니까?")) return;

    setLoading(true);
    try {
      const responses = evalTargets.map((t) => ({
        targetId: t.id,
        scores: scores[t.id],
        strength: strengths[t.id] || "",
        improvement: improvements[t.id] || "",
      }));

      const res = await fetch(`/api/eval/${token}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, submit: true }),
      });

      if (!res.ok) throw new Error();
      toast.success("평가가 제출되었습니다");
      setStep("done");
    } catch {
      toast.error("제출에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  // Step: 완료
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-2xl font-bold">평가 완료</p>
            <p className="text-muted-foreground">
              소중한 피드백 감사합니다. 결과는 익명으로 처리됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: 제외 대상 설정 (전직원 평가만)
  if (step === "exclusion") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{data.round.title}</CardTitle>
              <CardDescription>
                {data.evaluator.name}님, 안녕하세요!
                <br />
                협업 경험이 부족한 동료가 있다면 평가에서 제외할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const teamGroups = new Map<string, Employee[]>();
                for (const t of data.teammates) {
                  if (!teamGroups.has(t.team)) teamGroups.set(t.team, []);
                  teamGroups.get(t.team)!.push(t);
                }
                return Array.from(teamGroups.entries()).map(([team, members]) => (
                  <div key={team} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">{team}</h3>
                    {members.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 p-3 border rounded-md">
                        <Checkbox
                          id={`exclude-${t.id}`}
                          checked={excludedIds.has(t.id)}
                          onCheckedChange={(checked) => {
                            const next = new Set(excludedIds);
                            if (checked) next.add(t.id);
                            else next.delete(t.id);
                            setExcludedIds(next);
                          }}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`exclude-${t.id}`}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {t.name} ({t.position})
                          </label>
                          {excludedIds.has(t.id) && (
                            <Textarea
                              className="mt-2"
                              placeholder="제외 사유 (예: 협업 경험 부족)"
                              value={excludeReasons[t.id] || ""}
                              onChange={(e) =>
                                setExcludeReasons((prev) => ({
                                  ...prev,
                                  [t.id]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}

              <Button onClick={saveExclusions} className="w-full" disabled={loading}>
                {loading ? "저장 중..." : "확인 후 평가 시작"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step: 평가 작성
  const isPeer = data.template === "peer";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 진행 상태 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {data.evaluator.name}님의 {tmpl.name}
              </span>
              <span className="text-sm font-medium">
                {currentIdx + 1} / {evalTargets.length}명
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${((currentIdx + 1) / evalTargets.length) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 현재 대상 평가 */}
        {currentTarget && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentTarget.name}
                <Badge variant="secondary">{currentTarget.team}</Badge>
                <Badge variant="outline">{currentTarget.position}</Badge>
              </CardTitle>
              <CardDescription>
                {isPeer
                  ? <>아래 항목에 대해 1~{tmpl.maxScore}점으로 평가해주세요. 평가가 어려운 항목은 &quot;평가 불가&quot;를 체크하면 점수 산출에서 제외됩니다.</>
                  : <>아래 항목에 대해 1~{tmpl.maxScore}점으로 평가해주세요.</>
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {tmpl.questions.map((q) => {
                const isNA = scores[currentTarget.id]?.[q.id] === SCORE_NA;
                return (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm">
                      <Badge variant="outline" className="mr-2">
                        {q.category}
                      </Badge>
                      {q.text}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.scoreOptions.map((score) => (
                        <Button
                          key={score}
                          variant={
                            scores[currentTarget.id]?.[q.id] === score
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={isPeer ? "w-9 h-9 p-0" : "h-9 px-3"}
                          disabled={isNA}
                          onClick={() => setScore(currentTarget.id, q.id, score)}
                        >
                          {tmpl.scoreLabels ? (
                            <>
                              <span className="hidden sm:inline">{tmpl.scoreLabels[score]}</span>
                              <span className="sm:hidden">{score}</span>
                            </>
                          ) : (
                            score
                          )}
                        </Button>
                      ))}
                    </div>
                    {tmpl.hasNaOption && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`na-${currentTarget.id}-${q.id}`}
                          checked={isNA}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setScore(currentTarget.id, q.id, SCORE_NA);
                            } else {
                              setScores((prev) => {
                                const copy = { ...prev };
                                if (copy[currentTarget.id]) {
                                  const { [q.id]: _, ...rest } = copy[currentTarget.id];
                                  copy[currentTarget.id] = rest;
                                }
                                return copy;
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`na-${currentTarget.id}-${q.id}`}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          평가 불가
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}

              <Separator />

              {isPeer ? (
                <>
                  <div className="space-y-2">
                    <Label>이 동료의 강점은 무엇인가요? (선택)</Label>
                    <Textarea
                      value={strengths[currentTarget.id] || ""}
                      onChange={(e) =>
                        setStrengths((prev) => ({
                          ...prev,
                          [currentTarget.id]: e.target.value,
                        }))
                      }
                      placeholder="구체적인 사례와 함께 작성해주세요"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>개선이 필요한 점은 무엇인가요? (선택)</Label>
                    <Textarea
                      value={improvements[currentTarget.id] || ""}
                      onChange={(e) =>
                        setImprovements((prev) => ({
                          ...prev,
                          [currentTarget.id]: e.target.value,
                        }))
                      }
                      placeholder="건설적인 피드백을 작성해주세요"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>{tmpl.subjectivePrompt} (선택)</Label>
                  <Textarea
                    value={strengths[currentTarget.id] || ""}
                    onChange={(e) =>
                      setStrengths((prev) => ({
                        ...prev,
                        [currentTarget.id]: e.target.value,
                      }))
                    }
                    placeholder="자유롭게 작성해주세요"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-between pt-4">
                <div className="flex gap-2">
                  {currentIdx === 0 && isPeer ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("exclusion");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      제외 설정으로
                    </Button>
                  ) : currentIdx > 0 ? (
                    <Button
                      variant="outline"
                      onClick={goToPrev}
                    >
                      이전
                    </Button>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveDraft}>
                    임시 저장
                  </Button>
                  {currentIdx < evalTargets.length - 1 ? (
                    <Button onClick={goToNext}>
                      다음
                    </Button>
                  ) : (
                    <Button onClick={submitAll} disabled={loading}>
                      {loading ? "제출 중..." : "최종 제출"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
