import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTENT_TEAM_NAME } from "@/lib/questions";

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

  // 종료일 이후 평가 차단
  if (new Date() > new Date(evalToken.round.endDate)) {
    return NextResponse.json(
      { error: "평가 기간이 종료되었습니다" },
      { status: 400 }
    );
  }

  const template = evalToken.round.template || "peer";

  // 콘텐츠팀 평가: 콘텐츠팀원만 평가 대상
  // 전직원 평가: 자기 자신을 제외한 모든 활성 직원
  const teammates = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(template === "content"
        ? { team: CONTENT_TEAM_NAME }
        : { id: { not: evalToken.employeeId } }),
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
    template,
    isSubmitted: evalToken.isSubmitted,
    exclusionConfirmed: evalToken.exclusionConfirmed,
    teammates,
    exclusions,
    responses,
  });
}
