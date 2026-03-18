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
