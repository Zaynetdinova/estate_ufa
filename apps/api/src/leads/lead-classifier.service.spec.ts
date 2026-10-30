import { isHotLead, parseLeadClassification } from './lead-classifier.service';

const valid = {
  name: 'Анна',
  budget: 6_000_000,
  rooms: 1,
  category: 'buy',
  urgency: 'high',
  summary: 'Анна ищет однокомнатную квартиру до 6 млн рублей, срочно',
};
const parse = (value: unknown) => parseLeadClassification(JSON.stringify(value));

describe('parseLeadClassification', () => {
  it('принимает корректный ответ модели', () => {
    expect(parse(valid)).toEqual(valid);
  });

  it('снимает markdown-обёртку ```json', () => {
    expect(parseLeadClassification('```json\n' + JSON.stringify(valid) + '\n```')).toEqual(valid);
  });

  it('пустые поля превращает в null', () => {
    expect(parse({ ...valid, name: '  ', budget: null, rooms: undefined })).toMatchObject({
      name: null, budget: null, rooms: null,
    });
  });

  it('отклоняет не-JSON и не-объекты', () => {
    expect(parseLeadClassification('Конечно! Вот разбор заявки')).toBeNull();
    expect(parseLeadClassification('[]')).toBeNull();
    expect(parseLeadClassification('')).toBeNull();
    expect(parseLeadClassification(null)).toBeNull();
  });

  it('отклоняет недопустимую категорию и срочность', () => {
    expect(parse({ ...valid, category: 'vip' })).toBeNull();
    expect(parse({ ...valid, urgency: 'critical' })).toBeNull();
  });

  it('отклоняет бюджет строкой или отрицательный', () => {
    expect(parse({ ...valid, budget: '6 млн' })).toBeNull();
    expect(parse({ ...valid, budget: -1 })).toBeNull();
  });

  it('отклоняет дробное или нереальное число комнат', () => {
    expect(parse({ ...valid, rooms: 1.5 })).toBeNull();
    expect(parse({ ...valid, rooms: 42 })).toBeNull();
  });

  it('студию (0 комнат) принимает', () => {
    expect(parse({ ...valid, rooms: 0 })?.rooms).toBe(0);
  });

  it('обрезает слишком длинное summary', () => {
    expect(parse({ ...valid, summary: 'а'.repeat(1000) })?.summary).toHaveLength(300);
  });
});

describe('isHotLead', () => {
  it('горячий по score ≥ 10 без разбора', () => {
    expect(isHotLead(10, null)).toBe(true);
    expect(isHotLead(9, null)).toBe(false);
  });

  it('горячий по срочной заявке при низком score', () => {
    expect(isHotLead(0, { category: 'buy', urgency: 'high' })).toBe(true);
    expect(isHotLead(0, { category: 'consult', urgency: 'medium' })).toBe(false);
  });

  it('спам никогда не горячий', () => {
    expect(isHotLead(20, { category: 'spam', urgency: 'high' })).toBe(false);
  });
});
