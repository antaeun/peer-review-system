import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const employee = await prisma.employee.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(employee);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "비활성화 완료" });
}
