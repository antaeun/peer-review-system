import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "EvalRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "EvalToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "exclusionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EvalToken_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvalToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Exclusion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confirmedAt" DATETIME NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    CONSTRAINT "Exclusion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exclusion_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exclusion_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ResponseRaw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "targetId" TEXT NOT NULL,
    "scores" TEXT NOT NULL,
    "strength" TEXT,
    "improvement" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResponseRaw_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResponseRaw_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResponseRaw_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ResponseAnon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "scores" TEXT NOT NULL,
    "strength" TEXT,
    "improvement" TEXT,
    CONSTRAINT "ResponseAnon_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "avgScores" TEXT NOT NULL,
    "totalAvg" REAL NOT NULL,
    "evalCount" INTEGER NOT NULL,
    CONSTRAINT "Result_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Result_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EvalToken_token_key" ON "EvalToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EvalToken_roundId_employeeId_key" ON "EvalToken"("roundId", "employeeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Exclusion_roundId_evaluatorId_targetId_key" ON "Exclusion"("roundId", "evaluatorId", "targetId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ResponseRaw_roundId_evaluatorId_targetId_key" ON "ResponseRaw"("roundId", "evaluatorId", "targetId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Result_roundId_targetId_key" ON "Result"("roundId", "targetId")`,
];

async function main() {
  console.log("Turso DB 테이블 생성 중...");
  for (const sql of statements) {
    await client.execute(sql);
  }
  console.log("모든 테이블 생성 완료!");

  // 테이블 확인
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("\n생성된 테이블:");
  for (const row of result.rows) {
    console.log(`  - ${row.name}`);
  }
}

main().catch(console.error);
