CREATE TABLE "ApiRateLimitBucket" (
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ApiRateLimitBucket_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX "ApiRateLimitBucket_windowStart_idx" ON "ApiRateLimitBucket"("windowStart");
