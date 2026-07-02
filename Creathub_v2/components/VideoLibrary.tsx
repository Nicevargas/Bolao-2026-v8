
import React from 'react';
import { VideoItem } from '../types';
import VideoCard from './VideoCard';

interface VideoLibraryProps {
  videos: VideoItem[];
  onSelect: (video: VideoItem) => void;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ videos, onSelect }) => {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
          <i className="fa-solid fa-film text-4xl text-slate-700"></i>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Sua biblioteca está vazia</h3>
          <p className="text-slate-400 max-w-xs mx-auto">Comece a explorar a galeria ou crie seu primeiro vídeo original com IA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold text-white">Meus Vídeos</h2>
        <p className="text-slate-400">Conteúdo desbloqueado e criações originais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

export default VideoLibrary;
