import axios from 'axios';
import { TelegramService, formatLeadMessage } from './telegram.service';
import { NewLeadPayload } from '../n8n/n8n.types';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, __esModule: true, default: { ...actual, post: jest.fn(), isAxiosError: actual.isAxiosError } };
});

const post = axios.post as jest.Mock;

const lead: NewLeadPayload = {
  leadId: 7, source: 'chat', score: 12, isHot: true,
  userName: 'Анна <script>', userPhone: '+7 900 000-00-00',
  message: 'Ищу двушку & побыстрее', category: 'buy', urgency: 'high', summary: 'Ищет двушку',
  notes: 'ЖК Солнечный',
};

function createService(env: Record<string, string>) {
  return new TelegramService({ get: (key: string) => env[key] } as any);
}

describe('formatLeadMessage', () => {
  it('экранирует HTML из текста клиента и добавляет ссылку на лид', () => {
    const text = formatLeadMessage({ ...lead, hasChat: true }, 'https://site.ru/admin/leads?id=7');
    expect(text).toContain('ГОРЯЧИЙ ЛИД #7');
    expect(text).toContain('Анна &lt;script&gt;');
    expect(text).toContain('двушку &amp; побыстрее');
    expect(text).toContain('💬 Чат — ЖК Солнечный');
    expect(text).toContain('Есть переписка');
    expect(text).toContain('<a href="https://site.ru/admin/leads?id=7">');
    expect(text).not.toMatch(/\n\n\n/);
  });
});

describe('TelegramService', () => {
  beforeEach(() => post.mockReset().mockResolvedValue({ data: { ok: true } }));

  it('без токена ничего не отправляет', async () => {
    await createService({ TELEGRAM_CHAT_ID: '1' }).notifyNewLead(lead);
    expect(post).not.toHaveBeenCalled();
  });

  it('отправляет всем получателям из TELEGRAM_CHAT_ID', async () => {
    const service = createService({ TELEGRAM_BOT_TOKEN: 'tkn', TELEGRAM_CHAT_ID: '111, 222', FRONTEND_URL: 'https://site.ru/,http://localhost:3000' });
    await service.notifyNewLead(lead);

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls.map((call) => call[1].chat_id)).toEqual(['111', '222']);
    expect(post.mock.calls[0][0]).toBe('https://api.telegram.org/bottkn/sendMessage');
    expect(post.mock.calls[0][1].text).toContain('https://site.ru/admin/leads?id=7');
  });

  it('спам не отправляет', async () => {
    await createService({ TELEGRAM_BOT_TOKEN: 'tkn', TELEGRAM_CHAT_ID: '1' }).notifyNewLead({ ...lead, category: 'spam' });
    expect(post).not.toHaveBeenCalled();
  });

  it('сбой Telegram не пробрасывается', async () => {
    post.mockRejectedValue(new Error('boom'));
    await expect(createService({ TELEGRAM_BOT_TOKEN: 'tkn', TELEGRAM_CHAT_ID: '1' }).notifyNewLead(lead)).resolves.toBeUndefined();
  });
});
