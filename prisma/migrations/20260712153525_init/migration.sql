-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SimulationRun_userId_idx" ON "SimulationRun"("userId");

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
