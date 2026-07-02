
import React, { useState } from 'react';
import { VideoItem, ScheduledPost } from '../types';

interface VideoSchedulerProps {
  myVideos: VideoItem[];
}

const VideoScheduler: React.FC<VideoSchedulerProps> = ({ myVideos }) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [newPost, setNewPost] = useState<Partial<ScheduledPost>>({
    platform: 'instagram',
    scheduledAt: '',
    caption: ''
  });

  const handleAddSchedule = () => {
    if (!newPost.videoId || !newPost.scheduledAt) return;
    
    const video = myVideos.find(v => v.id === newPost.videoId);
    if (!video) return;

    const post: ScheduledPost = {
      id: Date.now().toString(),
      videoId: video.id,
      videoTitle: video.title,
      thumbnail: video.thumbnail,
      platform: newPost.platform as any,
      scheduledAt: newPost.scheduledAt as string,
      caption: newPost.caption || '',
      status: 'pending'
    };

    setScheduledPosts([post, ...scheduledPosts]);
    setIsScheduling(false);
    setNewPost({ platform: 'instagram', scheduledAt: '', caption: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Agendador <span className="gradient-text">Automático</span></h2>
          <p className="text-slate-400">Programe seus vídeos diretamente para suas redes sociais.</p>
        </div>
        <button 
          onClick={() => setIsScheduling(true)}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-widest"
        >
          <i className="fa-solid fa-calendar-plus text-base"></i>
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {scheduledPosts.length === 0 ? (
            <div className="glass p-16 rounded-[3rem] border-slate-800 text-center space-y-4 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-2">
                <i className="fa-solid fa-calendar-day text-3xl text-slate-700"></i>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum post agendado no momento.</p>
            </div>
          ) : (
            scheduledPosts.map(post => (
              <div key={post.id} className="glass p-5 rounded-3xl border-slate-800 flex items-center gap-5 hover:border-slate-700 transition-all group">
                <div className="w-16 h-24 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <img src={post.thumbnail} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white truncate uppercase text-sm tracking-tight">{post.videoTitle}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                      <i className="fa-solid fa-clock mr-1"></i>
                      {new Date(post.scheduledAt).toLocaleString()}
                    </span>
                    <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-slate-400">
                      {post.platform}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setScheduledPosts(prev => prev.filter(p => p.id !== post.id))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
           <div className="glass p-8 rounded-[2.5rem] border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-indigo-400"></i>
                Estatísticas
              </h3>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ativos</span>
                <span className="text-3xl font-black text-white tracking-tighter">{scheduledPosts.length}</span>
              </div>
           </div>
        </div>
      </div>

      {isScheduling && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="glass w-full max-w-md p-10 rounded-[3rem] border-slate-800 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Programar</h3>
              <button onClick={() => setIsScheduling(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Vídeo</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  value={newPost.videoId}
                  onChange={e => setNewPost({...newPost, videoId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {myVideos.map(v => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Horário</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  value={newPost.scheduledAt}
                  onChange={e => setNewPost({...newPost, scheduledAt: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Rede Social</label>
                <div className="grid grid-cols-3 gap-3">
                  {['instagram', 'tiktok', 'youtube'].map(plat => (
                    <button 
                      key={plat}
                      onClick={() => setNewPost({...newPost, platform: plat as any})}
                      className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        newPost.platform === plat 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddSchedule}
              disabled={!newPost.videoId || !newPost.scheduledAt}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              Confirmar Agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoScheduler;
