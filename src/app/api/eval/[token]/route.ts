import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 토큰으로 평가 정보 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const evalToken = await prisma.evalToken.findUnique({
    where: { token },
    include: {
      employee: true,
      round: true,
    },
  });

  if (!evalToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (evalToken.round.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This evaluation round is not active" },
      { status: 400 }
    );
  }

  // 자기 자신과 ADMIN을 제외한 모든 활성 직원
  const teammates = await prisma.employee.findMany({
    where: {
      id: { not: evalToken.employeeId },
      isActive: true,
      role: { not: "ADMIN" },
    },
    orderBy: [{ team: "asc" }, { name: "asc" }],
  });

  // 이미 제외한 대상
  const exclusions = await prisma.exclusion.findMany({
    where: {
      roundId: evalToken.roundId,
      evaluatorId: evalToken.employeeId,
    },
    include: { target: true },
  });

  // 기존 응답 (임시저장 포함)
  const responses = await prisma.responseRaw.findMany({
    where: {
      roundId: evalToken.roundId,
      evaluatorId: evalToken.employeeId,
    },
    include: { target: true },
  });

  return NextResponse.json({
    evaluator: evalToken.employee,
    round: evalToken.round,
    isSubmitted: evalToken.isSubmitted,
    exclusionConfirmed: evalToken.exclusionConfirmed,
    teammates,
    exclusions,
    responses,
  });
}
