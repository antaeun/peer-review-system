import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: [{ team: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, team, position, role } = body;

  if (!name || !email || !team || !position) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }

  const existing = await prisma.employee.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: { name, email, team, position, role: role || "EMPLOYEE" },
  });

  return NextResponse.json(employee, { status: 201 });
}
