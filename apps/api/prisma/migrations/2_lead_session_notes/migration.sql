-- Связь лида с перепиской в чате и заметки менеджера
ALTER TABLE "leads" ADD COLUMN "session_id" VARCHAR(64),
ADD COLUMN "manager_notes" TEXT;

-- CreateIndex
CREATE INDEX "leads_session_id_idx" ON "leads"("session_id");
