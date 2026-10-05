import { ScoringService } from './scoring.service';

type Signals = {
  usedCalculator?: boolean;
  viewedProperties?: number;
  messages?: string[];
  selectionRequests?: number;
};

function createService(signals: Signals = {}) {
  const prisma = {
    userEvent: { count: jest.fn().mockResolvedValue(signals.selectionRequests ?? 0) },
    chatMessage: {
      findMany: jest.fn().mockResolvedValue((signals.messages ?? []).map((content) => ({ content }))),
    },
  };
  const events = {
    usedCalculator: jest.fn().mockResolvedValue(signals.usedCalculator ?? false),
    countViewedProperties: jest.fn().mockResolvedValue(signals.viewedProperties ?? 0),
  };
  return new ScoringService(prisma as any, events as any);
}

describe('ScoringService', () => {
  it('без сигналов даёт 0', async () => {
    await expect(createService().calculateUserScore(1)).resolves.toBe(0);
  });

  it('+2 за калькулятор', async () => {
    await expect(createService({ usedCalculator: true }).calculateUserScore(1)).resolves.toBe(2);
  });

  it('+3 только если просмотрено больше 3 ЖК', async () => {
    await expect(createService({ viewedProperties: 3 }).calculateUserScore(1)).resolves.toBe(0);
    await expect(createService({ viewedProperties: 4 }).calculateUserScore(1)).resolves.toBe(3);
  });

  it('+5 за фразу о покупке без учёта регистра', async () => {
    const service = createService({ messages: ['Привет', 'Хочу КУПИТЬ двушку'] });
    await expect(service.calculateUserScore(1)).resolves.toBe(5);
  });

  it('обычные вопросы не считаются намерением купить', async () => {
    const service = createService({ messages: ['Какие есть ЖК в Советском районе?'] });
    await expect(service.calculateUserScore(1)).resolves.toBe(0);
  });

  it('+10 за запрос подборки — сразу горячий лид', async () => {
    await expect(createService({ selectionRequests: 1 }).calculateUserScore(1)).resolves.toBe(10);
  });

  it('все сигналы вместе дают максимум 20', async () => {
    const service = createService({
      usedCalculator: true,
      viewedProperties: 5,
      messages: ['куплю квартиру'],
      selectionRequests: 2,
    });
    await expect(service.calculateUserScore(1)).resolves.toBe(20);
  });
});
