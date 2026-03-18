import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 평가 라운드에 대해 모든 활성 직원에게 토큰 발급
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roundId } = await params;

  const round = await prisma.evalRound.findUnique({ where: { id: roundId } });
  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  // ADMIN 제외, 활성 직원만
  const employees = await prisma.employee.findMany({
    where: { isActive: true, role: { not: "ADMIN" } },
  });

  const existingTokens = await prisma.evalToken.findMany({
    where: { roundId },
    select: { employeeId: true },
  });
  const existingIds = new Set(existingTokens.map((t) => t.employeeId));

  const newEmployees = employees.filter((e) => !existingIds.has(e.id));

  if (newEmployees.length === 0) {
    return NextResponse.json({ message: "All tokens already issued", count: 0 });
  }

  await prisma.evalToken.createMany({
    data: newEmployees.map((e) => ({
      roundId,
      employeeId: e.id,
    })),
  });

  // 라운드 상태를 ACTIVE로 변경
  await prisma.evalRound.update({
    where: { id: roundId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({
    message: `${newEmployees.length} tokens issued`,
    count: newEmployees.length,
  });
}
