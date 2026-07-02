
import { GoogleGenAI } from "@google/genai";
import { VideoCategory } from "../types";

export class GeminiVideoService {
  private static instance: GeminiVideoService;
  
  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new GeminiVideoService();
    }
    return this.instance;
  }

  async checkApiKey() {
    // @ts-ignore
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      // @ts-ignore
      return await window.aistudio.hasSelectedApiKey();
    }
    return true;
  }

  async requestApiKey() {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }

  private async notifyWebhook(category: VideoCategory, prompt: string, isPublic: boolean) {
    console.log(`[Webhook] Enviando solicitação de produção: ${category} | Público: ${isPublic}`);
  }

  async generateVideo(prompt: string, category: VideoCategory, isPublic: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    await this.notifyWebhook(category, prompt, isPublic);

    let specializedPrompt = prompt;
    if (category === 'construction_renovation') {
      specializedPrompt = `Timelapse construction and renovation of ${prompt}, high quality architecture transition, realistic materials, 4k, professional lighting`;
    } else if (category === 'animation') {
      specializedPrompt = `Creative high quality 3D animation, stylized character, ${prompt}, expressive motion, vibrant colors, artistic rendering, vertical 9:16`;
    } else if (category === 'motivational') {
      specializedPrompt = `Aesthetic cinematic scenery for motivational quote about ${prompt}, soft lighting, deep atmosphere, high quality visuals, peaceful motion`;
    }

    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: specializedPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Falha ao obter vídeo final.");

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      if (error?.message?.includes("Requested entity was not found.")) {
        await this.requestApiKey();
      }
      throw error;
    }
  }
}
