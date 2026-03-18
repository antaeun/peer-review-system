import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 제외 대상 설정 (협업 부족 등)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const { exclusions } = body as {
    exclusions: { targetId: string; reason: string }[];
  };

  const evalToken = await prisma.evalToken.findUnique({
    where: { token },
    include: { round: true },
  });

  if (!evalToken || evalToken.round.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid or inactive" }, { status: 400 });
  }

  // 기존 제외 삭제 후 재생성
  await prisma.exclusion.deleteMany({
    where: {
      roundId: evalToken.roundId,
      evaluatorId: evalToken.employeeId,
    },
  });

  if (exclusions.length > 0) {
    await prisma.exclusion.createMany({
      data: exclusions.map((ex) => ({
        roundId: evalToken.roundId,
        evaluatorId: evalToken.employeeId,
        targetId: ex.targetId,
        reason: ex.reason,
        confirmedAt: new Date(),
      })),
    });
  }

  // 제외 확인 완료
  await prisma.evalToken.update({
    where: { id: evalToken.id },
    data: { exclusionConfirmed: true },
  });

  return NextResponse.json({ message: "Exclusions saved" });
}
