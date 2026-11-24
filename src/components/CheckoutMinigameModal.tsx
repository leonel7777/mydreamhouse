import React, { useEffect, useState } from 'react';
import { ScanBarcode, CheckCircle2, ShoppingBag, Sparkles, X, ArrowRight } from 'lucide-react';
import { CheckoutItem, CheckoutSession } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface CheckoutMinigameModalProps {
  session: CheckoutSession | null;
  onComplete: (npcIndex: number, soldItems: CheckoutItem[]) => void;
  onCancel: (npcIndex: number) => void;
}

export const CheckoutMinigameModal: React.FC<CheckoutMinigameModalProps> = ({
  session,
  onComplete,
  onCancel,
}) => {
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [scannerHover, setScannerHover] = useState(false);
  const [lastScannedFlash, setLastScannedFlash] = useState<string | null>(null);

  useEffect(() => {
    setScannedIds([]);
    setDraggingId(null);
    setScannerHover(false);
    setLastScannedFlash(null);
  }, [session]);

  const items = session?.items ?? [];
  const scannedSet = new Set(scannedIds);
  const unscannedItems = items.filter((it) => !scannedSet.has(it.uid));
  const scannedItems = items.filter((it) => scannedSet.has(it.uid));
  const allScanned = items.length > 0 && scannedItems.length === items.length;
  const totalValue = items.reduce((sum, it) => sum + it.sellPrice, 0);

  const scanItem = (item: CheckoutItem) => {
    if (scannedSet.has(item.uid)) return;
    soundEngine.playScanBeep();
    setScannedIds((prev) => [...prev, item.uid]);
    setLastScannedFlash(item.name);
    window.setTimeout(() => {
      setLastScannedFlash((curr) => (curr === item.name ? null : curr));
    }, 650);
  };

  useEffect(() => {
    if (!session) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onCancel(session.npcIndex);
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (allScanned) {
          soundEngine.playCashRegister();
          onComplete(session.npcIndex, items);
        } else if (unscannedItems[0]) {
          scanItem(unscannedItems[0]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-[#ffc2d1] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#fff0f3] border-b border-[#ffc2d1]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#ff758f] text-white">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#b56576]">
                Elizene no Caixa · Atendimento
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#6d597a]">
                Passe cada produto no leitor ({scannedItems.length}/{items.length})
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCancel(session.npcIndex)}
            className="p-1.5 rounded-full hover:bg-[#ffc2d1]/50 text-[#6d597a] cursor-pointer"
            title="Sair do caixa (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Conveyor Belt (Esteira de Produtos) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#6d597a] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#ff758f]" />
                Cesta da Cliente
              </span>
              <span className="text-[11px] font-semibold text-gray-500">
                Clique ou arraste para o leitor
              </span>
            </div>

            <div className="space-y-2.5 bg-[#f8edeb] p-3.5 rounded-2xl border border-[#ffc2d1]/70 min-h-[210px]">
              {items.map((item) => {
                const isScanned = scannedSet.has(item.uid);
                return (
                  <div
                    key={item.uid}
                    draggable={!isScanned}
                    onDragStart={() => setDraggingId(item.uid)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setScannerHover(false);
                    }}
                    onClick={() => {
                      if (!isScanned) scanItem(item);
                    }}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isScanned
                        ? 'bg-[#d8f3dc]/70 border-[#95d5b2] opacity-75'
                        : 'bg-white border-gray-200 hover:border-[#ff758f] hover:shadow-md cursor-pointer active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#6d597a]">{item.name}</p>
                        <p className="text-[11px] font-extrabold text-[#2d6a4f] tabular-nums">
                          R$ {item.sellPrice}
                        </p>
                      </div>
                    </div>

                    {isScanned ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#2d6a4f] bg-[#c1ebd7] px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scanItem(item);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] text-white text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        Passar <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Scanner Pad & Receipt */}
          <div className="flex flex-col justify-between gap-3">
            {/* Barcode Scanner Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setScannerHover(true);
              }}
              onDragLeave={() => setScannerHover(false)}
              onDrop={(e) => {
                e.preventDefault();
                setScannerHover(false);
                if (draggingId) {
                  const found = items.find((it) => it.uid === draggingId);
                  if (found) scanItem(found);
                }
                setDraggingId(null);
              }}
              onClick={() => {
                if (unscannedItems[0]) scanItem(unscannedItems[0]);
              }}
              className={`relative p-4 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                scannerHover
                  ? 'border-[#2ec4b6] bg-[#e0fbfc]'
                  : lastScannedFlash
                  ? 'border-[#2d6a4f] bg-[#d8f3dc]'
                  : 'border-[#d8c2f0] bg-[#f3e8ff]/45 hover:bg-[#f3e8ff]/70'
              }`}
            >
              <ScanBarcode
                className={`w-8 h-8 mx-auto mb-1 ${
                  lastScannedFlash ? 'text-[#2d6a4f]' : 'text-[#9d79d6]'
                }`}
              />
              <p className="text-xs font-extrabold text-[#6d597a]">
                {lastScannedFlash
                  ? `Bip! ${lastScannedFlash} registrado!`
                  : allScanned
                  ? 'Todos os produtos passaram!'
                  : 'Leitor de Código de Barras'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {allScanned
                  ? 'Clique abaixo para concluir o pagamento.'
                  : 'Solte um produto aqui ou clique para bipar o próximo [Espaço]'}
              </p>
              <div
                className={`mt-2.5 h-1 rounded-full mx-auto w-3/4 transition-colors ${
                  lastScannedFlash ? 'bg-[#2d6a4f]' : 'bg-[#ff758f]/70'
                }`}
              />
            </div>

            {/* Cupom Fiscal (Receipt) */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-1.5">
                <span>Cupom · Zene Collection</span>
                <span>{scannedItems.length} itens</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                {scannedItems.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-2">
                    Nenhum produto passado ainda...
                  </p>
                ) : (
                  scannedItems.map((it) => (
                    <div key={it.uid} className="flex justify-between font-semibold text-[#6d597a]">
                      <span>{it.name}</span>
                      <span className="tabular-nums text-[#2d6a4f]">R$ {it.sellPrice}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 font-extrabold text-sm text-[#6d597a]">
                <span>Total da Compra</span>
                <span className="text-base text-[#2d6a4f] tabular-nums">
                  R$ {scannedItems.reduce((s, it) => s + it.sellPrice, 0)} / R$ {totalValue}
                </span>
              </div>
            </div>

            {/* Finish Button */}
            <button
              type="button"
              disabled={!allScanned}
              onClick={() => {
                soundEngine.playCashRegister();
                onComplete(session.npcIndex, items);
              }}
              className="w-full py-3 rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {allScanned
                ? `Finalizar Atendimento (+R$ ${totalValue})`
                : `Faltam ${unscannedItems.length} produto(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
