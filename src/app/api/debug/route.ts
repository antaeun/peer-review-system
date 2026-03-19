import { NextResponse } from "next/server";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const info: Record<string, unknown> = {
    hasUrl: !!tursoUrl,
    urlValue: tursoUrl?.substring(0, 30) + "...",
    hasToken: !!tursoToken,
    tokenLength: tursoToken?.length,
    tokenStart: tursoToken?.substring(0, 20) + "...",
    nodeEnv: process.env.NODE_ENV,
  };

  // Test direct libsql connection
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: tursoUrl!,
      authToken: tursoToken,
    });
    const result = await client.execute("SELECT 1 as test");
    info.directConnection = "OK";
    info.directResult = result.rows;
  } catch (e) {
    info.directConnection = "FAILED";
    info.directError = e instanceof Error ? e.message : String(e);
  }

  // Test Prisma connection
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.employee.findMany({ take: 1 });
    info.prismaConnection = "OK";
    info.prismaResult = count;
  } catch (e) {
    info.prismaConnection = "FAILED";
    info.prismaError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
