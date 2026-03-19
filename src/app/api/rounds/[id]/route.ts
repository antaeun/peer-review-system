import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const round = await prisma.evalRound.findUnique({
    where: { id },
    include: {
      tokens: { include: { employee: true } },
      exclusions: { include: { evaluator: true, target: true } },
      _count: { select: { responses: true, anonResponses: true } },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(round);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const round = await prisma.evalRound.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(round);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 관련 데이터를 순서대로 삭제 (외래키 제약)
    await prisma.result.deleteMany({ where: { roundId: id } });
    await prisma.responseAnon.deleteMany({ where: { roundId: id } });
    await prisma.responseRaw.deleteMany({ where: { roundId: id } });
    await prisma.exclusion.deleteMany({ where: { roundId: id } });
    await prisma.evalToken.deleteMany({ where: { roundId: id } });
    await prisma.evalRound.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rounds/[id] error:", error);
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }
}
