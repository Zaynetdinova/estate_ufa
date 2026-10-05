import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, IsIn, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content: string;
}

export class SendMessageDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50) // в модель уходят только последние 10, но тело запроса не должно быть безразмерным
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}
