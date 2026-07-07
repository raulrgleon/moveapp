-- AlterTable
ALTER TABLE "moves" ADD COLUMN IF NOT EXISTS "shopping_selections" JSONB;
