# Новостройки Уфы — Архитектура и план запуска

## 🏗 Архитектура проекта

```
novostroyki-ufa/
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (catalog)/            # Группа маршрутов каталога
│   │   │   │   ├── page.tsx          # /catalog — список ЖК
│   │   │   │   └── [slug]/page.tsx   # /catalog/[slug] — страница ЖК
│   │   │   ├── map/page.tsx          # /map — карта
│   │   │   ├── calculator/page.tsx   # /calculator
│   │   │   ├── chat/page.tsx         # /chat
│   │   │   ├── favorites/page.tsx    # /favorites
│   │   │   ├── auth/                 # /auth/login, /auth/register
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # / — главная
│   │   ├── components/
│   │   │   ├── catalog/
│   │   │   │   ├── PropertyCard.tsx
│   │   │   │   ├── FiltersPanel.tsx
│   │   │   │   ├── SortBar.tsx
│   │   │   │   └── CatalogGrid.tsx
│   │   │   ├── detail/
│   │   │   │   ├── PropertyGallery.tsx
│   │   │   │   ├── LayoutsGrid.tsx
│   │   │   │   └── DetailSidebar.tsx
│   │   │   ├── calculator/
│   │   │   │   ├── CalcForm.tsx
│   │   │   │   └── CalcResults.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   ├── map/
│   │   │   │   ├── YandexMap.tsx
│   │   │   │   └── MapCard.tsx
│   │   │   └── ui/                   # Переиспользуемые UI компоненты
│   │   │       ├── Badge.tsx
│   │   │       ├── Button.tsx
│   │   │       └── Toast.tsx
│   │   └── lib/
│   │       ├── api.ts                # API клиент
│   │       ├── hooks/                # React hooks
│   │       └── store/                # Zustand store
│   └── api/                          # NestJS backend
│       ├── src/
│       │   ├── properties/           # Модуль ЖК
│       │   │   ├── properties.controller.ts
│       │   │   ├── properties.service.ts
│       │   │   ├── properties.dto.ts
│       │   │   └── properties.entity.ts
│       │   ├── calculator/
│       │   ├── chat/                 # AI чат (OpenAI proxy)
│       │   ├── auth/                 # JWT авторизация
│       │   ├── users/
│       │   ├── favorites/
│       │   └── parser/               # Парсинг данных
├── packages/
│   └── shared/                       # Общие типы TypeScript
└── infra/
    ├── docker-compose.yml
    └── nginx.conf
```

---

## 🗃 Структура базы данных (PostgreSQL)

```sql
-- Застройщики
CREATE TABLE developers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  logo_url   TEXT,
  website    TEXT,
  phone      VARCHAR(20),
  rating     DECIMAL(3,1),
  projects_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ЖК (главная таблица)
CREATE TABLE properties (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(200) UNIQUE NOT NULL,    -- URL-friendly имя
  name          VARCHAR(200) NOT NULL,
  developer_id  INT REFERENCES developers(id),
  district      VARCHAR(100) NOT NULL,
  address       TEXT,
  lat           DECIMAL(10,8),                   -- координаты для карты
  lng           DECIMAL(11,8),
  deadline_q    SMALLINT,                        -- квартал сдачи (1-4)
  deadline_year SMALLINT,
  status        VARCHAR(20) DEFAULT 'building',  -- 'building' | 'ready'
  price_from    BIGINT NOT NULL,
  price_to      BIGINT,
  price_m2      INT,
  floors        SMALLINT,
  area_min      DECIMAL(6,2),
  area_max      DECIMAL(6,2),
  description   TEXT,
  meta_title    VARCHAR(200),                    -- SEO
  meta_desc     VARCHAR(500),
  is_hot        BOOLEAN DEFAULT FALSE,
  views_count   INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Изображения ЖК
CREATE TABLE property_images (
  id          SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         VARCHAR(200),
  sort_order  SMALLINT DEFAULT 0,
  type        VARCHAR(20) DEFAULT 'exterior'  -- 'exterior'|'interior'|'lobby'
);

-- Планировки
CREATE TABLE layouts (
  id          SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  rooms       SMALLINT,                        -- 0=студия, 1,2,3...
  area_min    DECIMAL(6,2),
  area_max    DECIMAL(6,2),
  price_from  BIGINT,
  price_to    BIGINT,
  image_url   TEXT,
  is_available BOOLEAN DEFAULT TRUE
);

-- Пользователи
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  name          VARCHAR(200),
  phone         VARCHAR(20),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Избранное
CREATE TABLE favorites (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- История расчётов калькулятора
CREATE TABLE calc_history (
  id              SERIAL PRIMARY KEY,
  user_id         INT REFERENCES users(id) ON DELETE CASCADE,
  property_id     INT REFERENCES properties(id),
  price           BIGINT,
  repair_cost     INT,
  monthly_rent    INT,
  monthly_expenses INT,
  tax_mode        VARCHAR(10),
  yield_pct       DECIMAL(5,2),
  payback_years   DECIMAL(5,1),
  net_income      BIGINT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- История чата с AI
CREATE TABLE chat_messages (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  session_id  VARCHAR(64),
  role        VARCHAR(10) NOT NULL,  -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  tokens_used INT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_deadline ON properties(deadline_year, deadline_q);
CREATE INDEX idx_properties_price ON properties(price_from, price_to);
CREATE INDEX idx_properties_coords ON properties(lat, lng);
CREATE INDEX idx_favorites_user ON favorites(user_id);
```

---

## 🎨 UI/UX описание

### Дизайн-система

| Параметр | Значение |
|----------|----------|
| Основной цвет | `#2F80ED` — действия, ссылки, акценты |
| Зелёный | `#27AE60` — положительные метрики, выгодность |
| Оранжевый | `#F2994A` — средняя привлекательность, hot-badge |
| Красный | `#EB5757` — низкая доходность, избранное |
| Шрифт заголовков | Unbounded (экспрессивный, городской) |
| Шрифт текста | Manrope (читаемый, современный) |
| Радиус скруглений | 12px (карточки), 20px (большие блоки) |

### Ключевые принципы UX
- **Mobile-first:** все страницы оптимизированы под 375px
- **Progressive disclosure:** на карточке — минимум, в деталях — всё
- **Instant feedback:** тосты, анимации hover, skeleton-загрузка
- **Zero dead ends:** везде есть back-навигация и CTA

---

## ⚛️ Ключевые React-компоненты

### PropertyCard.tsx
```tsx
interface Property {
  id: number;
  name: string;
  developer: Developer;
  district: string;
  deadline: string;
  priceFrom: number;
  priceTo: number;
  priceM2: number;
  roi: number;
  status: 'building' | 'ready';
  isHot: boolean;
  images: PropertyImage[];
}

export function PropertyCard({ property, onFavoriteToggle }: Props) {
  const isFavorite = useFavorites(property.id);
  return (
    <Link href={`/catalog/${property.slug}`}>
      <article className="prop-card group">
        <PropertyImage src={property.images[0]?.url} alt={property.name} />
        <PropertyBadges isHot={property.isHot} status={property.status} />
        <FavoriteButton
          isFavorite={isFavorite}
          onClick={(e) => { e.preventDefault(); onFavoriteToggle(property.id); }}
        />
        <PropertyBody property={property} />
        <PropertyFooter deadline={property.deadline} roi={property.roi} />
      </article>
    </Link>
  );
}
```

### InvestmentCalculator.tsx
```tsx
function calcInvestment(params: CalcParams): CalcResult {
  const { price, repair, monthlyRent, monthlyExpenses, taxMode } = params;
  const totalCost = price + repair;
  const rentMonths = 11; // 1 месяц простой
  const grossRent = monthlyRent * rentMonths;
  const taxRate = taxMode === 'ndfl' ? 0.13 : 0.04;
  const tax = grossRent * taxRate;
  const expenses = monthlyExpenses * 12;
  const netIncome = grossRent - expenses - tax;
  const yieldPct = (netIncome / totalCost) * 100;
  const paybackYears = totalCost / netIncome;

  return {
    yieldPct: +yieldPct.toFixed(2),
    paybackYears: +paybackYears.toFixed(1),
    netIncome,
    verdict: paybackYears < 15 ? 'high' : paybackYears < 20 ? 'mid' : paybackYears < 25 ? 'low' : 'bad',
  };
}
```

### AI Chat (Next.js API Route)
```ts
// app/api/chat/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { messages } = await req.json();
  const properties = await getPropertiesContext(); // из БД

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      { role: 'system', content: buildSystemPrompt(properties) },
      ...messages.slice(-10),
    ],
  });

  return new Response(stream.toReadableStream());
}
```

---

## 🚀 MVP — план запуска

### Этап 1: Фундамент (Недели 1–3)
- [ ] Инфраструктура: PostgreSQL + Redis на VPS
- [ ] NestJS API: CRUD для ЖК, авторизация JWT
- [ ] Next.js: каталог + фильтры + страница ЖК
- [ ] 15–20 ЖК в базе данных (ручной ввод)
- [ ] Деплой: Vercel (frontend) + Railway/VPS (backend)

### Этап 2: Ключевые фичи (Недели 4–6)
- [ ] Калькулятор инвестиций (готов в MVP)
- [ ] Яндекс.Карты: карта с маркерами ЖК
- [ ] Избранное + история расчётов
- [ ] SEO: title/description для каждого ЖК

### Этап 3: AI + Growth (Недели 7–10)
- [ ] AI-чат на OpenAI API / Claude API
- [ ] Парсер данных с ufanovostroyka.ru
- [ ] Уведомления: снижение цен, новые ЖК
- [ ] Аналитика: Яндекс.Метрика

### Этап 4: Монетизация (Месяц 3+)
- [ ] Лиды для застройщиков (CPL модель)
- [ ] Premium размещение ЖК (featured listing)
- [ ] B2B API для агентств

---

## 💰 Unit-экономика

| Метрика | Цель |
|---------|------|
| MAU | 5 000 (через 6 мес.) |
| Конверсия в лид | 3% |
| Лидов / месяц | 150 |
| Цена лида | 500–1500 ₽ |
| MRR | 75 000–225 000 ₽ |

---

## 🔧 Стек технологий

```
Frontend:  Next.js 14 · Tailwind CSS · Zustand · React Query
Backend:   NestJS · PostgreSQL · Redis · Prisma ORM
Auth:      JWT + Refresh tokens
AI:        OpenAI API (gpt-4o-mini) или Anthropic Claude
Maps:      Яндекс.Карты JS API 3.0
Parsing:   Puppeteer / Playwright
Deploy:    Vercel + Railway / Docker + VPS
CI/CD:     GitHub Actions
Monitoring: Sentry + Яндекс.Метрика
```
