import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roundId } = await params;

  const round = await prisma.evalRound.findUnique({ where: { id: roundId } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const results = await prisma.result.findMany({
    where: { roundId },
    include: { target: true },
    orderBy: { totalAvg: "desc" },
  });

  // 익명 코멘트
  const anonResponses = await prisma.responseAnon.findMany({
    where: { roundId },
  });

  return NextResponse.json({ round, results, anonResponses });
}
