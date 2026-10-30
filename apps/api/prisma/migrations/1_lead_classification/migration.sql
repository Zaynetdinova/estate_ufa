-- Контакты, текст заявки и AI-разбор лида
ALTER TABLE "leads" ADD COLUMN "contact_name" VARCHAR(100),
ADD COLUMN "contact_phone" VARCHAR(30),
ADD COLUMN "message" TEXT,
ADD COLUMN "category" VARCHAR(20),
ADD COLUMN "urgency" VARCHAR(10),
ADD COLUMN "ai_summary" TEXT,
ADD COLUMN "classification" JSONB;

-- CreateIndex
CREATE INDEX "leads_category_idx" ON "leads"("category");
