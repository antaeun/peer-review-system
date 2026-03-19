import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 평가 마감: 응답 익명화 + 결과 집계
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roundId } = await params;

  const round = await prisma.evalRound.findUnique({ where: { id: roundId } });
  if (!round || round.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Round not found or not active" },
      { status: 400 }
    );
  }

  // 1. 제출된 응답만 가져오기
  const responses = await prisma.responseRaw.findMany({
    where: { roundId, isDraft: false },
  });

  // 2. 익명화: evaluatorId 제거 후 ResponseAnon에 저장
  const anonData = responses.map((r) => ({
    roundId: r.roundId,
    targetId: r.targetId,
    scores: r.scores as object,
    strength: r.strength,
    improvement: r.improvement,
  }));

  await prisma.responseAnon.createMany({ data: anonData });

  // 3. 결과 집계: 대상별 평균 점수 계산
  const targetGroups = new Map<
    string,
    { scores: Record<string, number>[]; count: number }
  >();

  for (const r of responses) {
    const scores = r.scores as Record<string, number>;
    if (!targetGroups.has(r.targetId)) {
      targetGroups.set(r.targetId, { scores: [], count: 0 });
    }
    const group = targetGroups.get(r.targetId)!;
    group.scores.push(scores);
    group.count++;
  }

  for (const [targetId, group] of targetGroups) {
    const keys = Object.keys(group.scores[0] || {});
    const avgScores: Record<string, number> = {};
    let totalSum = 0;
    let validKeyCount = 0;

    for (const key of keys) {
      // SCORE_NA(-1) 값을 제외하고 평균 계산
      const validScores = group.scores
        .map((s) => s[key] || 0)
        .filter((v) => v !== -1);
      if (validScores.length > 0) {
        const sum = validScores.reduce((acc, v) => acc + v, 0);
        avgScores[key] = Math.round((sum / validScores.length) * 100) / 100;
        totalSum += avgScores[key];
        validKeyCount++;
      } else {
        avgScores[key] = 0;
      }
    }

    const totalAvg =
      validKeyCount > 0
        ? Math.round((totalSum / validKeyCount) * 100) / 100
        : 0;

    await prisma.result.upsert({
      where: { roundId_targetId: { roundId, targetId } },
      update: { avgScores, totalAvg, evalCount: group.count },
      create: { roundId, targetId, avgScores, totalAvg, evalCount: group.count },
    });
  }

  // 4. 라운드 상태 변경
  await prisma.evalRound.update({
    where: { id: roundId },
    data: { status: "CLOSED" },
  });

  return NextResponse.json({
    message: "Round closed",
    anonymized: anonData.length,
    results: targetGroups.size,
  });
}
