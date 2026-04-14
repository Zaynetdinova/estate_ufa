import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ParsedProperty, ParseResult } from './parser.types';

/**
 * Сервис парсинга новостроек.
 *
 * Для реального парсинга ufanovostroyka.ru нужен puppeteer:
 *   npm i puppeteer  (уже в devDeps как опция)
 *
 * Здесь реализована полная инфраструктура — подставь реальный
 * scrapeSource() под конкретный сайт.
 */
@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Точка входа ──────────────────────────────────────────────────────

  async run(source: 'ufanovostroyka' | 'custom' = 'ufanovostroyka'): Promise<ParseResult> {
    const start  = Date.now();
    const result: ParseResult = { parsed: 0, created: 0, updated: 0, errors: [], durationMs: 0 };

    this.logger.log(`Starting parser: ${source}`);

    try {
      const items = await this.scrapeSource(source);
      result.parsed = items.length;

      for (const item of items) {
        try {
          await this.upsertProperty(item, result);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`${item.slug}: ${msg}`);
          this.logger.warn(`Upsert failed for ${item.slug}: ${msg}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Scrape failed: ${msg}`);
      this.logger.error(`Parser failed: ${msg}`);
    }

    result.durationMs = Date.now() - start;
    this.logger.log(
      `Parser done: parsed=${result.parsed} created=${result.created} updated=${result.updated} errors=${result.errors.length} (${result.durationMs}ms)`,
    );

    return result;
  }

  // ── Скрейпер ─────────────────────────────────────────────────────────

  /**
   * Реальный скрейпер. Использует Puppeteer для обхода страниц.
   * Замени URL и селекторы под конкретный сайт.
   */
  private async scrapeSource(source: string): Promise<ParsedProperty[]> {
    if (source === 'ufanovostroyka') {
      return this.scrapeUfaNovostroyka();
    }
    return [];
  }

  private async scrapeUfaNovostroyka(): Promise<ParsedProperty[]> {
    // Puppeteer подключается динамически — не ломает запуск без него
    let puppeteer: typeof import('puppeteer');
    try {
      puppeteer = await import('puppeteer');
    } catch {
      this.logger.warn('Puppeteer not installed. Run: npm i puppeteer');
      return this.getMockData(); // возвращаем mock для разработки
    }

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined;
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const items: ParsedProperty[] = [];

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      );

      // Страница каталога
      await page.goto('https://ufanovostroyka.ru/novostrojki/', {
        waitUntil: 'domcontentloaded',
        timeout:   60_000,
      });

      // Список карточек ЖК
      const links: string[] = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('.complex-card a.complex-card__title'),
        ).map((el) => (el as HTMLAnchorElement).href);
      });

      this.logger.log(`Found ${links.length} properties on listing`);

      // Парсим каждую карточку (с задержкой чтобы не перегружать сервер)
      for (const url of links.slice(0, 30)) {
        try {
          const item = await this.scrapeDetailPage(page, url);
          if (item) items.push(item);
          await this.sleep(2000 + Math.random() * 1000);
        } catch (err: unknown) {
          this.logger.warn(`Failed to parse ${url}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } finally {
      await browser.close();
    }

    return items;
  }

  private async scrapeDetailPage(page: any, url: string): Promise<ParsedProperty | null> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    return page.evaluate((sourceUrl: string) => {
      const getText = (sel: string) =>
        document.querySelector(sel)?.textContent?.trim() ?? null;

      const name = getText('h1.complex-title') ?? getText('.complex__name') ?? '';
      if (!name) return null;

      // Слаг из URL
      const slug = sourceUrl.split('/').filter(Boolean).pop() ?? name.toLowerCase().replace(/\s+/g, '-');

      // Цены — ищем паттерн "от X ₽"
      const priceText = getText('.complex-price') ?? getText('[data-price]') ?? '';
      const priceMatch = priceText.match(/[\d\s]+/g);
      const priceFrom  = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, ''), 10) : 0;

      // Район
      const district = getText('.complex-district') ?? getText('.location') ?? 'Уфа';

      // Изображения
      const imageUrls = Array.from(
        document.querySelectorAll('.complex-gallery img, .slider img'),
      )
        .map((img) => (img as HTMLImageElement).src)
        .filter((s) => s.startsWith('http'))
        .slice(0, 8);

      // Срок сдачи
      const deadlineText = getText('.complex-deadline') ?? '';
      const deadlineMatch = deadlineText.match(/(\d)\s*кв[.]?\s*(\d{4})/i);

      return {
        name,
        slug:        `zhk-${slug}`,
        district:    district.replace('р-н', 'район'),
        priceFrom:   priceFrom || 3_000_000,
        status:      deadlineText.toLowerCase().includes('сдан') ? 'ready' : 'building',
        deadlineQ:   deadlineMatch ? parseInt(deadlineMatch[1], 10) : undefined,
        deadlineYear: deadlineMatch ? parseInt(deadlineMatch[2], 10) : undefined,
        imageUrls,
        sourceUrl,
      } as any;
    }, url);
  }

  // ── Upsert в БД ───────────────────────────────────────────────────────

  private async upsertProperty(item: ParsedProperty, result: ParseResult) {
    // Находим или создаём застройщика
    let developerId: number | undefined;
    if (item.developerName) {
      const dev = await this.prisma.developer.upsert({
        where:  { id: 0 }, // несуществующий id — всегда создаёт через create
        update: {},
        create: { name: item.developerName },
      }).catch(async () => {
        // Если уже есть — ищем по имени
        return this.prisma.developer.findFirst({ where: { name: item.developerName } });
      });
      developerId = dev?.id;
    }

    const existing = await this.prisma.property.findUnique({ where: { slug: item.slug } });

    if (existing) {
      // Обновляем только цену и дедлайн (могли измениться)
      await this.prisma.property.update({
        where: { id: existing.id },
        data: {
          priceFrom:   item.priceFrom ? BigInt(item.priceFrom) : undefined,
          priceTo:     item.priceTo   ? BigInt(item.priceTo)   : undefined,
          priceM2:     item.priceM2,
          deadlineQ:   item.deadlineQ,
          deadlineYear: item.deadlineYear,
        },
      });
      result.updated++;
    } else {
      const property = await this.prisma.property.create({
        data: {
          slug:         item.slug,
          name:         item.name,
          developerId:  developerId ?? null,
          district:     item.district,
          address:      item.address ?? null,
          priceFrom:    BigInt(item.priceFrom),
          priceTo:      item.priceTo ? BigInt(item.priceTo) : null,
          priceM2:      item.priceM2 ?? null,
          floors:       item.floors ?? null,
          areaMin:      item.areaMin ?? null,
          areaMax:      item.areaMax ?? null,
          deadlineQ:    item.deadlineQ ?? null,
          deadlineYear: item.deadlineYear ?? null,
          status:       item.status,
          description:  item.description ?? null,
        },
      });

      // Сохраняем изображения
      if (item.imageUrls.length > 0) {
        await this.prisma.propertyImage.createMany({
          data: item.imageUrls.map((url, i) => ({
            propertyId: property.id,
            url,
            sortOrder:  i,
            type:       i === 0 ? 'exterior' : 'interior',
          })),
          skipDuplicates: true,
        });
      }

      result.created++;
    }
  }

  // ── Mock данные для разработки (без puppeteer) ────────────────────────

  private getMockData(): ParsedProperty[] {
    return [
      {
        name:         'ЖК Тест-Парсер',
        slug:         'zhk-test-parser',
        district:     'Советский',
        priceFrom:    4_500_000,
        status:       'building',
        deadlineQ:    3,
        deadlineYear: 2026,
        imageUrls:    [],
        sourceUrl:    'https://example.com',
      },
    ];
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
