
import { VideoItem } from './types';

export const INITIAL_DATABASE: VideoItem[] = [
  {
    id: 'p-001',
    title: 'Projeto Loft Industrial',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-at-night-40244-large.mp4',
    author: 'IA_Builder',
    createdAt: Date.now(),
    category: 'construction_renovation',
    download_count: 3200
  },
  {
    id: 'p-002',
    title: 'Herói Animado 3D',
    thumbnail: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-liquid-smoke-swirling-in-slow-motion-42553-large.mp4',
    author: 'IA_Animator',
    createdAt: Date.now(),
    category: 'animation',
    subCategory: 'pixar_3d',
    download_count: 5100
  },
  {
    id: 'p-003',
    title: 'Reflexão Diária',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    author: 'IA_Zen',
    createdAt: Date.now(),
    category: 'motivational',
    download_count: 1800
  }
];
