// ============================================
// NIVA — High-Resolution Image Generation Adapter
// ============================================

import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { ImageGenOptions, ImageGenResult } from '../types';
import { logger } from '../../../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'generated', 'images');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class ImageAdapter {
  private getDimensions(aspectRatio?: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1280, height: 720 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '4:3':
        return { width: 1024, height: 768 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  }

  private enhancePrompt(prompt: string, style?: string): string {
    const base = prompt.trim();
    switch (style) {
      case 'cyberpunk':
        return `${base}, cyberpunk aesthetic, vibrant neon blue and purple lighting, futuristic high-tech details, cinematic lighting, 8k resolution`;
      case 'photorealistic':
        return `${base}, hyperrealistic photograph, 8k resolution, natural cinematic lighting, highly detailed, professional photography`;
      case 'anime':
        return `${base}, modern anime illustration style, vivid colors, crisp lines, Makoto Shinkai aesthetic, high resolution`;
      case '3d-render':
        return `${base}, 3D digital art, Octane render, ray tracing, smooth textures, volumetric lighting, artstation trending`;
      case 'minimalist':
        return `${base}, clean minimalist design, flat colors, elegant composition, modern vector aesthetic`;
      case 'vector':
        return `${base}, clean graphic vector illustration, SVG aesthetic, sharp crisp edges, corporate tech style`;
      default:
        return `${base}, high quality, sharp focus, 8k resolution`;
    }
  }

  private downloadImage(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(destPath);
      const client = url.startsWith('https') ? https : http;

      const request = client.get(url, (response) => {
        // Handle HTTP redirects (301, 302, 307)
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          this.downloadImage(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          fileStream.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
          return;
        }

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      });

      request.on('error', (err) => {
        fileStream.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });

      request.setTimeout(35000, () => {
        request.destroy();
        fileStream.close();
        fs.unlink(destPath, () => {});
        reject(new Error('Image generation request timed out after 35s'));
      });
    });
  }

  /**
   * Fallback: Generate a high-tech SVG poster if network download is unavailable
   */
  private generateFallbackSvg(prompt: string, destPath: string, width: number, height: number): void {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6366f1" />
          <stop offset="50%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 3}" fill="none" stroke="url(#accentGrad)" stroke-width="3" opacity="0.4" />
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" opacity="0.2" />
      <text x="${width / 2}" y="${height / 2 - 30}" fill="#f8fafc" font-size="28" font-weight="700" font-family="sans-serif" text-anchor="middle">NIVA AI GENERATION</text>
      <text x="${width / 2}" y="${height / 2 + 20}" fill="#94a3b8" font-size="16" font-family="sans-serif" text-anchor="middle">${prompt.slice(0, 50)}</text>
      <rect x="${width / 2 - 120}" y="${height / 2 + 60}" width="240" height="36" rx="18" fill="url(#accentGrad)" opacity="0.8" />
      <text x="${width / 2}" y="${height / 2 + 83}" fill="#ffffff" font-size="14" font-weight="600" font-family="sans-serif" text-anchor="middle">Neural Vision Asset</text>
    </svg>`;
    fs.writeFileSync(destPath, svg, 'utf-8');
  }

  async generate(options: ImageGenOptions): Promise<ImageGenResult> {
    const { width, height } = this.getDimensions(options.aspectRatio);
    const style = options.style || 'cyberpunk';
    const enhancedPrompt = this.enhancePrompt(options.prompt, style);
    const seed = options.seed || Math.floor(Math.random() * 1000000);

    const filename = `niva-img-${Date.now()}-${seed}.jpg`;
    const destPath = path.join(UPLOAD_DIR, filename);

    logger.info(`Starting image synthesis: "${options.prompt}" (${width}x${height}, style: ${style})`);

    try {
      // Free neural text-to-image engine (Pollinations)
      const serviceUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      await this.downloadImage(serviceUrl, destPath);

      logger.info(`Image generation complete: ${filename}`);
      return {
        imageUrl: `/generated/images/${filename}`,
        localPath: destPath,
        prompt: options.prompt,
        style,
        aspectRatio: options.aspectRatio || '1:1',
        width,
        height,
      };
    } catch (err: any) {
      logger.warn(`External image engine failed (${err.message}). Generating fallback vector asset.`);
      const svgFilename = `niva-img-${Date.now()}-${seed}.svg`;
      const svgPath = path.join(UPLOAD_DIR, svgFilename);
      this.generateFallbackSvg(options.prompt, svgPath, width, height);

      return {
        imageUrl: `/generated/images/${svgFilename}`,
        localPath: svgPath,
        prompt: options.prompt,
        style,
        aspectRatio: options.aspectRatio || '1:1',
        width,
        height,
      };
    }
  }
}

export const imageAdapter = new ImageAdapter();
