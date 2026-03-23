import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    await client.execute(
      `ALTER TABLE "EvalRound" ADD COLUMN "template" TEXT NOT NULL DEFAULT 'peer'`
    );
    console.log("template 컬럼 추가 완료");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column")) {
      console.log("template 컬럼이 이미 존재합니다");
    } else {
      throw e;
    }
  }

  const result = await client.execute(`PRAGMA table_info("EvalRound")`);
  console.log("EvalRound 컬럼 목록:");
  for (const row of result.rows) {
    console.log(`  - ${row.name} (${row.type})`);
  }
}

main().catch(console.error);
