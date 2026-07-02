
import React from 'react';
import { VideoItem } from '../types';

interface VideoModalProps {
  video: VideoItem;
  onClose: () => void;
  onSchedule: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ video, onClose, onSchedule }) => {
  const handleDownload = async () => {
    if (!video.videoUrl) return;
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title.replace(/\s+/g, '_')}_Studio.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed', error);
      alert('Erro ao baixar o vídeo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg max-h-[95vh] overflow-hidden rounded-[2.5rem] flex flex-col shadow-2xl relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black transition-all"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="w-full bg-black aspect-[9/16] max-h-[65vh] flex items-center justify-center overflow-hidden">
          <video 
            src={video.videoUrl} 
            controls 
            autoPlay 
            loop 
            className="h-full w-auto object-contain"
          />
        </div>

        <div className="p-8 flex flex-col bg-slate-900/95">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">{video.title}</h2>
            <div className="flex items-center gap-2">
               <p className="text-sm text-slate-400">Direção Artística: {video.author}</p>
               <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Original IA</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleDownload}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-widest"
            >
              <i className="fa-solid fa-download text-base"></i>
              Baixar Agora
            </button>
            
            <button 
              onClick={onSchedule}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all border border-slate-700 uppercase text-xs tracking-widest"
            >
              <i className="fa-solid fa-calendar-check text-base text-indigo-400"></i>
              Agendar Post
            </button>
          </div>

          <p className="mt-6 text-[9px] text-slate-600 text-center uppercase font-bold tracking-[0.2em]">
            Uso livre permitido para redes sociais e portfólio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
