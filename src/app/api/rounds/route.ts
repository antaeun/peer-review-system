import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rounds = await prisma.evalRound.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tokens: true, responses: true } },
    },
  });
  return NextResponse.json(rounds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, startDate, endDate, message } = body;

  const round = await prisma.evalRound.create({
    data: {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      message: message || null,
      status: "DRAFT",
    },
  });

  return NextResponse.json(round, { status: 201 });
}
