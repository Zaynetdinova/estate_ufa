import { ConfigService } from '@nestjs/config';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService.splitMarkdown', () => {
  const service = new KnowledgeService({} as any, new ConfigService({ OPENAI_API_KEY: 'test' }));

  it('делит по заголовкам # и ##, и каждый раздел получает свой заголовок', () => {
    const chunks = service.splitMarkdown([
      '# FAQ',
      '## Цена «от»',
      'Минимальная цена.',
      '---',
      '# 26. Инвестиции',
      'Рост цены не гарантирован.',
      '# 27. Доходность аренды',
      'Ставок аренды нет.',
    ].join('\n'));

    expect(chunks).toEqual([
      { title: 'FAQ — Цена «от»', content: 'Минимальная цена.' },
      { title: 'FAQ — 26. Инвестиции', content: 'Рост цены не гарантирован.' },
      { title: 'FAQ — 27. Доходность аренды', content: 'Ставок аренды нет.' },
    ]);
  });
});
