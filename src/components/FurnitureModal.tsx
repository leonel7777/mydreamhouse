import React, { useState } from 'react';
import { Armchair, X, RotateCw, DollarSign, Move, Eye, MapPin } from 'lucide-react';
import {
  FIXED_FURNITURE_SPOTS,
  FURNITURE_CATALOG,
  FURNITURE_COLORS,
  FurnitureCatalogItem,
  FurnitureLocation,
  FurnitureMaterialType,
  FurnitureRoom,
  OwnedFurnitureItem,
} from '../data/furnitureCatalog';
import { GameState } from '../types/game';

interface FurnitureModalProps {
  isOpen: boolean;
  state: GameState;
  onClose: () => void;
  onBuyFurniture: (
    item: FurnitureCatalogItem,
    color: string,
    materialType: FurnitureMaterialType
  ) => void;
  onStartPlacement: (item: OwnedFurnitureItem) => void;
  onPlaceAtFixedSpot: (
    item: OwnedFurnitureItem,
    position: [number, number, number],
    rotationY: number
  ) => boolean;
  onRemoveFurniture: (instanceId: string) => void;
  onSellFurniture: (instanceId: string) => void;
}

export const FurnitureModal: React.FC<FurnitureModalProps> = ({
  isOpen,
  state,
  onClose,
  onBuyFurniture,
  onStartPlacement,
  onPlaceAtFixedSpot,
  onRemoveFurniture,
  onSellFurniture,
}) => {
  const [mainTab, setMainTab] = useState<'catalog' | 'inventory'>('catalog');
  const [catLocation, setCatLocation] = useState<FurnitureLocation>('shop');
  const [houseRoom, setHouseRoom] = useState<'Todos' | FurnitureRoom>('Todos');
  const [selectedColor, setSelectedColor] = useState<string>(FURNITURE_COLORS[0].hex);
  const [itemColors, setItemColors] = useState<Record<string, string>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<FurnitureMaterialType>('pastel');
  const [fixedPickerId, setFixedPickerId] = useState<string | null>(null);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [lastBoughtInfo, setLastBoughtInfo] = useState<{ name: string; color: string } | null>(null);

  if (!isOpen) return null;

  const owned = state.ownedFurniture ?? [];

  const filteredCatalog = FURNITURE_CATALOG.filter((item) => {
    if (item.location !== catLocation) return false;
    if (catLocation === 'house' && houseRoom !== 'Todos') {
      return item.room === houseRoom;
    }
    return true;
  });

  const isAreaLocked =
    (catLocation === 'garden' && !state.gardenUnlocked) ||
    (catLocation === 'house' && !state.houseUnlocked);

  const getItemChosenColor = (item: FurnitureCatalogItem) =>
    itemColors[item.id] ?? selectedColor ?? item.defaultColor;

  const getColorLabel = (hex: string) =>
    FURNITURE_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex.toUpperCase();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-[#ffc2d1] overflow-hidden flex flex-col max-h-[84vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#fff0f3] border-b border-[#ffc2d1]">
          <div className="flex items-center gap-2.5 text-[#6d597a] font-extrabold text-lg">
            <Armchair className="w-5 h-5 text-[#ff758f]" />
            Móveis & Decoração 3D
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#ff758f] bg-white px-3 py-1 rounded-full border border-[#ffc2d1]">
              R$ {Math.floor(state.money)}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#ffc2d1]/50 text-[#6d597a] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 px-6 pt-3 pb-2 bg-[#fff8fa] border-b border-gray-100">
          <button
            onClick={() => setMainTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
              mainTab === 'catalog'
                ? 'bg-[#ff758f] text-white'
                : 'bg-white text-[#6d597a] border border-gray-200'
            }`}
          >
            Catálogo de Móveis
          </button>
          <button
            onClick={() => setMainTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
              mainTab === 'inventory'
                ? 'bg-[#9d79d6] text-white'
                : 'bg-white text-[#6d597a] border border-gray-200'
            }`}
          >
            Inventário ({owned.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {mainTab === 'catalog' && (
            <>
              {/* Category Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(
                    [
                      { id: 'shop', label: 'Loja' },
                      { id: 'garden', label: 'Jardim' },
                      { id: 'house', label: 'Casa' },
                    ] as { id: FurnitureLocation; label: string }[]
                  ).map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setCatLocation(loc.id)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        catLocation === loc.id
                          ? 'bg-[#d8c2f0] text-[#4a306d]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                {catLocation === 'house' && (
                  <div className="flex flex-wrap gap-1.5">
                    {(['Todos', 'Sala', 'Quarto', 'Cozinha', 'Banheiro'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setHouseRoom(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          houseRoom === r
                            ? 'bg-[#ff758f] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color & Material Customization */}
              <div className="bg-[#f8edeb] p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-[#ffc2d1]/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-[#6d597a] mr-1">Cor padrão:</span>
                  {FURNITURE_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => {
                        setSelectedColor(c.hex);
                        setItemColors({});
                      }}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                        selectedColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-[#ff758f] scale-115 shadow-md'
                          : 'border-white shadow-sm'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <label
                    title="Escolher qualquer cor personalizada"
                    className="ml-1 flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-gray-200 text-[11px] font-bold text-[#6d597a] cursor-pointer"
                  >
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        setItemColors({});
                      }}
                      className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer"
                    />
                    Outra cor
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#6d597a]">Acabamento:</span>
                  {(
                    [
                      { id: 'pastel', label: 'Pastel' },
                      { id: 'wood', label: 'Madeira' },
                      { id: 'glossy', label: 'Brilho' },
                    ] as { id: FurnitureMaterialType; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMaterial(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        selectedMaterial === m.id
                          ? 'bg-[#6d597a] text-white'
                          : 'bg-white text-[#6d597a]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {isAreaLocked && (
                <div className="p-3 rounded-xl bg-[#fff3d6] text-[#7f5539] text-xs font-bold">
                  Área bloqueada! Desbloqueie em Upgrades para posicionar móveis aqui.
                </div>
              )}

              {lastBoughtInfo && (
                <div className="p-3 rounded-xl bg-[#d8f3dc] text-[#2d6a4f] text-xs font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0"
                      style={{ backgroundColor: lastBoughtInfo.color }}
                    />
                    <span>
                      "{lastBoughtInfo.name}" ({getColorLabel(lastBoughtInfo.color)}) comprado e guardado no Inventário!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLastBoughtInfo(null);
                      setMainTab('inventory');
                    }}
                    className="px-3 py-1 rounded-lg bg-[#2d6a4f] text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Posicionar Agora
                  </button>
                </div>
              )}

              {/* Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCatalog.map((item) => {
                  const ownedCount = owned.filter((o) => o.catalogId === item.id).length;
                  const chosenColor = getItemChosenColor(item);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-[#6d597a] text-sm">{item.name}</h4>
                          {ownedCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c1ebd7] text-[#2d6a4f]">
                              {ownedCount}x
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">{item.room}</p>
                        <p className="text-xs font-extrabold text-[#ff758f] mt-1">
                          R$ {item.price}
                        </p>
                      </div>

                      {/* Seletor de cor individual do móvel */}
                      <div className="bg-white rounded-xl p-2 border border-gray-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#6d597a]">Cor do móvel:</span>
                          <span className="flex items-center gap-1 font-semibold text-gray-600">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                              style={{ backgroundColor: chosenColor }}
                            />
                            {getColorLabel(chosenColor)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {FURNITURE_COLORS.slice(0, 10).map((c) => (
                            <button
                              key={`${item.id}_${c.hex}`}
                              type="button"
                              title={c.name}
                              onClick={() =>
                                setItemColors((prev) => ({ ...prev, [item.id]: c.hex }))
                              }
                              className={`w-4 h-4 rounded-full border cursor-pointer ${
                                chosenColor.toLowerCase() === c.hex.toLowerCase()
                                  ? 'border-[#ff758f] scale-115 ring-1 ring-[#ff758f]'
                                  : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                          <label
                            title="Escolher cor livre"
                            className="w-4 h-4 rounded-full border border-dashed border-[#6d597a] flex items-center justify-center text-[9px] font-extrabold text-[#6d597a] cursor-pointer overflow-hidden"
                          >
                            +
                            <input
                              type="color"
                              value={chosenColor}
                              onChange={(e) =>
                                setItemColors((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={state.money < item.price}
                        onClick={() => {
                          onBuyFurniture(item, chosenColor, selectedMaterial);
                          setLastBoughtInfo({ name: item.name, color: chosenColor });
                        }}
                        className="w-full py-2 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] disabled:opacity-40 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-white/80 shrink-0"
                          style={{ backgroundColor: chosenColor }}
                        />
                        Comprar
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {mainTab === 'inventory' && (
            <div className="space-y-3">
              {spotError && (
                <div className="p-3 rounded-xl bg-[#ffe5ec] text-[#9d2a4b] text-xs font-bold">
                  {spotError}
                </div>
              )}
              {owned.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">
                  Você ainda não comprou nenhum móvel. Visite o Catálogo!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {owned.map((item) => {
                    const areaLocked =
                      (item.location === 'garden' && !state.gardenUnlocked) ||
                      (item.location === 'house' && !state.houseUnlocked);
                    const spots = FIXED_FURNITURE_SPOTS.filter(
                      (s) => s.location === item.location
                    );
                    const isPickerOpen = fixedPickerId === item.instanceId;

                    return (
                      <div
                        key={item.instanceId}
                        className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.color }}
                              />
                              <h4 className="font-bold text-[#6d597a] text-sm">{item.name}</h4>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {item.room} · {item.placed ? 'Posicionado no 3D' : 'No inventário'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={areaLocked}
                              onClick={() => {
                                setSpotError(null);
                                onStartPlacement(item);
                                onClose();
                              }}
                              title={areaLocked ? 'Área bloqueada' : item.placed ? 'Mover livremente' : 'Colocar livremente no 3D'}
                              className="p-2 rounded-xl bg-[#9d79d6] hover:bg-[#8660c4] disabled:opacity-40 text-white cursor-pointer"
                            >
                              {item.placed ? <Move className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              disabled={areaLocked}
                              onClick={() => {
                                setSpotError(null);
                                setFixedPickerId(isPickerOpen ? null : item.instanceId);
                              }}
                              title={areaLocked ? 'Área bloqueada' : 'Colocar em lugar fixo'}
                              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                                isPickerOpen
                                  ? 'bg-[#ff758f] text-white'
                                  : 'bg-[#e0f2fe] hover:bg-[#bde0fe] text-[#1d4e89]'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              Lugar Fixo
                            </button>
                            {item.placed && (
                              <button
                                onClick={() => onRemoveFurniture(item.instanceId)}
                                title="Guardar no inventário"
                                className="p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-[#6d597a] cursor-pointer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onSellFurniture(item.instanceId)}
                              title={`Vender por R$ ${Math.round(item.price * 0.7)}`}
                              className="p-2 rounded-xl bg-[#ffe5ec] hover:bg-[#ffc2d1] text-[#9d2a4b] cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {areaLocked && (
                          <p className="text-[11px] font-bold text-[#9d2a4b]">
                            Desbloqueie {item.location === 'house' ? 'a Casa' : 'o Jardim'} em Upgrades para posicionar.
                          </p>
                        )}

                        {isPickerOpen && !areaLocked && (
                          <div className="pt-2 border-t border-gray-200 space-y-1.5">
                            <p className="text-[11px] font-bold text-[#6d597a]">
                              Escolha um lugar fixo:
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {spots.map((spot) => {
                                const occupied = owned.some(
                                  (o) =>
                                    o.placed &&
                                    o.instanceId !== item.instanceId &&
                                    Math.hypot(
                                      o.position[0] - spot.position[0],
                                      o.position[2] - spot.position[2]
                                    ) < 0.85
                                );
                                return (
                                  <button
                                    key={spot.id}
                                    disabled={occupied}
                                    onClick={() => {
                                      const ok = onPlaceAtFixedSpot(
                                        item,
                                        spot.position,
                                        spot.rotationY
                                      );
                                      if (ok) {
                                        setFixedPickerId(null);
                                        setSpotError(null);
                                        onClose();
                                      } else {
                                        setSpotError('Não foi possível posicionar neste lugar fixo.');
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl border border-[#bde0fe] bg-white hover:bg-[#e0f2fe] disabled:opacity-45 disabled:bg-gray-100 text-left text-[11px] font-bold text-[#4a306d] cursor-pointer"
                                  >
                                    {spot.label} {occupied ? '(Ocupado)' : ''}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
