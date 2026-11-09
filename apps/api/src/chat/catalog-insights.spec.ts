import { buildCatalogInsights, formatCatalogInsights, formatPrice, roomsLabel, type CatalogPropertyInput } from './catalog-insights';

const property = (over: Partial<CatalogPropertyInput>): CatalogPropertyInput => ({
  slug: 'zhk', name: 'ЖК', district: 'Советский', status: 'building',
  deadlineQ: null, deadlineYear: null, priceFrom: 3_000_000, priceM2: 100_000,
  isHot: false, description: null, layouts: [], ...over,
});

const catalog: CatalogPropertyInput[] = [
  property({
    slug: 'sonata', name: 'ЖК Соната', district: 'Демский', priceFrom: 2_600_000, priceM2: 68_000,
    deadlineQ: 4, deadlineYear: 2025,
    layouts: [
      { rooms: 0, areaMin: 28, priceFrom: 1_950_000 },
      { rooms: 1, areaMin: 38, priceFrom: 2_600_000 },
      { rooms: 2, areaMin: 55, priceFrom: 3_900_000 },
    ],
  }),
  property({
    slug: 'prospekt', name: 'ЖК Проспект', district: 'Кировский', status: 'ready', priceFrom: 3_800_000, priceM2: 98_000,
    layouts: [{ rooms: 1, areaMin: 38, priceFrom: 3_800_000 }, { rooms: 3, areaMin: 80, priceFrom: null }],
  }),
  property({
    slug: 'galaxy', name: 'ЖК Galaxy', district: 'Кировский', priceFrom: 6_200_000, priceM2: 130_000,
    layouts: [{ rooms: 2, areaMin: 60, priceFrom: 6_200_000 }],
  }),
  property({ slug: 'nom2', name: 'ЖК Без цены за м²', district: 'Советский', priceFrom: 5_000_000, priceM2: null }),
];

describe('buildCatalogInsights', () => {
  const insights = buildCatalogInsights(catalog);

  it('сортирует самые дешёвые планировки по цене и пропускает планировки без цены', () => {
    expect(insights.cheapest.map((c) => [c.name, c.rooms, c.priceFrom])).toEqual([
      ['ЖК Соната', 'студия', 1_950_000],
      ['ЖК Соната', '1-комнатная', 2_600_000],
      ['ЖК Проспект', '1-комнатная', 3_800_000],
      ['ЖК Соната', '2-комнатная', 3_900_000],
      ['ЖК Galaxy', '2-комнатная', 6_200_000],
    ]);
  });

  it('считает медиану цены за м² и отклонение от неё', () => {
    expect(insights.medianPriceM2).toBe(98_000);
    const sonata = insights.properties.find((p) => p.slug === 'sonata')!;
    expect(sonata.priceM2VsMedian).toBe(-31);
    expect(insights.properties.find((p) => p.slug === 'prospekt')!.priceM2VsMedian).toBe(0);
  });

  it('ставит ЖК без цены за м² в конец списка', () => {
    expect(insights.properties.map((p) => p.slug)).toEqual(['sonata', 'prospekt', 'galaxy', 'nom2']);
    expect(insights.properties.at(-1)!.priceM2VsMedian).toBeNull();
  });

  it('находит самую дешёвую студию или однокомнатную и статус дома', () => {
    const sonata = insights.properties.find((p) => p.slug === 'sonata')!;
    expect(sonata.smallFlatFrom).toBe(1_950_000);
    expect(sonata.deadline).toBe('4 кв. 2025');
    // Цена ЖК в каталоге (2,6 млн) не совпадает с ценой студии — берём цены только из планировок
    expect(sonata.minPrice).toBe(1_950_000);
    expect(sonata.layouts[0]).toEqual({ rooms: 'студия', areaMin: 28, priceFrom: 1_950_000 });
    expect(insights.properties.find((p) => p.slug === 'prospekt')!.layouts).toHaveLength(1);
    expect(insights.properties.find((p) => p.slug === 'prospekt')!.status).toBe('сдан');
    expect(insights.properties.find((p) => p.slug === 'galaxy')!.smallFlatFrom).toBeNull();
  });

  it('сводит районы: число ЖК, сданные, минимальная и средняя цена за м²', () => {
    expect(insights.districts).toEqual([
      { district: 'Демский', propertyCount: 1, readyCount: 0, minPrice: 1_950_000, avgPriceM2: 68_000, properties: ['ЖК Соната'] },
      { district: 'Кировский', propertyCount: 2, readyCount: 1, minPrice: 3_800_000, avgPriceM2: 114_000, properties: ['ЖК Проспект', 'ЖК Galaxy'] },
      { district: 'Советский', propertyCount: 1, readyCount: 0, minPrice: null, avgPriceM2: null, properties: ['ЖК Без цены за м²'] },
    ]);
  });

  it('работает с пустым каталогом', () => {
    expect(buildCatalogInsights([])).toEqual({
      propertyCount: 0, medianPriceM2: null, cheapest: [],
      rental: { cheapestSmall: [], readySmall: [] }, properties: [], districts: [],
    });
  });

  it('подбирает студии и однокомнатные для аренды, отдельно в сданных домах', () => {
    expect(insights.rental.cheapestSmall.map((c) => [c.name, c.rooms])).toEqual([
      ['ЖК Соната', 'студия'], ['ЖК Соната', '1-комнатная'], ['ЖК Проспект', '1-комнатная'],
    ]);
    expect(insights.rental.readySmall.map((c) => [c.name, c.priceFrom])).toEqual([['ЖК Проспект', 3_800_000]]);
  });

  it('подписывает тип квартиры', () => {
    expect([roomsLabel(0), roomsLabel(2), roomsLabel(null)]).toEqual(['студия', '2-комнатная', 'не указано']);
  });
});

describe('formatCatalogInsights', () => {
  const text = formatCatalogInsights(buildCatalogInsights(catalog));

  it('форматирует цены в миллионах', () => {
    expect([formatPrice(1_950_000), formatPrice(2_175_000), formatPrice(10_000_000)])
      .toEqual(['1,95 млн ₽', '2,18 млн ₽', '10 млн ₽']);
  });

  it('выводит готовые разделы с цифрами', () => {
    expect(text).toContain('САМЫЕ ДЕШЁВЫЕ ПЛАНИРОВКИ:\n1. ЖК Соната — Демский район, студия, от 28 м², от 1,95 млн ₽');
    expect(text).toContain('в уже сданных домах:\n1. ЖК Проспект — Кировский район, 1-комнатная, от 38 м², от 3,8 млн ₽');
    expect(text).toContain('- ЖК Соната: Демский район, строится, срок сдачи 4 кв. 2025, 68\u00a0000 ₽/м², 31% ниже медианы, квартиры от 1,95 млн ₽.');
    expect(text).toContain('- Кировский: ЖК 2 (ЖК Проспект, ЖК Galaxy), сдано 1, квартиры от 3,8 млн ₽');
  });

  it('пишет «нет» для пустых разделов', () => {
    expect(formatCatalogInsights(buildCatalogInsights([]))).toContain('САМЫЕ ДЕШЁВЫЕ ПЛАНИРОВКИ:\nнет');
  });
});
