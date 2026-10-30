import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Prisma } from '@prisma/client';

export function convertBigInt(data: unknown): unknown {
  if (typeof data === 'bigint') {
    return Number(data);
  }

  // Prisma Decimal → number (otherwise serialised as {s,e,d} object)
  if (data instanceof Prisma.Decimal) {
    return data.toNumber();
  }

  // Date оставляем как есть: JSON.stringify превратит её в ISO-строку,
  // а обход ниже через Object.entries дал бы пустой объект {}
  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(convertBigInt);
  }

  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        convertBigInt(value),
      ]),
    );
  }

  return data;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertBigInt(data)));
  }
}