-- Create PasswordResetToken table
CREATE TABLE "PasswordResetToken" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
