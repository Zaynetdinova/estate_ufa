import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NewLeadPayload } from '../n8n/n8n.types';

const SOURCE_LABEL: Record<string, string> = { chat: '💬 Чат', manual: '👆 Страница ЖК', calculator: '🧮 Калькулятор' };
const CATEGORY_LABEL: Record<string, string> = { buy: '🏠 Покупка', rent_out: '🔑 Хочет сдать', consult: '❓ Консультация', spam: '🗑 Спам' };
const URGENCY_LABEL: Record<string, string> = { high: '⚡ срочно', medium: '⏳ есть срок', low: 'без спешки' };

// Текст заявки пишет посетитель сайта: экранируем HTML, иначе Telegram отклонит сообщение
const esc = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) + '…' : text);

const millions = (value?: number) => (value ? `${(value / 1_000_000).toFixed(1)} млн` : '?');

/** Текст уведомления о новом лиде (Telegram, parse_mode = HTML). */
export function formatLeadMessage(lead: NewLeadPayload & { hasChat?: boolean }, adminUrl?: string): string {
  const lines = [
    lead.isHot ? `🔥 <b>ГОРЯЧИЙ ЛИД #${lead.leadId}</b> — позвоните как можно скорее` : `🆕 <b>Новый лид #${lead.leadId}</b>`,
    '',
    `👤 ${esc(lead.userName) || 'Без имени'}${lead.userPhone ? ` · ${esc(lead.userPhone)}` : ''}`,
    lead.userEmail ? `📧 ${esc(lead.userEmail)}` : '',
    `📍 ${SOURCE_LABEL[lead.source] ?? esc(lead.source)}${lead.notes ? ` — ${esc(clip(lead.notes, 300))}` : ''}`,
    '',
    lead.category
      ? `${CATEGORY_LABEL[lead.category] ?? esc(lead.category)}${lead.urgency ? ` · ${URGENCY_LABEL[lead.urgency] ?? esc(lead.urgency)}` : ''}`
      : '',
    lead.summary ? `🤖 ${esc(lead.summary)}` : '',
    lead.message ? `💬 «${esc(clip(lead.message, 500))}»` : '',
    lead.budgetMin || lead.budgetMax ? `💰 Бюджет: ${millions(lead.budgetMin)} — ${millions(lead.budgetMax)} ₽` : '',
    `📊 Скор: ${lead.score}/20`,
    lead.hasChat ? '🗨 Есть переписка с AI-консультантом — смотрите в карточке лида' : '',
    adminUrl ? `\n<a href="${esc(adminUrl)}">Открыть в админке</a>` : '',
  ];

  // Пустые строки-разделители не должны идти подряд
  return lines
    .filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== ''))
    .join('\n')
    .trim();
}

/**
 * Уведомления менеджерам в Telegram напрямую из API — работает и без n8n (на Vercel).
 * Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID (несколько получателей — через запятую).
 * Без них уведомления выключены; ошибки отправки логируются и не роняют запрос.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | undefined;
  private readonly chatIds: string[];
  private readonly frontendUrl: string | undefined;

  constructor(config: ConfigService) {
    this.token = config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || undefined;
    this.chatIds = (config.get<string>('TELEGRAM_CHAT_ID') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    this.frontendUrl = config.get<string>('FRONTEND_URL')?.split(',')[0]?.trim().replace(/\/$/, '') || undefined;
  }

  get enabled(): boolean {
    return Boolean(this.token && this.chatIds.length);
  }

  async notifyNewLead(lead: NewLeadPayload & { hasChat?: boolean }): Promise<void> {
    if (!this.enabled) return;
    if (lead.category === 'spam') return;

    const adminUrl = this.frontendUrl ? `${this.frontendUrl}/admin/leads?id=${lead.leadId}` : undefined;
    const text = formatLeadMessage(lead, adminUrl);

    await Promise.all(this.chatIds.map((chatId) => this.send(chatId, text)));
  }

  private async send(chatId: string, text: string): Promise<void> {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true },
        { timeout: 5000 },
      );
    } catch (err: unknown) {
      // Текст ошибки axios содержит URL с токеном — логируем только описание от Telegram
      const description = axios.isAxiosError(err)
        ? (err.response?.data as { description?: string } | undefined)?.description ?? err.code ?? 'network error'
        : String(err);
      this.logger.warn(`Telegram notification to ${chatId} failed: ${description}`);
    }
  }
}
