import React, { useState } from 'react';
import { X, Check, ShoppingBag, Palette, Sparkles, Users, TrendingUp } from 'lucide-react';
import { BUILDING_COLORS, GameState, PASTEL_PALETTE } from '../types/game';
import { ActiveModal } from './HUD';

interface ModalsProps {
  activeModal: ActiveModal;
  state: GameState;
  onClose: () => void;
  onBuyStock: (productId: string, qty: number) => void;
  onBuyDecoration: (decId: string, color: string) => void;
  onToggleDecoration: (decId: string) => void;
  onBuyUpgrade: (upgradeId: string) => void;
  onHireEmployee: (empId: string) => void;
  onFireEmployee: (empId: string) => void;
  onChangeBuildingColor: (target: 'shop' | 'house', color: string) => void;
  onBuyOrEquipFacade: (facadeId: string) => void;
  onCreateCustomFacade: (name: string, awningColor: string, roofColor: string) => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  state,
  onClose,
  onBuyStock,
  onBuyDecoration,
  onToggleDecoration,
  onBuyUpgrade,
  onHireEmployee,
  onFireEmployee,
  onChangeBuildingColor,
  onBuyOrEquipFacade,
  onCreateCustomFacade,
  onUpdateProductPrice,
}) => {
  const [selectedColor, setSelectedColor] = useState(PASTEL_PALETTE[0].hex);
  const [upgradeTab, setUpgradeTab] = useState<'shop' | 'house' | 'garden'>('shop');
  const [customFacadeName, setCustomFacadeName] = useState('');
  const [customAwningColor, setCustomAwningColor] = useState('#ff758f');
  const [customRoofColor, setCustomRoofColor] = useState('#ffc2d1');

  if (!activeModal) return null;

  const totalStock = state.products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-[#ffc2d1] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#fff0f3] border-b border-[#ffc2d1]">
          <div className="flex items-center gap-2.5 text-[#6d597a] font-extrabold text-lg">
            {activeModal === 'shop_stock' && <><ShoppingBag className="w-5 h-5 text-[#ff758f]" /> Estoque & Produtos</>}
            {activeModal === 'decor' && <><Palette className="w-5 h-5 text-[#9d79d6]" /> Loja de Decoração</>}
            {activeModal === 'upgrades' && <><Sparkles className="w-5 h-5 text-[#457b9d]" /> Upgrades & Expansões</>}
            {activeModal === 'employees' && <><Users className="w-5 h-5 text-[#2d6a4f]" /> Funcionárias</>}
            {activeModal === 'history' && <><TrendingUp className="w-5 h-5 text-[#b56576]" /> Histórico de Ganhos</>}
          </div>
          <div className="flex items-center gap-4">
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeModal === 'shop_stock' && (
            <>
              <div className="text-xs font-semibold text-[#6d597a] bg-[#f8edeb] px-4 py-2.5 rounded-xl flex justify-between">
                <span>Capacidade do Estoque: {totalStock} / {state.inventoryCapacity}</span>
                <span>Compre produtos para as clientes comprarem na loja!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state.products.map((prod) => {
                  const profit = prod.sellPrice - prod.costPrice;
                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block border border-gray-300"
                              style={{ backgroundColor: prod.color }}
                            />
                            <h4 className="font-bold text-[#6d597a] text-sm">{prod.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Custo: R$ {prod.costPrice} ·{' '}
                            <span className={profit >= 0 ? 'text-[#2d6a4f] font-semibold' : 'text-[#d62828] font-semibold'}>
                              Lucro: {profit >= 0 ? `+R$ ${profit}` : `-R$ ${Math.abs(profit)}`}
                            </span>
                          </p>
                          <p className="text-xs font-bold text-[#b56576] mt-0.5">
                            Em estoque: {prod.stock}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={state.money < prod.costPrice || totalStock >= state.inventoryCapacity}
                            onClick={() => onBuyStock(prod.id, 1)}
                            className="px-3 py-1.5 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                          >
                            +1 (R$ {prod.costPrice})
                          </button>
                          <button
                            type="button"
                            disabled={state.money < prod.costPrice * 5 || totalStock + 5 > state.inventoryCapacity}
                            onClick={() => onBuyStock(prod.id, 5)}
                            className="px-3 py-1.5 rounded-xl bg-[#d8c2f0] hover:bg-[#c3a6e8] disabled:opacity-40 text-[#4a306d] text-xs font-bold cursor-pointer"
                          >
                            +5 (R$ {prod.costPrice * 5})
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/80">
                        <span className="text-xs font-bold text-[#6d597a]">Preço de venda:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateProductPrice(prod.id, prod.sellPrice - 5)}
                            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#6d597a] text-xs font-bold cursor-pointer"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateProductPrice(prod.id, prod.sellPrice - 1)}
                            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#6d597a] text-xs font-bold cursor-pointer"
                          >
                            -1
                          </button>
                          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-0.5">
                            <span className="text-xs font-bold text-[#2d6a4f] mr-1">R$</span>
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={prod.sellPrice}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                if (!Number.isNaN(parsed)) {
                                  onUpdateProductPrice(prod.id, parsed);
                                }
                              }}
                              className="w-12 text-xs font-extrabold text-[#2d6a4f] tabular-nums focus:outline-none text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateProductPrice(prod.id, prod.sellPrice + 1)}
                            className="px-2 py-1 rounded-lg bg-[#c1ebd7] hover:bg-[#a6dfc4] text-[#2d6a4f] text-xs font-bold cursor-pointer"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateProductPrice(prod.id, prod.sellPrice + 5)}
                            className="px-2 py-1 rounded-lg bg-[#c1ebd7] hover:bg-[#a6dfc4] text-[#2d6a4f] text-xs font-bold cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeModal === 'decor' && (
            <>
              <div className="bg-[#fff0f3] p-4 rounded-2xl border border-[#ffc2d1] space-y-3">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-[#6d597a]">
                  Personalizar Cores das Construções (12 Cores)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-semibold text-[#6d597a] mb-1.5">
                      Paredes da Loja:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BUILDING_COLORS.map((c) => (
                        <button
                          key={`shop_${c.hex}`}
                          title={c.name}
                          onClick={() => onChangeBuildingColor('shop', c.hex)}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                            state.shopWallColor === c.hex
                              ? 'border-[#ff758f] scale-110'
                              : 'border-white shadow-sm'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#6d597a] mb-1.5">
                      Paredes da Casa:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BUILDING_COLORS.map((c) => (
                        <button
                          key={`house_${c.hex}`}
                          title={c.name}
                          onClick={() => onChangeBuildingColor('house', c.hex)}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                            state.houseWallColor === c.hex
                              ? 'border-[#9d79d6] scale-110'
                              : 'border-white shadow-sm'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8edeb] p-3.5 rounded-2xl">
                <span className="block text-xs font-bold text-[#6d597a] mb-2">
                  Escolha a cor pastel antes de comprar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PASTEL_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c.hex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                        selectedColor === c.hex
                          ? 'border-[#ff758f] bg-white shadow-sm'
                          : 'border-gray-200 bg-white/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-gray-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state.decorations.map((dec) => {
                  const locked =
                    (dec.location === 'garden' && !state.gardenUnlocked) ||
                    (dec.location === 'house' && !state.houseUnlocked);

                  return (
                    <div
                      key={dec.id}
                      className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-bold text-[#6d597a] text-sm">{dec.name}</h4>
                        <p className="text-xs text-gray-500">
                          {dec.category} · {dec.location === 'shop' ? 'Loja' : dec.location === 'garden' ? 'Jardim' : 'Casa'}
                        </p>
                        {!dec.owned && (
                          <p className="text-xs font-bold text-[#ff758f] mt-1">R$ {dec.price}</p>
                        )}
                      </div>

                      {locked ? (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                          Área Bloqueada
                        </span>
                      ) : dec.owned ? (
                        <button
                          onClick={() => onToggleDecoration(dec.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            dec.placed
                              ? 'bg-[#c1ebd7] text-[#2d6a4f]'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {dec.placed ? 'Colocado ✓' : 'Colocar'}
                        </button>
                      ) : (
                        <button
                          disabled={state.money < dec.price}
                          onClick={() => onBuyDecoration(dec.id, selectedColor)}
                          className="px-4 py-2 rounded-xl bg-[#9d79d6] hover:bg-[#8660c4] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                        >
                          Comprar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeModal === 'upgrades' && (
            <div className="space-y-4">
              {/* Topic Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                <button
                  onClick={() => setUpgradeTab('shop')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                    upgradeTab === 'shop'
                      ? 'bg-[#ff758f] text-white shadow-sm'
                      : 'bg-gray-100 text-[#6d597a] hover:bg-gray-200'
                  }`}
                >
                  Loja
                </button>
                <button
                  onClick={() => setUpgradeTab('house')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                    upgradeTab === 'house'
                      ? 'bg-[#9d79d6] text-white shadow-sm'
                      : 'bg-gray-100 text-[#6d597a] hover:bg-gray-200'
                  }`}
                >
                  Casa da Elizene
                </button>
                <button
                  onClick={() => setUpgradeTab('garden')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                    upgradeTab === 'garden'
                      ? 'bg-[#2d6a4f] text-white shadow-sm'
                      : 'bg-gray-100 text-[#6d597a] hover:bg-gray-200'
                  }`}
                >
                  Jardim Encantador
                </button>
              </div>

              {upgradeTab === 'shop' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6d597a]">
                      Evolução da Loja
                    </h3>
                    {state.upgrades
                      .filter((u) => u.type !== 'garden' && u.type !== 'house')
                      .map((upg) => {
                        const maxed = upg.level >= upg.maxLevel;
                        return (
                          <div
                            key={upg.id}
                            className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#6d597a]">{upg.name}</h4>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#1d4e89]">
                                  Nível {upg.level}/{upg.maxLevel}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{upg.description}</p>
                            </div>
                            {maxed ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-[#2d6a4f] bg-[#c1ebd7] px-3.5 py-2 rounded-xl">
                                <Check className="w-4 h-4" /> Completo
                              </span>
                            ) : (
                              <button
                                disabled={state.money < upg.price}
                                onClick={() => onBuyUpgrade(upg.id)}
                                className="px-4 py-2.5 rounded-xl bg-[#457b9d] hover:bg-[#35627e] disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                              >
                                R$ {upg.price}
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6d597a]">
                        Fachadas da Loja
                      </h3>
                      <span className="text-[11px] font-bold text-[#b56576] bg-[#ffe5ec] px-2.5 py-0.5 rounded-full">
                        Crie ou Compre
                      </span>
                    </div>

                    {/* Criar Nova Fachada Personalizada */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ffe5ec]/70 via-[#f8edeb]/60 to-[#f3e8ff]/70 border-2 border-[#ffc2d1] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#6d597a]">
                          🎨 Criar Minha Própria Fachada (R$ 250)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                            title="Cor do Toldo"
                            style={{ backgroundColor: customAwningColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                            title="Cor do Telhado"
                            style={{ backgroundColor: customRoofColor }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold text-[#6d597a] mb-1">
                            Nome da Fachada:
                          </label>
                          <input
                            type="text"
                            value={customFacadeName}
                            onChange={(e) => setCustomFacadeName(e.target.value)}
                            placeholder="Ex: Doce Sonho..."
                            className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 text-[#6d597a] focus:outline-none focus:border-[#ff758f]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6d597a] mb-1">
                            Cor do Toldo:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {PASTEL_PALETTE.map((c) => (
                              <button
                                key={`c_awn_${c.hex}`}
                                type="button"
                                title={c.name}
                                onClick={() => setCustomAwningColor(c.hex)}
                                className={`w-5 h-5 rounded-full border cursor-pointer ${
                                  customAwningColor === c.hex
                                    ? 'border-[#ff758f] scale-110'
                                    : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#6d597a] mb-1">
                            Cor do Telhado:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {PASTEL_PALETTE.map((c) => (
                              <button
                                key={`c_roof_${c.hex}`}
                                type="button"
                                title={c.name}
                                onClick={() => setCustomRoofColor(c.hex)}
                                className={`w-5 h-5 rounded-full border cursor-pointer ${
                                  customRoofColor === c.hex
                                    ? 'border-[#ff758f] scale-110'
                                    : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          disabled={state.money < 250}
                          onClick={() => {
                            onCreateCustomFacade(
                              customFacadeName || 'Minha Fachada',
                              customAwningColor,
                              customRoofColor
                            );
                            setCustomFacadeName('');
                          }}
                          className="px-5 py-2 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] disabled:opacity-40 text-white font-extrabold text-xs shadow-md cursor-pointer transition-transform active:scale-95"
                        >
                          Criar & Equipar Fachada (R$ 250)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(state.facades ?? []).map((fac) => (
                        <div
                          key={fac.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: fac.awningColor }}
                              />
                              <h4 className="font-bold text-[#6d597a] text-sm">{fac.name}</h4>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{fac.description}</p>
                          </div>
                          {fac.equipped ? (
                            <span className="text-xs font-bold text-[#2d6a4f] bg-[#c1ebd7] px-3 py-1.5 rounded-xl shrink-0">
                              Em Uso ✓
                            </span>
                          ) : fac.owned ? (
                            <button
                              onClick={() => onBuyOrEquipFacade(fac.id)}
                              className="px-3.5 py-2 rounded-xl bg-[#9d79d6] hover:bg-[#8660c4] text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              Equipar
                            </button>
                          ) : (
                            <button
                              disabled={state.money < fac.price}
                              onClick={() => onBuyOrEquipFacade(fac.id)}
                              className="px-3.5 py-2 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              R$ {fac.price}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {upgradeTab === 'house' && (
                <div className="space-y-4">
                  {state.upgrades
                    .filter((u) => u.type === 'house')
                    .map((upg) => {
                      const maxed = upg.level >= upg.maxLevel;
                      return (
                        <div
                          key={upg.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-[#f3e8ff]/40 flex items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-[#6d597a]">{upg.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{upg.description}</p>
                          </div>
                          {maxed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-[#2d6a4f] bg-[#c1ebd7] px-3.5 py-2 rounded-xl">
                              <Check className="w-4 h-4" /> Desbloqueada
                            </span>
                          ) : (
                            <button
                              disabled={state.money < upg.price}
                              onClick={() => onBuyUpgrade(upg.id)}
                              className="px-4 py-2.5 rounded-xl bg-[#9d79d6] hover:bg-[#8660c4] disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              R$ {upg.price}
                            </button>
                          )}
                        </div>
                      );
                    })}

                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6d597a] pt-2">
                    Móveis & Itens da Casa
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.decorations
                      .filter((d) => d.location === 'house')
                      .map((dec) => (
                        <div
                          key={dec.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-bold text-[#6d597a] text-sm">{dec.name}</h4>
                            {!dec.owned && (
                              <p className="text-xs font-bold text-[#9d79d6] mt-1">R$ {dec.price}</p>
                            )}
                          </div>
                          {!state.houseUnlocked ? (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                              Compre a Casa
                            </span>
                          ) : dec.owned ? (
                            <button
                              onClick={() => onToggleDecoration(dec.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                                dec.placed ? 'bg-[#c1ebd7] text-[#2d6a4f]' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {dec.placed ? 'Colocado ✓' : 'Colocar'}
                            </button>
                          ) : (
                            <button
                              disabled={state.money < dec.price}
                              onClick={() => onBuyDecoration(dec.id, selectedColor)}
                              className="px-4 py-2 rounded-xl bg-[#9d79d6] hover:bg-[#8660c4] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                            >
                              Comprar
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {upgradeTab === 'garden' && (
                <div className="space-y-4">
                  {state.upgrades
                    .filter((u) => u.type === 'garden')
                    .map((upg) => {
                      const maxed = upg.level >= upg.maxLevel;
                      return (
                        <div
                          key={upg.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-[#d8f3dc]/40 flex items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-[#6d597a]">{upg.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{upg.description}</p>
                          </div>
                          {maxed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-[#2d6a4f] bg-[#c1ebd7] px-3.5 py-2 rounded-xl">
                              <Check className="w-4 h-4" /> Desbloqueado
                            </span>
                          ) : (
                            <button
                              disabled={state.money < upg.price}
                              onClick={() => onBuyUpgrade(upg.id)}
                              className="px-4 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              R$ {upg.price}
                            </button>
                          )}
                        </div>
                      );
                    })}

                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6d597a] pt-2">
                    Itens do Jardim Encantador
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.decorations
                      .filter((d) => d.location === 'garden')
                      .map((dec) => (
                        <div
                          key={dec.id}
                          className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-bold text-[#6d597a] text-sm">{dec.name}</h4>
                            {!dec.owned && (
                              <p className="text-xs font-bold text-[#2d6a4f] mt-1">R$ {dec.price}</p>
                            )}
                          </div>
                          {!state.gardenUnlocked ? (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
                              Desbloqueie o Jardim
                            </span>
                          ) : dec.owned ? (
                            <button
                              onClick={() => onToggleDecoration(dec.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                                dec.placed ? 'bg-[#c1ebd7] text-[#2d6a4f]' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {dec.placed ? 'Colocado ✓' : 'Colocar'}
                            </button>
                          ) : (
                            <button
                              disabled={state.money < dec.price}
                              onClick={() => onBuyDecoration(dec.id, selectedColor)}
                              className="px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                            >
                              Comprar
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeModal === 'employees' && (
            <div className="space-y-3">
              {state.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#6d597a]">{emp.name}</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#2d6a4f]">
                        {emp.roleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{emp.description}</p>
                    <p className="text-xs font-semibold text-[#6d597a] mt-1">
                      Salário diário: R$ {emp.dailySalary}
                    </p>
                  </div>
                  {emp.hired ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs font-bold text-[#2d6a4f] bg-[#c1ebd7] px-3 py-2 rounded-xl">
                        <Check className="w-4 h-4" /> Contratada
                      </span>
                      <button
                        onClick={() => onFireEmployee(emp.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#e63946] hover:bg-[#c1121f] text-white text-xs font-bold cursor-pointer"
                      >
                        Demitir
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={state.money < emp.hireCost}
                      onClick={() => onHireEmployee(emp.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Contratar (R$ {emp.hireCost})
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeModal === 'history' && (
            <div className="space-y-2">
              {state.earningsHistory.slice(0, 25).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-400 mr-2">
                      Dia {entry.day} · {entry.time}
                    </span>
                    <span className="font-semibold text-[#6d597a]">{entry.description}</span>
                  </div>
                  <span
                    className={`font-extrabold tabular-nums ${
                      entry.amount >= 0 ? 'text-[#2d6a4f]' : 'text-[#d62828]'
                    }`}
                  >
                    {entry.amount >= 0 ? `+R$ ${entry.amount}` : `-R$ ${Math.abs(entry.amount)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
