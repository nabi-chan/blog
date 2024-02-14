-- CreateTable
CREATE TABLE "Database" (
    "initilizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Database_initilizedAt_key" ON "Database"("initilizedAt");
