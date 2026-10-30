import { BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadClassification } from './lead-classifier.service';
import { N8nEventType } from '../n8n/n8n.types';

function createService(classification: LeadClassification | null = null) {
  const prisma = {
    user: { findUnique: jest.fn() },
    userEvent: { count: jest.fn(), findMany: jest.fn() },
    lead: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })) },
  };
  const n8n = { sendEvent: jest.fn().mockResolvedValue(undefined) };
  const scoring = { calculateUserScore: jest.fn().mockResolvedValue(0) };
  const classifier = { classify: jest.fn().mockResolvedValue(classification), model: 'test-model' };
  const service = new LeadsService(prisma as any, n8n as any, scoring as any, classifier as any);
  return { service, prisma, n8n, classifier };
}

const urgentBuy: LeadClassification = {
  name: 'Анна', budget: 6_000_000, rooms: 1, category: 'buy', urgency: 'high', summary: 'Ищет однушку срочно',
};

describe('LeadsService.create', () => {
  it('анонимная заявка без телефона отклоняется до обращения к модели', async () => {
    const { service, classifier } = createService();
    await expect(service.create({ source: 'manual', message: 'Ищу однушку' })).rejects.toBeInstanceOf(BadRequestException);
    expect(classifier.classify).not.toHaveBeenCalled();
  });

  it('сохраняет AI-разбор и отправляет горячий лид в n8n', async () => {
    const { service, prisma, n8n } = createService(urgentBuy);
    await service.create({ source: 'manual', contactPhone: '+7 900 000-00-00', message: 'Я Анна, ищу однушку до 6 млн, срочно' });

    const { data } = prisma.lead.create.mock.calls[0][0];
    expect(data).toMatchObject({
      score: 0,
      contactName: 'Анна',
      contactPhone: '+7 900 000-00-00',
      category: 'buy',
      urgency: 'high',
      aiSummary: 'Ищет однушку срочно',
      classification: { name: 'Анна', budget: 6_000_000, rooms: 1, model: 'test-model' },
    });

    const [eventType, payload] = n8n.sendEvent.mock.calls[0];
    expect(eventType).toBe(N8nEventType.NEW_LEAD);
    expect(payload).toMatchObject({ isHot: true, category: 'buy', urgency: 'high', userName: 'Анна', budgetMax: 6_000_000 });
  });

  it('сбой модели не мешает сохранить лид', async () => {
    const { service, prisma, n8n } = createService(null);
    await service.create({ source: 'manual', contactName: 'Олег', contactPhone: '89000000000', message: 'Перезвоните' });

    expect(prisma.lead.create.mock.calls[0][0].data).toMatchObject({
      contactName: 'Олег', category: null, urgency: null, aiSummary: null, classification: undefined,
    });
    expect(n8n.sendEvent.mock.calls[0][1]).toMatchObject({ isHot: false });
  });

  it('без текста заявки модель не вызывается', async () => {
    const { service, classifier } = createService(urgentBuy);
    await service.create({ source: 'manual', contactPhone: '89000000000' });
    expect(classifier.classify).not.toHaveBeenCalled();
  });
});
