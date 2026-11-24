import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Palette,
  Sparkles,
  Users,
  User,
  TrendingUp,
  Volume2,
  VolumeX,
  Clock,
  Coins,
  Package,
  Smile,
  Music,
  Armchair,
  Sun,
  Cloud,
  CloudRain,
} from 'lucide-react';
import { GameState, WeatherType } from '../types/game';

export type ActiveModal =
  | null
  | 'shop_stock'
  | 'decor'
  | 'upgrades'
  | 'employees'
  | 'history'
  | 'furniture';

interface HUDProps {
  state: GameState;
  weather: WeatherType;
  interactPrompt: string | null;
  infoMessage?: string | null;
  isPlacing?: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onCycleWeather: () => void;
  onInteract: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onOpenCustomize: () => void;
  onEmote: (emote: 'wave' | 'dance') => void;
}

const INFO_PHRASES = [
  'Dica: Altere o preço de venda dos produtos no menu Estoque para lucrar mais.',
  'Caixa: Enquanto não contratar a funcionária Sofia, vá ao balcão e aperte [E] para passar os produtos.',
  'Defesa: Compre a Arma de Defesa da Loja em Upgrades para espantar ladras rapidamente com [F]!',
  'Proteção: Contrate Valéria (Segurança) em Funcionárias para impedir que a loja seja roubada.',
  'Lazer: Aproxime-se dos bancos na rua ou móveis de assento e aperte [E] para sentar.',
  'Expediente: O dia na Zene Collection vai das 08:00 às 19:00 com fechamento financeiro automático.',
];

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  weather,
  interactPrompt,
  infoMessage,
  isPlacing = false,
  muted,
  onToggleMute,
  onCycleWeather,
  onInteract,
  onOpenModal,
  onOpenCustomize,
  onEmote,
}) => {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % INFO_PHRASES.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const totalStock = state.products.reduce((acc, p) => acc + p.stock, 0);
  const weatherLabel =
    weather === 'sunny' ? 'Ensolarado' : weather === 'cloudy' ? 'Nublado' : 'Chuva';

  const displayedPhrase = infoMessage || INFO_PHRASES[phraseIdx];
  const isUrgent = Boolean(
    infoMessage &&
      (infoMessage.toLowerCase().includes('ladra') ||
        infoMessage.toLowerCase().includes('roubou') ||
        infoMessage.toLowerCase().includes('atenção'))
  );

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Money, Clock, Stock */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white/95 border-2 border-[#ffc2d1] rounded-2xl px-4 py-2 shadow-sm">
            <Coins className="w-5 h-5 text-[#ff758f]" />
            <span className="font-extrabold text-[#6d597a] tabular-nums">
              R$ {Math.floor(state.money)}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/95 border-2 border-[#d8c2f0] rounded-2xl px-4 py-2 shadow-sm">
            <Clock className="w-4 h-4 text-[#9d79d6]" />
            <span className="font-bold text-sm text-[#6d597a] tabular-nums">
              Dia {state.day} · {formatTime(state.timeMinutes)}
            </span>
            <span
              className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                state.shopOpen
                  ? 'bg-[#c1ebd7] text-[#2d6a4f]'
                  : 'bg-[#ffc2d1] text-[#9d2a4b]'
              }`}
            >
              {state.shopOpen ? 'ABERTA' : 'FECHADA'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/95 border-2 border-[#bde0fe] rounded-2xl px-3.5 py-2 shadow-sm">
            <Package className="w-4 h-4 text-[#457b9d]" />
            <span className="font-bold text-sm text-[#6d597a] tabular-nums">
              {totalStock}/{state.inventoryCapacity}
            </span>
          </div>

          <button
            onClick={onCycleWeather}
            title="Clima atual (clique para alternar)"
            className="flex items-center gap-1.5 bg-white/95 border-2 border-[#bde0fe] hover:bg-[#e0f2fe] rounded-2xl px-3.5 py-2 shadow-sm cursor-pointer transition-colors"
          >
            {weather === 'sunny' && <Sun className="w-4 h-4 text-[#f4a261]" />}
            {weather === 'cloudy' && <Cloud className="w-4 h-4 text-[#6d7f91]" />}
            {weather === 'rainy' && <CloudRain className="w-4 h-4 text-[#3b82f6]" />}
            <span className="font-bold text-xs sm:text-sm text-[#6d597a] whitespace-nowrap">
              {weatherLabel}
            </span>
          </button>
        </div>

        {/* Right: Emotes & Mute */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => onEmote('wave')}
            title="Acenar (1)"
            className="p-2.5 rounded-2xl bg-white/95 border-2 border-[#ffc2d1] text-[#6d597a] hover:bg-[#ffe5ec] shadow-sm cursor-pointer"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEmote('dance')}
            title="Dançar (2)"
            className="p-2.5 rounded-2xl bg-white/95 border-2 border-[#d8c2f0] text-[#6d597a] hover:bg-[#f3e8ff] shadow-sm cursor-pointer"
          >
            <Music className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMute}
            title={muted ? 'Ativar Som' : 'Silenciar'}
            className="p-2.5 rounded-2xl bg-white/95 border-2 border-[#bde0fe] text-[#6d597a] hover:bg-[#e0f2fe] shadow-sm cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Area: Prompt + Info Phrase Bar + Options Dock */}
      <div className="flex flex-col items-center gap-2">
        {interactPrompt && (
          <button
            type="button"
            onClick={onInteract}
            className="pointer-events-auto bg-[#6d597a]/95 hover:bg-[#5c4969] text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg cursor-pointer transition-colors"
          >
            {interactPrompt}
          </button>
        )}

        {!isPlacing && (
          <div
            className={`pointer-events-auto max-w-[92vw] px-4 py-1.5 rounded-2xl border shadow-sm text-center text-xs sm:text-sm font-bold transition-colors ${
              isUrgent
                ? 'bg-[#fff0f3]/95 border-[#e63946] text-[#9d0208]'
                : 'bg-white/95 border-[#d8c2f0] text-[#5c4969]'
            }`}
          >
            {displayedPhrase}
          </div>
        )}

        {/* Bottom Action Dock (Menu de Opções) */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-white/95 border-2 border-[#ffc2d1] rounded-3xl px-4 py-2.5 shadow-lg">
          <button
            onClick={() => onOpenModal('shop_stock')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#ffe5ec] hover:bg-[#ffc2d1] text-[#9d2a4b] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Estoque
          </button>
          <button
            onClick={() => onOpenModal('furniture')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#fde2e4] hover:bg-[#fad2e1] text-[#9d2a4b] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <Armchair className="w-4 h-4" />
            Móveis
          </button>
          <button
            onClick={() => onOpenModal('decor')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#f3e8ff] hover:bg-[#d8c2f0] text-[#5e3a87] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <Palette className="w-4 h-4" />
            Decoração
          </button>
          <button
            onClick={() => onOpenModal('upgrades')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#e0f2fe] hover:bg-[#bde0fe] text-[#1d4e89] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Upgrades
          </button>
          <button
            onClick={() => onOpenModal('employees')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#d8f3dc] hover:bg-[#c1ebd7] text-[#2d6a4f] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <Users className="w-4 h-4" />
            Funcionárias
          </button>
          <button
            onClick={() => onOpenModal('history')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#fff3d6] hover:bg-[#ffe5a3] text-[#7f5539] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Finanças
          </button>
          <button
            onClick={onOpenCustomize}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#6d597a] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <User className="w-4 h-4" />
            Elizene
          </button>
        </div>
      </div>
    </div>
  );
};
