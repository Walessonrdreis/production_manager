-- CreateTable
CREATE TABLE "job_lock" (
    "key" VARCHAR(64) NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_lock_pkey" PRIMARY KEY ("key")
);
