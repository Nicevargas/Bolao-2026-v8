import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Play, Trophy } from 'lucide-react';

interface SplashViewProps {
  onDismiss: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0f14] flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden">
      {/* Animated Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/20 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-secondary/10 blur-[150px] rounded-full animate-pulse duration-2000"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md text-center space-y-8"
      >
        {/* Crest Wrapper with water wave ripple effect */}
        <div className="relative mx-auto w-40 h-40 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shadow-[0_0_50px_rgba(22,112,216,0.3)] group">
          <div className="absolute inset-0 rounded-full bg-primary/25 animate-ping opacity-75"></div>
          <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0f14] p-1 flex items-center justify-center relative">
            <img 
              src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
              alt="Natação Criativa Logo" 
              className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tighter leading-none">
            BOLÃO DA COPA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow to-secondary">
              2026
            </span>
          </h1>
          <p className="text-xs font-sans font-black dark:text-[#9cb1cc] light:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Trophy size={14} className="text-yellow" /> NATAÇÃO CRIATIVA FANTASY
          </p>
        </div>

        {progress < 100 ? (
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${progress}%` }}
              ></motion.div>
            </div>
            <p className="text-[10px] text-on-surface-variant font-mono tracking-widest uppercase">
              Inicializando Vestiários... {progress}%
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <button 
              onClick={onDismiss}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-headline text-sm font-black tracking-wider shadow-[0_4px_30px_rgba(217,28,122,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>ENTRAR EM CAMPO</span>
              <Play size={16} fill="white" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Wave bottom pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-20 opacity-30 select-none pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,32C120,42.7,240,53,360,48C480,42.7,600,21,720,21.3C840,21,960,42.7,1080,48C1200,53.3,1320,42.7,1440,32L1440,74L1320,74C1200,74,1080,74,960,74C840,74,720,74,600,74C480,74,360,74,240,74C120,74,0,74,0,74Z" fill="url(#wave-gradient)" />
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1670D8" />
              <stop offset="100%" stopColor="#D91C7A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
