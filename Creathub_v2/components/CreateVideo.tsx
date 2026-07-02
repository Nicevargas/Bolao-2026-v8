
import React, { useState } from 'react';
import { VideoProductionService } from '../services/videoService';
import { VideoCategory, AnimationSubCategory, VideoItem } from '../types';

interface CreateVideoProps {
  onVideoGenerated: (video: VideoItem) => void;
}

const CreateVideo: React.FC<CreateVideoProps> = ({ onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<VideoCategory>('construction_renovation');
  const [subCategory, setSubCategory] = useState<AnimationSubCategory>('pixar_3d');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestProduction = async () => {
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    try {
      const service = VideoProductionService.getInstance();
      const finalSub = category === 'animation' ? subCategory : 'none';
      
      const success = await service.requestProduction(prompt, category, "public-user", true);
      
      if (success) {
        const newVideo: VideoItem = {
          id: `prod-${Date.now()}`,
          title: prompt.slice(0, 20),
          thumbnail: 'https://picsum.photos/seed/production/400/711',
          videoUrl: service.getPlaceholderVideo(category),
          author: 'Minha Criação',
          createdAt: Date.now(),
          category: category,
          subCategory: finalSub !== 'none' ? finalSub : undefined,
        };

        alert('Sua solicitação de vídeo foi iniciada!');
        onVideoGenerated(newVideo);
        setPrompt('');
      }
    } catch (error) {
      alert('Erro ao iniciar produção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Gerador <span className="gradient-text">Studio IA</span></h2>
        <p className="text-slate-400">Descreva sua ideia e nossa inteligência artificial cuidará da renderização.</p>
      </div>

      <div className="glass p-10 rounded-[3rem] border-slate-800 space-y-8 shadow-2xl">
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Briefing do Vídeo</label>
          <textarea 
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white text-lg focus:border-indigo-500 outline-none transition-all min-h-[140px] shadow-inner"
            placeholder="Ex: Reforma de uma cozinha antiga para um estilo minimalista com iluminação natural..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Escolha o Nicho</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'construction_renovation', label: 'Construção', icon: 'fa-trowel-bricks' },
              { id: 'animation', label: 'Animação', icon: 'fa-wand-sparkles' },
              { id: 'motivational', label: 'Motivacional', icon: 'fa-quote-left' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as VideoCategory)}
                className={`p-6 rounded-3xl flex flex-col items-center gap-3 border-2 transition-all ${
                  category === cat.id 
                    ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                    : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                }`}
              >
                <i className={`fa-solid ${cat.icon} text-2xl`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleRequestProduction}
          disabled={isSubmitting || !prompt.trim()}
          className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {isSubmitting ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-bolt"></i> Iniciar Produção Ilimitada</>}
        </button>
      </div>
    </div>
  );
};

export default CreateVideo;
