
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import VideoCard from './components/VideoCard';
import VideoModal from './components/VideoModal';
import CreateVideo from './components/CreateVideo';
import VideoLibrary from './components/VideoLibrary';
import VideoScheduler from './components/VideoScheduler';
import CreditStore from './components/CreditStore';
import { ViewType, VideoItem, UserProfile } from './types';
import { INITIAL_DATABASE } from './constants';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('gallery');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const [dbVideos, setDbVideos] = useState<VideoItem[]>(INITIAL_DATABASE);
  const [selectedItem, setSelectedItem] = useState<VideoItem | null>(null);
  const [myVideos, setMyVideos] = useState<VideoItem[]>([]);
  
  // Perfil de usuário mockado para gerenciar a loja
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user-mock-123',
    display_name: 'Visitante Criativo',
    email: '',
    taxId: '',
    phone: '',
    isMock: true
  });

  const categories = useMemo(() => {
    const cats = new Set(dbVideos.map(v => v.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [dbVideos]);

  const fetchVideos = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('download_count', { ascending: false });

      if (data && !error) {
        const mapped: VideoItem[] = data.map((v: any) => ({
          id: v.id,
          title: v.title || 'Sem título',
          thumbnail: v.thumbnail || 'https://picsum.photos/seed/default/400/711',
          videoUrl: v.restored_url || v.original_url,
          author: 'IA_Studio',
          createdAt: new Date(v.created_at).getTime(),
          category: v.category,
          download_count: v.download_count
        }));
        setDbVideos(mapped);
      }
    } catch (err) {
      console.error("Erro ao buscar vídeos:", err);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    setLoading(false);
  }, [fetchVideos]);

  const handleVideoGenerated = (newVideo: VideoItem) => {
    setMyVideos(prev => [newVideo, ...prev]);
    setView('my-videos');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-[0.2em] text-[10px]">Iniciando Studio...</p>
      </div>
    );
  }

  const filteredVideos = activeCategory === 'all' 
    ? dbVideos 
    : dbVideos.filter(v => v.category === activeCategory);

  return (
    <Layout currentView={view} setView={setView}>
      {view === 'gallery' && (
        <div className="space-y-10 animate-in fade-in duration-1000">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white tracking-tighter">Studio <span className="gradient-text">Criativo</span></h2>
              <p className="text-slate-400 font-medium">Explore e baixe vídeos de alta qualidade gerados por IA.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                    activeCategory === cat 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} onSelect={setSelectedItem} />
            ))}
          </div>
        </div>
      )}

      {view === 'create' && <CreateVideo onVideoGenerated={handleVideoGenerated} />}
      {view === 'my-videos' && <VideoLibrary videos={myVideos} onSelect={setSelectedItem} />}
      {view === 'scheduler' && <VideoScheduler myVideos={myVideos} />}
      {view === 'store' && (
        <CreditStore 
          user={currentUser} 
          onPaymentSuccess={() => {
            alert("Pagamento identificado! Seus créditos serão adicionados em instantes.");
          }} 
        />
      )}

      {selectedItem && (
        <VideoModal 
          video={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onSchedule={() => { setView('scheduler'); setSelectedItem(null); }}
        />
      )}
    </Layout>
  );
};

export default App;
