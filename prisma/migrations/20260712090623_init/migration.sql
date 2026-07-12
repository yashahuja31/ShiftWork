-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "career" TEXT NOT NULL DEFAULT 'trauma_surgeon',
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "endingKey" TEXT NOT NULL,
    "finalStress" INTEGER NOT NULL,
    "finalEnergy" INTEGER NOT NULL,
    "finalRep" INTEGER NOT NULL,
    "finalMoney" INTEGER NOT NULL,
    "highlights" INTEGER NOT NULL,
    "decisions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SimulationRun_userId_idx" ON "SimulationRun"("userId");
