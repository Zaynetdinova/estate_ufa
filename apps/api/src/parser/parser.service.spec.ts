import { ParserService } from './parser.service';

describe('ParserService без puppeteer', () => {
  it('возвращает mock-данные вместо падения', async () => {
    const service = new ParserService({} as any);
    jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    const items = await (service as any).scrapeUfaNovostroyka();

    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toBe('ЖК Тест-Парсер');
  });
});
