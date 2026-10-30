import { Transform } from 'class-transformer';
import { Equals, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateLeadDto {
  @IsIn(['chat', 'manual', 'calculator'])
  source: 'chat' | 'manual' | 'calculator';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  contactName?: string;

  /** Обязателен для анонимного посетителя — проверяется в LeadsService */
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[\d\s()-]{6,20}$/, { message: 'Телефон указан в неверном формате' })
  contactPhone?: string;

  /** Свободный текст заявки — его разбирает LeadClassifierService */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message?: string;

  /** Сессия чата на сайте — менеджер увидит переписку клиента с AI-консультантом */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  /** Согласие на обработку персональных данных (152-ФЗ) */
  @Equals(true, { message: 'Нужно согласие на обработку персональных данных' })
  consent: boolean;
}

export class UpdateLeadStatusDto {
  @IsIn(['new', 'contacted', 'qualified', 'closed_won', 'closed_lost'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadNotesDto {
  @IsString()
  @MaxLength(5000)
  managerNotes: string;
}
