
import { VideoCategory } from "../types";

export class VideoProductionService {
  private static instance: VideoProductionService;
  private webhookUrl = 'https://n8n-n8n.6wqa93.easypanel.host/webhook/video-production';

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new VideoProductionService();
    }
    return this.instance;
  }

  async requestProduction(prompt: string, category: VideoCategory, userId: string, isPublic: boolean): Promise<boolean> {
    // Log para depuração no console do navegador
    console.log(`[VideoService] Iniciando produção para ID: ${userId}`);
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_video',
          prompt,
          category,
          user_id: userId, // ID técnico (UUID ou mock-id)
          isPublic,
          timestamp: Date.now(),
          aspectRatio: '9:16',
          resolution: '720p'
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o servidor de produção');
      }

      return true;
    } catch (error) {
      console.error("Production Request Error:", error);
      return false; 
    }
  }

  getPlaceholderVideo(category: string): string {
    const placeholders: Record<string, string> = {
      'construction_renovation': 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-at-night-40244-large.mp4',
      'animation': 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-fenced-in-the-middle-of-the-desert-42557-large.mp4',
      'motivational': 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4'
    };
    return placeholders[category] || placeholders['motivational'];
  }
}
