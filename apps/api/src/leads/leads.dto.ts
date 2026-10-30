import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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
}

export class UpdateLeadStatusDto {
  @IsIn(['new', 'contacted', 'qualified', 'closed_won', 'closed_lost'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
