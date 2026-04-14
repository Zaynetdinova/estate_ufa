import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './chat.dto';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/message
   * Стриминговый AI-ответ (SSE / text stream).
   * Авторизация опциональна.
   */
  @UseGuards(OptionalJwtGuard)
  @Post('message')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId: number | undefined = req.user?.id;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const stream = await this.chatService.streamResponse(dto, userId);
    const reader  = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  }

  /**
   * GET /chat/history
   * История чата текущего пользователя.
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(@Req() req: any, @Query('sessionId') sessionId?: string) {
    return this.chatService.getHistory(req.user.id, sessionId);
  }
}
