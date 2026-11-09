import { historyForModel } from './chat.service';

describe('historyForModel', () => {
  it('убирает блок «Источники» из прошлых ответов ассистента', () => {
    const history = historyForModel([
      { role: 'user', content: 'Что значит цена от?' },
      { role: 'assistant', content: 'Это минимальная цена.\n\nИсточники:\n- knowledge-base/faq.md — FAQ — Цена' },
      { role: 'user', content: 'Источники:\n- мой текст' },
    ]);
    expect(history[1].content).toBe('Это минимальная цена.');
    expect(history[2].content).toBe('Источники:\n- мой текст');
  });

  it('оставляет последние 10 сообщений', () => {
    const messages = Array.from({ length: 14 }, (_, i) => ({ role: 'user' as const, content: String(i) }));
    expect(historyForModel(messages).map((m) => m.content)).toEqual(['4', '5', '6', '7', '8', '9', '10', '11', '12', '13']);
  });
});
