-- CreateEnum
CREATE TYPE "RateLimitType" AS ENUM ('GLOBAL', 'IP_ADDRESS', 'API_ROUTE', 'USER_ID');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "RateLimitType" NOT NULL,
    "identifier" TEXT,
    "maxRequests" INTEGER NOT NULL,
    "windowMs" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "apiRoute" TEXT,
    "ipAddress" TEXT,
    "userId" TEXT,
    "isAllowed" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_apiKey_key" ON "tenants"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_tenantId_type_identifier_key" ON "rate_limits"("tenantId", "type", "identifier");

-- CreateIndex
CREATE INDEX "request_logs_tenantId_timestamp_idx" ON "request_logs"("tenantId", "timestamp");

-- AddForeignKey
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
