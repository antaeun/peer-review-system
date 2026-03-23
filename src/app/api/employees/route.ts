import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: [{ team: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, team, position, role } = body;

    if (!name || !email || !team || !position) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) {
        return NextResponse.json(
          {
            error: "inactive_exists",
            message: `비활성화된 직원(${existing.name})이 동일한 이메일로 등록되어 있습니다.`,
            employee: existing,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "이미 등록된 이메일입니다" }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: { name, email, team, position, role: role || "EMPLOYEE" },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
