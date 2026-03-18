import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 평가 응답 저장 (임시저장 / 최종제출)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const { responses, submit } = body as {
    responses: {
      targetId: string;
      scores: Record<string, number>;
      strength?: string;
      improvement?: string;
    }[];
    submit?: boolean;
  };

  const evalToken = await prisma.evalToken.findUnique({
    where: { token },
    include: { round: true },
  });

  if (!evalToken || evalToken.round.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid or inactive" }, { status: 400 });
  }

  if (evalToken.isSubmitted) {
    return NextResponse.json(
      { error: "Already submitted" },
      { status: 400 }
    );
  }

  // 각 응답 upsert
  for (const r of responses) {
    await prisma.responseRaw.upsert({
      where: {
        roundId_evaluatorId_targetId: {
          roundId: evalToken.roundId,
          evaluatorId: evalToken.employeeId,
          targetId: r.targetId,
        },
      },
      update: {
        scores: r.scores,
        strength: r.strength || null,
        improvement: r.improvement || null,
        isDraft: !submit,
      },
      create: {
        roundId: evalToken.roundId,
        evaluatorId: evalToken.employeeId,
        targetId: r.targetId,
        scores: r.scores,
        strength: r.strength || null,
        improvement: r.improvement || null,
        isDraft: !submit,
      },
    });
  }

  // 최종 제출 시 토큰 상태 변경
  if (submit) {
    await prisma.evalToken.update({
      where: { id: evalToken.id },
      data: { isSubmitted: true, submittedAt: new Date() },
    });
  }

  return NextResponse.json({
    message: submit ? "Submitted" : "Draft saved",
  });
}
