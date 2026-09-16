// ============================================
// NIVA — Central Generation Service & Job Queue
// ============================================

import { prisma } from '../../config/database';
import {
  ImageGenOptions,
  ImageGenResult,
  CodeGenOptions,
  CodeGenResult,
  DocumentGenOptions,
  DocumentGenResult,
  AudioGenOptions,
  AudioGenResult,
  GenerationJob,
} from './types';
import { imageAdapter } from './adapters/image.adapter';
import { codeAdapter } from './adapters/code.adapter';
import { documentAdapter } from './adapters/document.adapter';
import { audioAdapter } from './adapters/audio.adapter';
import { logger } from '../../utils/logger';

export class GenerationService {
  /**
   * Generate Image with job tracking
   */
  async generateImage(userId: string, options: ImageGenOptions): Promise<ImageGenResult> {
    const job = await prisma.job.create({
      data: {
        type: 'generation_image',
        status: 'running',
        input: options as any,
        startedAt: new Date(),
      },
    });

    try {
      const result = await imageAdapter.generate(options);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: result as any,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  /**
   * Generate Code with job tracking
   */
  async generateCode(userId: string, options: CodeGenOptions): Promise<CodeGenResult> {
    const job = await prisma.job.create({
      data: {
        type: 'generation_code',
        status: 'running',
        input: options as any,
        startedAt: new Date(),
      },
    });

    try {
      const result = await codeAdapter.generate(options);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: result as any,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  /**
   * Generate Document with job tracking
   */
  async generateDocument(userId: string, options: DocumentGenOptions): Promise<DocumentGenResult> {
    const job = await prisma.job.create({
      data: {
        type: 'generation_document',
        status: 'running',
        input: options as any,
        startedAt: new Date(),
      },
    });

    try {
      const result = await documentAdapter.generate(options);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: result as any,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  /**
   * Generate Audio with job tracking
   */
  async generateAudio(userId: string, options: AudioGenOptions): Promise<AudioGenResult> {
    const job = await prisma.job.create({
      data: {
        type: 'generation_audio',
        status: 'running',
        input: options as any,
        startedAt: new Date(),
      },
    });

    try {
      const result = await audioAdapter.generate(options);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          output: result as any,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  /**
   * Get recent generation jobs
   */
  async getRecentJobs(type?: string): Promise<GenerationJob[]> {
    const where: any = {};
    if (type) {
      where.type = `generation_${type}`;
    } else {
      where.type = { startsWith: 'generation_' };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return jobs.map((j) => ({
      id: j.id,
      type: j.type.replace('generation_', '') as any,
      status: j.status as any,
      input: j.input,
      output: j.output,
      error: j.error || undefined,
      createdAt: j.createdAt,
      completedAt: j.completedAt || undefined,
    }));
  }

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<GenerationJob | null> {
    const j = await prisma.job.findUnique({ where: { id } });
    if (!j) return null;

    return {
      id: j.id,
      type: j.type.replace('generation_', '') as any,
      status: j.status as any,
      input: j.input,
      output: j.output,
      error: j.error || undefined,
      createdAt: j.createdAt,
      completedAt: j.completedAt || undefined,
    };
  }
}

export const generationService = new GenerationService();
