import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const KNOWLEDGE_DIR = join(process.cwd(), 'knowledge-base');
const MAX_CHUNK_CHARS = 1200;
// Initial cutoff; tune against real questions as the knowledge base grows.
const MIN_SIMILARITY = 0.45;

export interface KnowledgeResult {
  source: string;
  title: string;
  content: string;
  similarity: number;
}

interface KnowledgeChunkInput {
  title: string;
  content: string;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY', '') });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureVectorStore();
      await this.indexKnowledgeBase();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Knowledge indexing is unavailable: ${message}`);
    }
  }

  /** Returns semantically similar source passages for a factual user question. */
  async search(question: string, limit = 3): Promise<KnowledgeResult[]> {
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
      encoding_format: 'float',
    });
    const vector = this.toVectorLiteral(response.data[0].embedding);

    return this.prisma.$queryRaw<KnowledgeResult[]>(Prisma.sql`
      SELECT
        source,
        title,
        content,
        (1 - (embedding <=> ${vector}::vector))::double precision AS similarity
      FROM rag_chunks
      WHERE 1 - (embedding <=> ${vector}::vector) >= ${MIN_SIMILARITY}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `);
  }

  private async ensureVectorStore(): Promise<void> {
    // The vector type is intentionally managed with SQL: Prisma 5 does not
    // expose pgvector values as regular generated fields.
    await this.prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id BIGSERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        document_hash CHAR(64) NOT NULL,
        embedding vector(1536) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (source, chunk_index)
      )
    `);
  }

  private async indexKnowledgeBase(): Promise<void> {
    const files = (await readdir(KNOWLEDGE_DIR)).filter((file) => file.endsWith('.md'));
    if (files.length === 0) {
      this.logger.warn(`No Markdown knowledge sources found in ${KNOWLEDGE_DIR}`);
      return;
    }

    for (const file of files) {
      const markdown = await readFile(join(KNOWLEDGE_DIR, file), 'utf8');
      const chunks = this.splitMarkdown(markdown);
      if (chunks.length === 0) continue;

      const source = `knowledge-base/${file}`;
      const documentHash = createHash('sha256')
        .update(`${EMBEDDING_MODEL}\n${markdown}`)
        .digest('hex');
      const existing = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM rag_chunks
        WHERE source = ${source} AND document_hash = ${documentHash}
      `);

      if (Number(existing[0]?.count ?? 0n) === chunks.length) continue;

      const embedded = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunks.map((chunk) => chunk.content),
        encoding_format: 'float',
      });

      await this.prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(Prisma.sql`DELETE FROM rag_chunks WHERE source = ${source}`);
        for (let index = 0; index < chunks.length; index += 1) {
          const chunk = chunks[index];
          const vector = this.toVectorLiteral(embedded.data[index].embedding);
          await transaction.$executeRaw(Prisma.sql`
            INSERT INTO rag_chunks (source, title, chunk_index, content, document_hash, embedding)
            VALUES (${source}, ${chunk.title}, ${index}, ${chunk.content}, ${documentHash}, ${vector}::vector)
          `);
        }
      });

      this.logger.log(`Indexed ${chunks.length} knowledge chunks from ${source}`);
    }
  }

  private splitMarkdown(markdown: string): KnowledgeChunkInput[] {
    const documentTitle = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? 'Knowledge base';
    const sections = markdown.split(/(?=^##\s+)/m);
    const chunks: KnowledgeChunkInput[] = [];

    for (const section of sections) {
      const heading = section.match(/^##\s+(.+)$/m)?.[1]?.trim() ?? documentTitle;
      const body = section.replace(/^#{1,2}\s+.*$/gm, '').trim();
      if (!body) continue;

      let current = '';
      for (const paragraph of body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)) {
        const next = current ? `${current}\n\n${paragraph}` : paragraph;
        if (next.length > MAX_CHUNK_CHARS && current) {
          chunks.push({ title: `${documentTitle} — ${heading}`, content: current });
          current = paragraph;
        } else {
          current = next;
        }
      }
      if (current) chunks.push({ title: `${documentTitle} — ${heading}`, content: current });
    }

    return chunks;
  }

  private toVectorLiteral(values: number[]): string {
    return `[${values.map((value) => {
      if (!Number.isFinite(value)) throw new Error('Embedding contained a non-finite value');
      return value.toString();
    }).join(',')}]`;
  }
}
