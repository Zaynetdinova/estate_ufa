import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Prisma } from '@prisma/client';

function convertBigInt(data: unknown): unknown {
  if (typeof data === 'bigint') {
    return Number(data);
  }

  // Prisma Decimal → number (otherwise serialised as {s,e,d} object)
  if (data instanceof Prisma.Decimal) {
    return data.toNumber();
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