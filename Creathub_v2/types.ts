
export type ViewType = 'gallery' | 'create' | 'my-videos' | 'scheduler' | 'store';

export type VideoCategory = 'construction_renovation' | 'animation' | 'motivational' | 'all';
export type AnimationSubCategory = 'pixar_3d' | 'anime_fx' | 'motion_graphics' | 'digital_surrealism' | 'none';

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  author: string;
  category: VideoCategory;
  subCategory?: AnimationSubCategory;
  download_count?: number;
  createdAt: number;
}

export interface ScheduledPost {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  scheduledAt: string;
  caption: string;
  status: 'pending' | 'posted' | 'failed';
}

// Added CreditPackage interface for store functionality
export interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  popular?: boolean;
  bestValue?: boolean;
}

// Added PaymentResponse interface for webhook results
export interface PaymentResponse {
  qrcode: string;
  img_qrcode: string;
  valor: number;
}

// Added UserProfile interface for user management and profile modals
export interface UserProfile {
  id: string;
  display_name?: string;
  email?: string;
  taxId?: string;
  phone?: string;
  avatar_url?: string;
  isMock?: boolean;
}
