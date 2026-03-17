-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EvalRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EvalToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME,
    "exclusionConfirmed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EvalToken_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvalToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exclusion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confirmedAt" DATETIME NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    CONSTRAINT "Exclusion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exclusion_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exclusion_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponseRaw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "targetId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "strength" TEXT,
    "improvement" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResponseRaw_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResponseRaw_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResponseRaw_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponseAnon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "strength" TEXT,
    "improvement" TEXT,
    CONSTRAINT "ResponseAnon_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "avgScores" JSONB NOT NULL,
    "totalAvg" REAL NOT NULL,
    "evalCount" INTEGER NOT NULL,
    CONSTRAINT "Result_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EvalRound" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Result_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EvalToken_token_key" ON "EvalToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EvalToken_roundId_employeeId_key" ON "EvalToken"("roundId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Exclusion_roundId_evaluatorId_targetId_key" ON "Exclusion"("roundId", "evaluatorId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseRaw_roundId_evaluatorId_targetId_key" ON "ResponseRaw"("roundId", "evaluatorId", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_roundId_targetId_key" ON "Result"("roundId", "targetId");
