import { Prisma } from '@prisma/client';
import { convertBigInt } from './bigint.interceptor';

describe('convertBigInt', () => {
  it('BigInt и Decimal превращает в числа', () => {
    expect(convertBigInt({ price: BigInt(6_000_000), area: new Prisma.Decimal('45.5') })).toEqual({ price: 6_000_000, area: 45.5 });
  });

  it('даты сериализуются в ISO-строку, а не в пустой объект', () => {
    const createdAt = new Date('2026-10-30T10:00:00.000Z');
    const result = convertBigInt([{ id: 1, createdAt }]);
    expect(JSON.parse(JSON.stringify(result))).toEqual([{ id: 1, createdAt: '2026-10-30T10:00:00.000Z' }]);
  });

  it('null и вложенные объекты обходятся без ошибок', () => {
    expect(convertBigInt({ user: null, snapshot: { ids: [BigInt(1)] } })).toEqual({ user: null, snapshot: { ids: [1] } });
  });
});
