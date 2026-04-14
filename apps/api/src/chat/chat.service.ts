import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { N8nEventType } from '../n8n/n8n.types';
import { PropertiesService } from '../properties/properties.service';
import { SendMessageDto } from './chat.dto';

interface AiProfileExtract {
  budgetMin?: number;
  budgetMax?: number;
  intent?: 'low' | 'medium' | 'high';
  userPreferences?: {
    rooms?: number[];
    districts?: string[];
    deadline?: string;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly users: UsersService,
    private readonly properties: PropertiesService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY', ''),
    });
  }

  /**
   * Стриминговый ответ AI.
   * Возвращает ReadableStream — контроллер пробрасывает его в Response.
   */
  async streamResponse(dto: SendMessageDto, userId?: number): Promise<ReadableStream> {
    const sessionId = dto.sessionId ?? this.generateSessionId();
    const lastUserMessage = dto.messages.filter((m) => m.role === 'user').at(-1)?.content ?? '';

    // 1. Сохраняем сообщение пользователя в БД
    if (lastUserMessage) {
      await this.prisma.chatMessage.create({
        data: {
          userId:    userId ?? null,
          sessionId,
          role:      'user',
          content:   lastUserMessage,
        },
      });
    }

    // 2. Трекаем событие USER_MESSAGE
    await this.events.track(
      {
        eventType: N8nEventType.USER_MESSAGE,
        payload: {
          message:   lastUserMessage,
          sessionId,
          messageCount: dto.messages.length,
        },
        sessionId,
      },
      { userId, sessionId },
    );

    // 3. Обновляем AI-профиль асинхронно (не блокируем стрим)
    if (userId) {
      this.extractAndUpdateProfile(userId, lastUserMessage).catch((err) =>
        this.logger.warn(`Profile update failed: ${err.message}`),
      );
    }

    // 4. Получаем контекст ЖК для system prompt
    const propertiesContext = await this.properties.findForAiContext();

    // 5. Запускаем стрим OpenAI
    const stream = await this.openai.chat.completions.create({
      model:  'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(propertiesContext) },
        ...dto.messages.slice(-10), // последние 10 сообщений
      ],
    });

    // 6. Сохраняем ответ AI в БД в конце стрима (side-effect через tee)
    return this.createTrackedStream(stream, userId, sessionId);
  }

  /**
   * Оборачиваем стрим OpenAI:
   * - пробрасываем чанки клиенту
   * - собираем полный ответ для сохранения в БД
   */
  private createTrackedStream(
    openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    userId?: number,
    sessionId?: string,
  ): ReadableStream {
    let fullContent = '';

    return new ReadableStream({
      start: async (controller) => {
        try {
          for await (const chunk of openaiStream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              fullContent += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }

          // Сохраняем финальный ответ ассистента
          if (fullContent) {
            await this.prisma.chatMessage.create({
              data: {
                userId:    userId ?? null,
                sessionId: sessionId ?? null,
                role:      'assistant',
                content:   fullContent,
              },
            }).catch(() => null);
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  /**
   * Анализирует сообщение через GPT и обновляет AI-профиль пользователя.
   * Вызывается fire-and-forget — не влияет на стрим.
   */
  private async extractAndUpdateProfile(userId: number, message: string): Promise<void> {
    if (!message || message.length < 10) return;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Ты парсер намерений. Извлеки из сообщения пользователя данные о покупке недвижимости.
Верни ТОЛЬКО JSON без markdown:
{
  "budgetMin": число или null,
  "budgetMax": число или null,
  "intent": "low"|"medium"|"high"|null,
  "userPreferences": {
    "rooms": [массив чисел] или null,
    "districts": [массив строк] или null,
    "deadline": "строка" или null
  }
}

Правила для intent:
- "high" — фразы: "хочу купить", "куплю", "покупаем", "ипотека", "взнос"
- "medium" — фразы: "рассматриваю", "присматриваюсь", "интересует"
- "low" — всё остальное

Если данных нет — null для этого поля.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content ?? '';

    try {
      const extracted: AiProfileExtract = JSON.parse(raw);
      await this.users.updateAiProfile(userId, {
        ...(extracted.budgetMin  !== undefined && extracted.budgetMin  !== null ? { budgetMin:  extracted.budgetMin }  : {}),
        ...(extracted.budgetMax  !== undefined && extracted.budgetMax  !== null ? { budgetMax:  extracted.budgetMax }  : {}),
        ...(extracted.intent     !== undefined && extracted.intent     !== null ? { intent:     extracted.intent }     : {}),
        ...(extracted.userPreferences ? { userPreferences: extracted.userPreferences as Record<string, unknown> } : {}),
      });
    } catch {
      this.logger.debug(`Profile extract parse error for msg: "${message.slice(0, 50)}"`);
    }
  }

  private buildSystemPrompt(properties: any[]): string {
    const propList = properties
      .map(
        (p) =>
          `- ${p.name} (${p.district}): от ${Number(p.priceFrom).toLocaleString('ru')} ₽, ` +
          `${p.areaMin}–${p.areaMax} м², сдача ${p.deadlineQ ? `${p.deadlineQ}кв ` : ''}${p.deadlineYear ?? ''}` +
          `${p.isHot ? ' [ХИТ]' : ''}`,
      )
      .join('\n');

    return `Ты — AI-консультант платформы "Новостройки Уфы". Помогаешь подобрать квартиру в новостройке.

Доступные ЖК:
${propList}

Правила:
1. Отвечай кратко и по делу, без воды.
2. Уточняй бюджет, количество комнат, район, срок.
3. Рекомендуй конкретные ЖК из списка выше.
4. Если пользователь готов к покупке — предложи нажать кнопку "Получить подборку".
5. Никогда не придумывай ЖК, которых нет в списке.
6. Отвечай на русском языке.`;
  }

  async getHistory(userId: number, sessionId?: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        userId,
        ...(sessionId ? { sessionId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  private generateSessionId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
