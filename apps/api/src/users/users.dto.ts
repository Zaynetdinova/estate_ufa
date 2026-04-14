import { IsIn, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsObject()
  userPreferences?: Record<string, unknown>;
  // Пример: { "rooms": [2,3], "districts": ["Советский"], "deadline": "2025" }

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  intent?: 'low' | 'medium' | 'high';
}

export class UpdateAiProfileDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  intent?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsObject()
  userPreferences?: Record<string, unknown>;
}
