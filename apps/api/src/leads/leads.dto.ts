import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsIn(['chat', 'manual', 'calculator'])
  source: 'chat' | 'manual' | 'calculator';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadStatusDto {
  @IsIn(['new', 'contacted', 'qualified', 'closed_won', 'closed_lost'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
