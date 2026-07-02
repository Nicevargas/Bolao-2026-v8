
import React from 'react';
import { VideoItem } from '../types';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onSelect }) => {
  return (
    <div 
      className="group relative glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-slate-800 hover:border-indigo-500/50"
      onClick={() => onSelect(video)}
    >
      <div className="aspect-[9/16] relative overflow-hidden bg-slate-900">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-indigo-600/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
            {video.category.replace('_', ' ')}
          </div>
        </div>

        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <i className="fa-solid fa-fire text-orange-500"></i>
          {video.download_count?.toLocaleString() || 0}
        </div>

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="fa-solid fa-play text-3xl text-white"></i>
        </div>
      </div>
      
      <div className="p-3 bg-slate-900/90 absolute bottom-0 left-0 right-0 border-t border-slate-800">
        <h3 className="font-bold text-white text-[11px] truncate uppercase tracking-wider">{video.title}</h3>
        <p className="text-[9px] text-slate-500 font-medium mt-1">por {video.author}</p>
      </div>
    </div>
  );
};

export default VideoCard;
