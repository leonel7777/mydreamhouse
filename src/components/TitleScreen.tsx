import React, { useEffect } from 'react';
import { Sparkles, Play } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  hasSave: boolean;
  onContinue?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  hasSave,
  onContinue,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (hasSave && onContinue) onContinue();
        else onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSave, onContinue, onStart]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-[#ffe5ec]/90 via-[#fff0f3]/80 to-[#d8c2f0]/90 select-none">
      <div className="flex items-center gap-2 text-[#b56576] font-semibold tracking-widest uppercase text-xs">
        <Sparkles className="w-4 h-4" />
        <span>Simulador Boutique 3D</span>
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-center text-center max-w-2xl">
        <svg
          viewBox="0 0 600 160"
          className="w-full max-w-lg drop-shadow-sm mb-4"
          aria-label="MY DREAM HOUSE"
        >
          <defs>
            <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff758f" />
              <stop offset="50%" stopColor="#d883b7" />
              <stop offset="100%" stopColor="#9d79d6" />
            </linearGradient>
          </defs>
          <text
            x="300"
            y="78"
            textAnchor="middle"
            fontSize="58"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="url(#titleGrad)"
            letterSpacing="4"
          >
            MY DREAM
          </text>
          <text
            x="300"
            y="126"
            textAnchor="middle"
            fontSize="36"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#6d597a"
            letterSpacing="8"
          >
            HOUSE
          </text>
        </svg>

        <p className="text-[#6d597a] text-sm sm:text-base max-w-md mb-8">
          Personalize Elizene, gerencie sua boutique de acessórios femininos,
          contrate funcionárias e construa a vizinhança dos seus sonhos.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasSave && onContinue && (
            <button
              onClick={onContinue}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#ff758f] hover:bg-[#ff5c7c] text-white font-bold text-lg shadow-lg shadow-[#ff758f]/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Continuar Jogo
            </button>
          )}
          <button
            onClick={onStart}
            className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 cursor-pointer ${
              hasSave
                ? 'bg-white hover:bg-[#fff0f3] text-[#6d597a] border-2 border-[#ffc2d1]'
                : 'bg-[#ff758f] hover:bg-[#ff5c7c] text-white shadow-[#ff758f]/30'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {hasSave ? 'Novo Jogo' : 'Começar Aventura'}
          </button>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-[#6d597a]/80 font-medium tracking-wide">
        WASD Mover · Mouse Câmera · Espaço Pular · Shift Correr · E Interagir · Enter Iniciar
      </div>
    </div>
  );
};
