// Сводка каталога для аналитических вопросов в чате:
// «самые дешёвые», «выгодно для инвестиций», «какой район лучше», «что купить под аренду».
// Все цифры считает код по данным PostgreSQL; модель только объясняет готовый расчёт.

export interface CatalogLayoutInput {
  rooms:     number | null;
  areaMin:   unknown;          // Prisma.Decimal | number | null
  priceFrom: bigint | number | null;
}

export interface CatalogPropertyInput {
  slug:         string;
  name:         string;
  district:     string;
  status:       string;        // building | ready
  deadlineQ:    number | null;
  deadlineYear: number | null;
  priceFrom:    bigint | number;
  priceM2:      number | null;
  isHot:        boolean;
  description:  string | null;
  layouts:      CatalogLayoutInput[];
}

export interface CheapestLayout {
  name:      string;
  district:  string;
  slug:      string;
  rooms:     string;
  areaMin:   number | null;
  priceFrom: number;
}

export interface LayoutInsight {
  rooms:     string;
  areaMin:   number | null;
  priceFrom: number;
}

export interface PropertyInsight {
  name:            string;
  district:        string;
  slug:            string;
  status:          'сдан' | 'строится';
  deadline:        string | null;
  /** Минимальная цена среди доступных планировок (null — цен нет) */
  minPrice:        number | null;
  priceM2:         number | null;
  /** Отклонение цены за м² от медианы по каталогу, в процентах (−12 = на 12% дешевле) */
  priceM2VsMedian: number | null;
  /** Минимальная цена студии или однокомнатной — порог входа для сдачи в аренду */
  smallFlatFrom:   number | null;
  description:     string | null;
  /** Доступные планировки с ценой: модель берёт цены отсюда, а не из общей цены ЖК */
  layouts:         LayoutInsight[];
}

export interface DistrictInsight {
  district:      string;
  propertyCount: number;
  readyCount:    number;
  minPrice:      number | null;
  avgPriceM2:    number | null;
  properties:    string[];
}

export interface CatalogInsights {
  propertyCount:  number;
  medianPriceM2:  number | null;
  cheapest:       CheapestLayout[];
  /** Студии и однокомнатные по возрастанию цены: все и только в сданных домах */
  rental:         { cheapestSmall: CheapestLayout[]; readySmall: CheapestLayout[] };
  properties:     PropertyInsight[];
  districts:      DistrictInsight[];
}

const CHEAPEST_LIMIT     = 5;
const RENTAL_LIMIT       = 3;
const DESCRIPTION_LIMIT  = 220;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function roomsLabel(rooms: number | null): string {
  if (rooms === null) return 'не указано';
  return rooms === 0 ? 'студия' : `${rooms}-комнатная`;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function deadlineLabel(p: CatalogPropertyInput): string | null {
  if (!p.deadlineYear) return null;
  return p.deadlineQ ? `${p.deadlineQ} кв. ${p.deadlineYear}` : String(p.deadlineYear);
}

function shorten(text: string | null): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > DESCRIPTION_LIMIT ? `${clean.slice(0, DESCRIPTION_LIMIT - 1)}…` : clean;
}

/** Планировки с положительной ценой, по возрастанию цены */
function pricedLayouts(p: CatalogPropertyInput) {
  return p.layouts
    .map((l) => ({ rooms: l.rooms, areaMin: toNumber(l.areaMin), price: toNumber(l.priceFrom) }))
    .filter((l): l is { rooms: number | null; areaMin: number | null; price: number } => l.price !== null && l.price > 0)
    .sort((a, b) => a.price - b.price);
}

export function buildCatalogInsights(catalog: CatalogPropertyInput[]): CatalogInsights {
  const priceM2s = catalog.map((p) => p.priceM2).filter((v): v is number => typeof v === 'number' && v > 0);
  const medianPriceM2 = median(priceM2s);

  const allLayouts = catalog
    .flatMap((p) => pricedLayouts(p).map((l) => ({ p, ...l })))
    .sort((a, b) => a.price - b.price);
  const toCheapest = ({ p, rooms, areaMin, price }: typeof allLayouts[number]): CheapestLayout => ({
    name:      p.name,
    district:  p.district,
    slug:      p.slug,
    rooms:     roomsLabel(rooms),
    areaMin,
    priceFrom: price,
  });
  const small = allLayouts.filter(({ rooms }) => rooms === 0 || rooms === 1);

  const cheapest = allLayouts.slice(0, CHEAPEST_LIMIT).map(toCheapest);
  const rental = {
    cheapestSmall: small.slice(0, RENTAL_LIMIT).map(toCheapest),
    readySmall:    small.filter(({ p }) => p.status === 'ready').slice(0, RENTAL_LIMIT).map(toCheapest),
  };

  const properties: PropertyInsight[] = catalog
    .map((p) => {
      const layouts = pricedLayouts(p);
      const smallPrices = layouts
        .filter(({ rooms }) => rooms === 0 || rooms === 1)
        .map(({ price }) => price);
      const priceM2 = p.priceM2 && p.priceM2 > 0 ? p.priceM2 : null;
      return {
        name:            p.name,
        district:        p.district,
        slug:            p.slug,
        status:          p.status === 'ready' ? 'сдан' as const : 'строится' as const,
        deadline:        deadlineLabel(p),
        minPrice:        layouts.length ? Math.min(...layouts.map(({ price }) => price)) : null,
        priceM2,
        priceM2VsMedian: priceM2 && medianPriceM2 ? Math.round(((priceM2 - medianPriceM2) / medianPriceM2) * 100) : null,
        smallFlatFrom:   smallPrices.length ? Math.min(...smallPrices) : null,
        description:     shorten(p.description),
        layouts:         layouts.map(({ rooms, areaMin, price }) => ({ rooms: roomsLabel(rooms), areaMin, priceFrom: price })),
      };
    })
    // Сначала дешевле за м²; ЖК без цены за м² — в конце
    .sort((a, b) => (a.priceM2 ?? Infinity) - (b.priceM2 ?? Infinity));

  const byDistrict = new Map<string, CatalogPropertyInput[]>();
  for (const p of catalog) {
    byDistrict.set(p.district, [...(byDistrict.get(p.district) ?? []), p]);
  }

  const districts: DistrictInsight[] = [...byDistrict.entries()]
    .map(([district, list]) => {
      const m2 = list.map((p) => p.priceM2).filter((v): v is number => typeof v === 'number' && v > 0);
      const prices = list.flatMap((p) => pricedLayouts(p).map(({ price }) => price));
      return {
        district,
        propertyCount: list.length,
        readyCount:    list.filter((p) => p.status === 'ready').length,
        minPrice:      prices.length ? Math.min(...prices) : null,
        avgPriceM2:    m2.length ? Math.round(m2.reduce((s, v) => s + v, 0) / m2.length) : null,
        properties:    list.map((p) => p.name),
      };
    })
    .sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));

  return { propertyCount: catalog.length, medianPriceM2, cheapest, rental, properties, districts };
}

/** 1 950 000 → «1,95 млн ₽» */
export function formatPrice(rub: number): string {
  const mln = Math.round(rub / 10_000) / 100;
  return `${mln.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;
}

const layoutLine = (l: CheapestLayout, i: number) =>
  `${i + 1}. ${l.name} — ${l.district} район, ${l.rooms}${l.areaMin ? `, от ${l.areaMin} м²` : ''}, от ${formatPrice(l.priceFrom)}`;

const listOrNone = (lines: string[]) => (lines.length ? lines.join('\n') : 'нет');

/**
 * Сводка текстом с готовыми цифрами: по большому JSON модель ошибается
 * (берёт цену не из той строки, «не находит» сданные дома).
 */
export function formatCatalogInsights(insights: CatalogInsights): string {
  const median = insights.medianPriceM2;

  const properties = insights.properties.map((p) => {
    const parts = [
      `${p.district} район`,
      p.status === 'сдан' ? 'дом сдан' : `строится${p.deadline ? `, срок сдачи ${p.deadline}` : ''}`,
      p.priceM2 ? `${p.priceM2.toLocaleString('ru-RU')} ₽/м²` : 'цена за м² не указана',
    ];
    if (p.priceM2VsMedian !== null) {
      parts.push(p.priceM2VsMedian === 0 ? 'на уровне медианы'
        : `${Math.abs(p.priceM2VsMedian)}% ${p.priceM2VsMedian < 0 ? 'ниже' : 'выше'} медианы`);
    }
    if (p.minPrice !== null) parts.push(`квартиры от ${formatPrice(p.minPrice)}`);
    const layouts = p.layouts.map((l) => `${l.rooms} от ${formatPrice(l.priceFrom)}`).join('; ');
    return `- ${p.name}: ${parts.join(', ')}.${layouts ? ` Планировки: ${layouts}.` : ''}${p.description ? ` Описание: ${p.description}` : ''}`;
  });

  const districts = insights.districts.map((d) =>
    `- ${d.district}: ЖК ${d.propertyCount} (${d.properties.join(', ')}), сдано ${d.readyCount}` +
    `${d.minPrice !== null ? `, квартиры от ${formatPrice(d.minPrice)}` : ''}` +
    `${d.avgPriceM2 ? `, в среднем ${d.avgPriceM2.toLocaleString('ru-RU')} ₽/м²` : ''}`,
  );

  return [
    `Всего ЖК в каталоге: ${insights.propertyCount}. Медиана цены за м²: ${median ? `${median.toLocaleString('ru-RU')} ₽` : 'нет данных'}.`,
    '',
    'САМЫЕ ДЕШЁВЫЕ ПЛАНИРОВКИ:',
    listOrNone(insights.cheapest.map(layoutLine)),
    '',
    'ДЛЯ АРЕНДЫ — самые дешёвые студии и однокомнатные:',
    listOrNone(insights.rental.cheapestSmall.map(layoutLine)),
    '',
    'ДЛЯ АРЕНДЫ — студии и однокомнатные в уже сданных домах:',
    listOrNone(insights.rental.readySmall.map(layoutLine)),
    '',
    'ЖК ПО ЦЕНЕ ЗА М² (от дешёвых к дорогим):',
    listOrNone(properties),
    '',
    'РАЙОНЫ:',
    listOrNone(districts),
  ].join('\n');
}
