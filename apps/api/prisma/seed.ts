import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Застройщики ────────────────────────────────────────────────────
  const developers = await prisma.$transaction([
    prisma.developer.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Жилстройинвест', rating: 4.7, projectsCount: 12 },
    }),
    prisma.developer.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'СК Мегаполис', rating: 4.5, projectsCount: 8 },
    }),
    prisma.developer.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'УфаСтройГрупп', rating: 4.3, projectsCount: 6 },
    }),
    prisma.developer.upsert({
      where: { id: 4 },
      update: {},
      create: { name: 'Гранд-Строй', rating: 4.8, projectsCount: 15 },
    }),
    prisma.developer.upsert({
      where: { id: 5 },
      update: {},
      create: { name: 'Девелопмент Групп', rating: 4.2, projectsCount: 4 },
    }),
  ]);

  console.log(`✓ ${developers.length} developers`);

  // ── ЖК ──────────────────────────────────────────────────────────────
  const propertiesData = [
    {
      slug:        'zhk-simvol',
      name:        'ЖК Символ',
      developerId: 1,
      district:    'Советский',
      address:     'ул. Революционная, 94',
      lat:         54.7388,
      lng:         55.9721,
      deadlineQ:   2,
      deadlineYear: 2025,
      status:      'building',
      priceFrom:   BigInt(4_200_000),
      priceTo:     BigInt(11_500_000),
      priceM2:     110_000,
      floors:      25,
      areaMin:     38.5,
      areaMax:     105.0,
      description: 'Современный жилой комплекс комфорт-класса в центре Советского района. Закрытая территория, подземный паркинг, детский сад на первом этаже.',
      isHot:       true,
      viewsCount:  1240,
    },
    {
      slug:        'zhk-prospekt',
      name:        'ЖК Проспект',
      developerId: 2,
      district:    'Кировский',
      address:     'пр. Октября, 132',
      lat:         54.7651,
      lng:         55.9618,
      deadlineQ:   4,
      deadlineYear: 2025,
      status:      'building',
      priceFrom:   BigInt(3_800_000),
      priceTo:     BigInt(9_200_000),
      priceM2:     98_000,
      floors:      18,
      areaMin:     35.0,
      areaMax:     92.0,
      description: 'Жилой комплекс бизнес-класса на главном проспекте города. Панорамные окна, высокие потолки 3 метра, видовые квартиры.',
      isHot:       true,
      viewsCount:  980,
    },
    {
      slug:        'zhk-uralskie-zori',
      name:        'ЖК Уральские зори',
      developerId: 3,
      district:    'Октябрьский',
      address:     'ул. Российская, 56',
      lat:         54.7201,
      lng:         55.9834,
      deadlineQ:   1,
      deadlineYear: 2026,
      status:      'building',
      priceFrom:   BigInt(3_100_000),
      priceTo:     BigInt(7_800_000),
      priceM2:     82_000,
      floors:      16,
      areaMin:     32.0,
      areaMax:     88.0,
      description: 'Доступное жильё в развитом районе. Рядом школы, детские сады, торговые центры. Развитая инфраструктура, зелёный двор без машин.',
      isHot:       false,
      viewsCount:  654,
    },
    {
      slug:        'zhk-kapital',
      name:        'ЖК Капитал',
      developerId: 4,
      district:    'Советский',
      address:     'ул. Менделеева, 200',
      lat:         54.7512,
      lng:         55.9443,
      deadlineQ:   null,
      deadlineYear: null,
      status:      'ready',
      priceFrom:   BigInt(5_500_000),
      priceTo:     BigInt(15_000_000),
      priceM2:     135_000,
      floors:      30,
      areaMin:     42.0,
      areaMax:     130.0,
      description: 'Сданный дом премиум-класса. Консьерж, видеонаблюдение, два подземных паркинга. Квартиры с отделкой и без. Рядом парк Якутова.',
      isHot:       false,
      viewsCount:  2100,
    },
    {
      slug:        'zhk-zeleniy-kvartal',
      name:        'ЖК Зелёный квартал',
      developerId: 1,
      district:    'Ленинский',
      address:     'ул. Зорге, 34',
      lat:         54.7089,
      lng:         55.9267,
      deadlineQ:   3,
      deadlineYear: 2026,
      status:      'building',
      priceFrom:   BigInt(2_900_000),
      priceTo:     BigInt(6_500_000),
      priceM2:     75_000,
      floors:      14,
      areaMin:     28.0,
      areaMax:     78.0,
      description: 'Экологичный квартал у реки Белой. Большая придомовая территория с озеленением, детские площадки, спортивная зона. Отличное соотношение цена/качество.',
      isHot:       true,
      viewsCount:  870,
    },
    {
      slug:        'zhk-galaxy',
      name:        'ЖК Galaxy',
      developerId: 4,
      district:    'Кировский',
      address:     'ул. Чернышевского, 88',
      lat:         54.7731,
      lng:         55.9571,
      deadlineQ:   2,
      deadlineYear: 2027,
      status:      'building',
      priceFrom:   BigInt(6_200_000),
      priceTo:     BigInt(18_000_000),
      priceM2:     145_000,
      floors:      35,
      areaMin:     45.0,
      areaMax:     145.0,
      description: 'Флагманский проект бизнес-класса. Небоскрёб 35 этажей с видом на реку Белую и весь город. Smart home система, фитнес-центр, ресторан на первом этаже.',
      isHot:       true,
      viewsCount:  3200,
    },
    {
      slug:        'zhk-sonata',
      name:        'ЖК Соната',
      developerId: 2,
      district:    'Демский',
      address:     'ул. Левитана, 15',
      lat:         54.6823,
      lng:         55.9142,
      deadlineQ:   4,
      deadlineYear: 2025,
      status:      'building',
      priceFrom:   BigInt(2_600_000),
      priceTo:     BigInt(5_800_000),
      priceM2:     68_000,
      floors:      12,
      areaMin:     30.0,
      areaMax:     72.0,
      description: 'Доступное жильё в тихом районе. Хороший вариант для семей с детьми — рядом несколько школ и детских садов. Низкая цена входа.',
      isHot:       false,
      viewsCount:  445,
    },
    {
      slug:        'zhk-belaya-reka',
      name:        'ЖК Белая Река',
      developerId: 5,
      district:    'Октябрьский',
      address:     'набережная р. Белой, 12',
      lat:         54.7340,
      lng:         55.9650,
      deadlineQ:   1,
      deadlineYear: 2027,
      status:      'building',
      priceFrom:   BigInt(7_800_000),
      priceTo:     BigInt(22_000_000),
      priceM2:     160_000,
      floors:      28,
      areaMin:     50.0,
      areaMax:     160.0,
      description: 'Элитный жилой комплекс на первой линии реки Белой. Квартиры с панорамным видом на воду и Уфимский полуостров. Яхт-клуб, SPA, консьерж 24/7.',
      isHot:       false,
      viewsCount:  1560,
    },
    {
      slug:        'zhk-magistral',
      name:        'ЖК Магистраль',
      developerId: 3,
      district:    'Советский',
      address:     'ул. 50-летия Октября, 18',
      lat:         54.7456,
      lng:         55.9812,
      deadlineQ:   2,
      deadlineYear: 2026,
      status:      'building',
      priceFrom:   BigInt(3_500_000),
      priceTo:     BigInt(8_900_000),
      priceM2:     90_000,
      floors:      20,
      areaMin:     33.5,
      areaMax:     95.0,
      description: 'Современный комплекс у главной магистрали города. Удобная транспортная доступность, отделка white box, свободная планировка.',
      isHot:       false,
      viewsCount:  720,
    },
    {
      slug:        'zhk-park-city',
      name:        'ЖК Park City',
      developerId: 4,
      district:    'Советский',
      address:     'ул. Ленина, 70',
      lat:         54.7285,
      lng:         55.9388,
      deadlineQ:   null,
      deadlineYear: null,
      status:      'ready',
      priceFrom:   BigInt(4_900_000),
      priceTo:     BigInt(13_500_000),
      priceM2:     120_000,
      floors:      22,
      areaMin:     40.0,
      areaMax:     110.0,
      description: 'Сданный жилой комплекс рядом с парком Салавата Юлаева. Квартиры с готовым ремонтом, заезжай и живи. Высокий спрос на аренду.',
      isHot:       false,
      viewsCount:  890,
    },
  ];

  let propertyCount = 0;
  for (const data of propertiesData) {
    const property = await prisma.property.upsert({
      where:  { slug: data.slug },
      update: {},
      create: {
        ...data,
        lat: data.lat as unknown as number,
        lng: data.lng as unknown as number,
      },
    });

    // Планировки
    const layoutsForProperty = getLayouts(property.id, data.priceFrom);
    for (const layout of layoutsForProperty) {
      await prisma.layout.upsert({
        where: { id: layout.id },
        update: {},
        create: layout,
      });
    }

    propertyCount++;
  }

  console.log(`✓ ${propertyCount} properties with layouts`);

  // ── Тестовый пользователь ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@estate.ru' },
    update: {},
    create: {
      email:        'demo@estate.ru',
      passwordHash,
      name:         'Демо Пользователь',
      phone:        '+7 900 000-00-00',
      budgetMin:    3_000_000,
      budgetMax:    8_000_000,
      intent:       'medium',
      userPreferences: {
        rooms:     [1, 2],
        districts: ['Советский', 'Кировский'],
      },
    },
  });

  console.log('✓ demo user: demo@estate.ru / password123');
  console.log('🌱 Seed complete!');
}

// Генератор планировок для ЖК
function getLayouts(propertyId: number, priceFrom: bigint) {
  const base  = Number(priceFrom);
  const idOff = propertyId * 10;

  return [
    { id: idOff + 1, propertyId, rooms: 0, areaMin: 28.0, areaMax: 35.0, priceFrom: BigInt(Math.round(base * 0.75)),  priceTo: BigInt(Math.round(base * 0.9)),  isAvailable: true },
    { id: idOff + 2, propertyId, rooms: 1, areaMin: 38.0, areaMax: 48.0, priceFrom: BigInt(Math.round(base)),         priceTo: BigInt(Math.round(base * 1.25)), isAvailable: true },
    { id: idOff + 3, propertyId, rooms: 2, areaMin: 55.0, areaMax: 68.0, priceFrom: BigInt(Math.round(base * 1.4)),   priceTo: BigInt(Math.round(base * 1.8)),  isAvailable: true },
    { id: idOff + 4, propertyId, rooms: 3, areaMin: 78.0, areaMax: 95.0, priceFrom: BigInt(Math.round(base * 2.0)),   priceTo: BigInt(Math.round(base * 2.5)),  isAvailable: true },
  ];
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
