CREATE TABLE "GoogleOAuthCredential" (
    "id" TEXT NOT NULL DEFAULT 'organizer',
    "encryptedRefreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleOAuthCredential_pkey" PRIMARY KEY ("id")
);
