import {
  IsBoolean, IsDecimal, IsIn, IsInt, IsOptional,
  IsString, MaxLength, Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PropertyFiltersDto {
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsIn(['building', 'ready'])
  status?: 'building' | 'ready';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rooms?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'new', 'popular'])
  sort?: 'price_asc' | 'price_desc' | 'new' | 'popular';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;
}
