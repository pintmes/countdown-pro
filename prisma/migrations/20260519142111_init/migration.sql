-- CreateTable
CREATE TABLE "Timer" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'flash_sale',
    "endsAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "placement" TEXT NOT NULL DEFAULT 'announcement_bar',
    "targetType" TEXT NOT NULL DEFAULT 'all',
    "targetIds" TEXT NOT NULL DEFAULT '[]',
    "headline" TEXT NOT NULL DEFAULT 'Hurry! Sale ends in',
    "subtext" TEXT NOT NULL DEFAULT 'Don''t miss out on this deal',
    "endedText" TEXT NOT NULL DEFAULT 'This offer has ended',
    "backgroundColor" TEXT NOT NULL DEFAULT '#111827',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "showDays" BOOLEAN NOT NULL DEFAULT true,
    "hideWhenEnded" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timer_shop_active_idx" ON "Timer"("shop", "active");
