import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckoutItem,
  CheckoutSession,
  createInitialGameState,
  ElizeneCustomization,
  FacadeItem,
  GamePhase,
  GameState,
  INITIAL_EMPLOYEES,
  INITIAL_UPGRADES,
  WeatherType,
} from './types/game';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreator } from './components/CharacterCreator';
import { ActiveModal, formatTime, HUD } from './components/HUD';
import { Modals } from './components/Modals';
import { FurnitureModal } from './components/FurnitureModal';
import { CheckoutMinigameModal } from './components/CheckoutMinigameModal';
import {
  FIXED_FURNITURE_SPOTS,
  FurnitureCatalogItem,
  FurnitureMaterialType,
  OwnedFurnitureItem,
} from './data/furnitureCatalog';
import { soundEngine } from './audio/soundEngine';

const SAVE_KEY = 'elizene_tycoon_save_v1';

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    const existingIds = new Set((parsed.employees ?? []).map((e) => e.id));
    const missingEmployees = INITIAL_EMPLOYEES.filter((e) => !existingIds.has(e.id)).map((e) => ({
      ...e,
    }));
    const syncedEmployees = (parsed.employees ?? []).map((emp) => {
      const def = INITIAL_EMPLOYEES.find((d) => d.id === emp.id);
      if (!def) return emp;
      return {
        ...emp,
        hireCost: emp.hired ? emp.hireCost : def.hireCost,
        dailySalary: def.dailySalary,
      };
    });

    const existingUpgradeIds = new Set((parsed.upgrades ?? []).map((u) => u.id));
    const missingUpgrades = INITIAL_UPGRADES.filter((u) => !existingUpgradeIds.has(u.id)).map(
      (u) => ({ ...u })
    );
    const normalizedUpgrades = [...(parsed.upgrades ?? []), ...missingUpgrades].map((u) =>
      (u.id === 'upg_garden' || u.id === 'upg_house') && u.level === 0
        ? { ...u, price: 4000 }
        : u
    );
    return {
      ...parsed,
      weaponLevel: parsed.weaponLevel ?? 0,
      employees: [...syncedEmployees, ...missingEmployees],
      upgrades: normalizedUpgrades,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const saved = loadSavedState();
  const [phase, setPhase] = useState<GamePhase>('title');
  const [gameState, setGameState] = useState<GameState>(
    () => saved ?? createInitialGameState()
  );
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [placingItem, setPlacingItem] = useState<OwnedFurnitureItem | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');
  const [placementStatus, setPlacementStatus] = useState<{
    valid: boolean;
    lockedToSpot: boolean;
    reason: string | null;
  }>({ valid: true, lockedToSpot: false, reason: null });
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [dailySummary, setDailySummary] = useState<{
    day: number;
    income: number;
    expenses: number;
    profit: number;
  } | null>(null);
  const [muted, setMuted] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const stateRef = useRef<GameState>(gameState);
  const alertTimerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = gameState;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch {
      // ignore quota errors
    }
    engineRef.current?.syncWorldState();
  }, [gameState]);

  const handleSale = useCallback((productId: string, amount: number) => {
    setGameState((prev) => {
      const prod = prev.products.find((p) => p.id === productId);
      if (!prod || prod.stock <= 0) return prev;
      const nextProducts = prev.products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock - 1 } : p
      );
      const entry = {
        id: `sale_${Date.now()}_${Math.random()}`,
        day: prev.day,
        time: formatTime(prev.timeMinutes),
        description: `Venda: ${prod.name}`,
        amount,
      };
      return {
        ...prev,
        money: prev.money + amount,
        totalSalesCount: prev.totalSalesCount + 1,
        products: nextProducts,
        earningsHistory: [entry, ...prev.earningsHistory].slice(0, 50),
      };
    });
    engineRef.current?.syncWorldState();
  }, []);

  const showInfoAlert = useCallback((msg: string) => {
    setInfoMessage(msg);
    if (alertTimerRef.current !== null) {
      window.clearTimeout(alertTimerRef.current);
    }
    alertTimerRef.current = window.setTimeout(() => {
      setInfoMessage(null);
    }, 5500);
  }, []);

  const handleTheftItem = useCallback((productId: string, productName: string) => {
    setGameState((prev) => {
      const prod = prev.products.find((p) => p.id === productId);
      if (!prod || prod.stock <= 0) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
        ),
        earningsHistory: [
          {
            id: `theft_${Date.now()}_${Math.random()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Furto na loja: ${productName}`,
            amount: 0,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
  }, []);

  const handleCatchThief = useCallback((rewardAmount: number, stolenCount: number) => {
    setGameState((prev) => ({
      ...prev,
      money: prev.money + rewardAmount,
      earningsHistory: [
        {
          id: `catch_${Date.now()}`,
          day: prev.day,
          time: formatTime(prev.timeMinutes),
          description:
            stolenCount > 0
              ? `Dinheiro recuperado da ladra (${stolenCount} itens)`
              : 'Dinheiro apreendido da ladra',
          amount: rewardAmount,
        },
        ...prev.earningsHistory,
      ].slice(0, 50),
    }));
  }, []);

  const handleRestoreStolenItems = useCallback((productIds: string[]) => {
    if (!productIds || productIds.length === 0) return;
    setGameState((prev) => {
      const counts = new Map<string, number>();
      for (const id of productIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      const nextProducts = prev.products.map((p) => {
        const add = counts.get(p.id) ?? 0;
        return add > 0 ? { ...p, stock: p.stock + add } : p;
      });
      return {
        ...prev,
        products: nextProducts,
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  }, []);

  const handleTimeTick = useCallback((newTimeMinutes: number, newDay: boolean) => {
    setGameState((prev) => {
      const shopOpen = newTimeMinutes >= 480 && newTimeMinutes < 1140; // 08:00 - 19:00
      if (!newDay) {
        if (
          Math.floor(prev.timeMinutes) === Math.floor(newTimeMinutes) &&
          prev.shopOpen === shopOpen
        ) {
          return prev;
        }
        return { ...prev, timeMinutes: newTimeMinutes, shopOpen };
      }

      // New Day: pay hired employee salaries & compute daily summary
      const totalSalaries = prev.employees
        .filter((e) => e.hired)
        .reduce((sum, e) => sum + e.dailySalary, 0);

      const dayEntries = prev.earningsHistory.filter((e) => e.day === prev.day);
      const dayIncome = dayEntries
        .filter((e) => e.amount > 0)
        .reduce((s, e) => s + e.amount, 0);
      const dayExpenses =
        dayEntries
          .filter((e) => e.amount < 0)
          .reduce((s, e) => s + Math.abs(e.amount), 0) + totalSalaries;

      setCheckoutSession(null);

      setDailySummary({
        day: prev.day,
        income: dayIncome,
        expenses: dayExpenses,
        profit: dayIncome - dayExpenses,
      });

      const nextHistory = [...prev.earningsHistory];
      if (totalSalaries > 0) {
        nextHistory.unshift({
          id: `sal_${Date.now()}`,
          day: prev.day + 1,
          time: '08:00',
          description: 'Salário das funcionárias',
          amount: -totalSalaries,
        });
      }

      return {
        ...prev,
        day: prev.day + 1,
        timeMinutes: 480,
        shopOpen: true,
        money: Math.max(0, prev.money - totalSalaries),
        earningsHistory: nextHistory.slice(0, 50),
      };
    });
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const container = canvasContainerRef.current;
    if (!container) return;

    const engine = new GameEngine(container, () => stateRef.current, {
      onSale: handleSale,
      onTimeTick: handleTimeTick,
      onInteractPrompt: setInteractPrompt,
      onInteractAction: (action) => {
        if (action === 'shop_stock') setActiveModal('shop_stock');
        else if (action === 'upgrades') setActiveModal('upgrades');
      },
      onPlaceFurniture: (instanceId, pos, rotY) => {
        setGameState((prev) => ({
          ...prev,
          ownedFurniture: (prev.ownedFurniture ?? []).map((f) =>
            f.instanceId === instanceId
              ? { ...f, placed: true, position: pos, rotationY: rotY }
              : f
          ),
        }));
        setPlacingItem(null);
        setSelectedSpotId('');
      },
      onCancelPlacement: () => {
        setPlacingItem(null);
        setSelectedSpotId('');
      },
      onPlacementStatus: setPlacementStatus,
      onWeatherChange: setWeather,
      onTheftItem: handleTheftItem,
      onRestoreStolenItems: handleRestoreStolenItems,
      onCatchThief: handleCatchThief,
      onStartCheckoutMinigame: (session) => setCheckoutSession(session),
      onAlert: showInfoAlert,
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [phase, handleSale, handleTimeTick, handleTheftItem, handleRestoreStolenItems, handleCatchThief, showInfoAlert]);

  useEffect(() => {
    engineRef.current?.setInputPaused(Boolean(activeModal || checkoutSession || dailySummary));
  }, [activeModal, checkoutSession, dailySummary]);

  const handleStartNew = () => {
    soundEngine.playClick();
    setGameState(createInitialGameState());
    setPhase('customize');
  };

  const handleContinue = () => {
    soundEngine.playClick();
    setPhase('playing');
  };

  const handleCustomizationChange = (next: ElizeneCustomization) => {
    setGameState((prev) => ({ ...prev, customization: next }));
    engineRef.current?.updateCustomization(next);
  };

  const handleBuyStock = (productId: string, qty: number) => {
    const current = stateRef.current;
    const prodSnapshot = current.products.find((p) => p.id === productId);
    if (!prodSnapshot) return;
    const expectedCost = prodSnapshot.costPrice * qty;
    const currentTotalStock = current.products.reduce((a, p) => a + p.stock, 0);
    const canAffordAndFit =
      current.money >= expectedCost && currentTotalStock + qty <= current.inventoryCapacity;

    setGameState((prev) => {
      const prod = prev.products.find((p) => p.id === productId);
      if (!prod) return prev;
      const cost = prod.costPrice * qty;
      const totalStock = prev.products.reduce((a, p) => a + p.stock, 0);
      if (prev.money < cost || totalStock + qty > prev.inventoryCapacity) return prev;

      soundEngine.playPurchase();
      return {
        ...prev,
        money: prev.money - cost,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, stock: p.stock + qty } : p
        ),
        earningsHistory: [
          {
            id: `stk_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Estoque: +${qty}x ${prod.name}`,
            amount: -cost,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });

    if (canAffordAndFit) {
      engineRef.current?.triggerDeliveryTruck(prodSnapshot.name, qty);
    }
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    const clamped = Math.max(1, Math.min(999, Math.round(newPrice)));
    soundEngine.playClick();
    setGameState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, sellPrice: clamped } : p
      ),
    }));
  };

  const handleBuyDecoration = (decId: string, color: string) => {
    setGameState((prev) => {
      const dec = prev.decorations.find((d) => d.id === decId);
      if (!dec || dec.owned || prev.money < dec.price) return prev;
      soundEngine.playPurchase();
      return {
        ...prev,
        money: prev.money - dec.price,
        decorations: prev.decorations.map((d) =>
          d.id === decId ? { ...d, owned: true, placed: true, color } : d
        ),
        earningsHistory: [
          {
            id: `dec_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Decoração: ${dec.name}`,
            amount: -dec.price,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleToggleDecoration = (decId: string) => {
    soundEngine.playClick();
    setGameState((prev) => ({
      ...prev,
      decorations: prev.decorations.map((d) =>
        d.id === decId ? { ...d, placed: !d.placed } : d
      ),
    }));
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleBuyUpgrade = (upgradeId: string) => {
    setGameState((prev) => {
      const upg = prev.upgrades.find((u) => u.id === upgradeId);
      if (!upg || upg.level >= upg.maxLevel || prev.money < upg.price) return prev;
      soundEngine.playPurchase();

      let inventoryCapacity = prev.inventoryCapacity;
      let maxShelves = prev.maxShelves;
      let cashierSpeedLevel = prev.cashierSpeedLevel;
      let weaponLevel = prev.weaponLevel ?? 0;
      let gardenUnlocked = prev.gardenUnlocked;
      let houseUnlocked = prev.houseUnlocked;

      if (upg.type === 'inventory') inventoryCapacity += 25;
      if (upg.type === 'shelves') maxShelves += 1;
      if (upg.type === 'cashier') cashierSpeedLevel += 1;
      if (upg.type === 'weapon') weaponLevel = Math.min(upg.maxLevel, weaponLevel + 1);
      if (upg.type === 'garden') gardenUnlocked = true;
      if (upg.type === 'house') houseUnlocked = true;

      return {
        ...prev,
        money: prev.money - upg.price,
        inventoryCapacity,
        maxShelves,
        cashierSpeedLevel,
        weaponLevel,
        gardenUnlocked,
        houseUnlocked,
        upgrades: prev.upgrades.map((u) =>
          u.id === upgradeId
            ? { ...u, level: u.level + 1, price: Math.round(u.price * 1.45) }
            : u
        ),
        earningsHistory: [
          {
            id: `upg_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Upgrade: ${upg.name}`,
            amount: -upg.price,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleHireEmployee = (empId: string) => {
    setGameState((prev) => {
      const emp = prev.employees.find((e) => e.id === empId);
      if (!emp || emp.hired || prev.money < emp.hireCost) return prev;
      soundEngine.playPurchase();
      return {
        ...prev,
        money: prev.money - emp.hireCost,
        employees: prev.employees.map((e) =>
          e.id === empId ? { ...e, hired: true } : e
        ),
        earningsHistory: [
          {
            id: `emp_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Contratação: ${emp.name} (${emp.roleLabel})`,
            amount: -emp.hireCost,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleFireEmployee = (empId: string) => {
    const targetEmp = stateRef.current.employees.find((e) => e.id === empId);
    if (!targetEmp || !targetEmp.hired) return;
    soundEngine.playClick();
    setGameState((prev) => {
      const emp = prev.employees.find((e) => e.id === empId);
      if (!emp || !emp.hired) return prev;
      return {
        ...prev,
        employees: prev.employees.map((e) =>
          e.id === empId ? { ...e, hired: false } : e
        ),
        earningsHistory: [
          {
            id: `fire_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Demissão: ${emp.name} (${emp.roleLabel})`,
            amount: 0,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    showInfoAlert(`${targetEmp.name} (${targetEmp.roleLabel}) foi demitida.`);
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleChangeBuildingColor = (target: 'shop' | 'house', color: string) => {
    soundEngine.playClick();
    setGameState((prev) => ({
      ...prev,
      shopWallColor: target === 'shop' ? color : prev.shopWallColor,
      houseWallColor: target === 'house' ? color : prev.houseWallColor,
    }));
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleBuyOrEquipFacade = (facadeId: string) => {
    setGameState((prev) => {
      const facades = prev.facades ?? [];
      const fac = facades.find((f) => f.id === facadeId);
      if (!fac) return prev;

      if (fac.owned) {
        soundEngine.playClick();
        return {
          ...prev,
          facades: facades.map((f) => ({ ...f, equipped: f.id === facadeId })),
        };
      }

      if (prev.money < fac.price) return prev;
      soundEngine.playPurchase();
      return {
        ...prev,
        money: prev.money - fac.price,
        facades: facades.map((f) =>
          f.id === facadeId
            ? { ...f, owned: true, equipped: true }
            : { ...f, equipped: false }
        ),
        earningsHistory: [
          {
            id: `fac_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Fachada: ${fac.name}`,
            amount: -fac.price,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleCreateCustomFacade = (name: string, awningColor: string, roofColor: string) => {
    const cost = 250;
    setGameState((prev) => {
      if (prev.money < cost) return prev;
      soundEngine.playPurchase();
      const newFacade: FacadeItem = {
        id: `fac_custom_${Date.now()}`,
        name: name.trim() || 'Minha Fachada',
        description: 'Fachada personalizada feita sob medida.',
        price: cost,
        owned: true,
        equipped: true,
        awningColor,
        roofColor,
      };
      const facades = (prev.facades ?? []).map((f) => ({ ...f, equipped: false }));
      return {
        ...prev,
        money: prev.money - cost,
        facades: [newFacade, ...facades],
        earningsHistory: [
          {
            id: `fac_custom_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Criação de Fachada: ${newFacade.name}`,
            amount: -cost,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleBuyFurniture = (
    item: FurnitureCatalogItem,
    color: string,
    materialType: FurnitureMaterialType
  ) => {
    setGameState((prev) => {
      if (prev.money < item.price) return prev;
      soundEngine.playPurchase();
      const newOwned: OwnedFurnitureItem = {
        instanceId: `furn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        catalogId: item.id,
        name: item.name,
        location: item.location,
        room: item.room,
        price: item.price,
        modelType: item.modelType,
        color,
        materialType,
        placed: false,
        position: [0, 0, 0],
        rotationY: 0,
      };
      return {
        ...prev,
        money: prev.money - item.price,
        ownedFurniture: [newOwned, ...(prev.ownedFurniture ?? [])],
        earningsHistory: [
          {
            id: `f_buy_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Móvel: ${item.name}`,
            amount: -item.price,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
  };

  const handleRemoveFurniture = (instanceId: string) => {
    soundEngine.playClick();
    setGameState((prev) => ({
      ...prev,
      ownedFurniture: (prev.ownedFurniture ?? []).map((f) =>
        f.instanceId === instanceId ? { ...f, placed: false } : f
      ),
    }));
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  const handleSellFurniture = (instanceId: string) => {
    setGameState((prev) => {
      const target = (prev.ownedFurniture ?? []).find((f) => f.instanceId === instanceId);
      if (!target) return prev;
      const refund = Math.round(target.price * 0.7);
      soundEngine.playCashRegister();
      return {
        ...prev,
        money: prev.money + refund,
        ownedFurniture: (prev.ownedFurniture ?? []).filter((f) => f.instanceId !== instanceId),
        earningsHistory: [
          {
            id: `f_sell_${Date.now()}`,
            day: prev.day,
            time: formatTime(prev.timeMinutes),
            description: `Venda de móvel: ${target.name}`,
            amount: refund,
          },
          ...prev.earningsHistory,
        ].slice(0, 50),
      };
    });
    setTimeout(() => engineRef.current?.syncWorldState(), 0);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#bde0fe]">
      {/* Isolated 3D Canvas Container */}
      <div ref={canvasContainerRef} className="w-full h-full" />

      {phase === 'title' && (
        <TitleScreen
          onStart={handleStartNew}
          hasSave={Boolean(saved)}
          onContinue={handleContinue}
        />
      )}

      {phase === 'customize' && (
        <CharacterCreator
          customization={gameState.customization}
          onChange={handleCustomizationChange}
          onConfirm={() => setPhase('playing')}
        />
      )}

      {phase === 'playing' && (
        <>
          <HUD
            state={gameState}
            weather={weather}
            interactPrompt={interactPrompt}
            infoMessage={infoMessage}
            isPlacing={Boolean(placingItem)}
            muted={muted}
            onToggleMute={() => {
              soundEngine.muted = !muted;
              setMuted(!muted);
            }}
            onCycleWeather={() => engineRef.current?.cycleWeather()}
            onInteract={() => engineRef.current?.triggerInteract()}
            onOpenModal={(m) => {
              soundEngine.playClick();
              setActiveModal(m);
            }}
            onOpenCustomize={() => {
              soundEngine.playClick();
              setPhase('customize');
            }}
            onEmote={(emote) => {
              soundEngine.playClick();
              engineRef.current?.triggerEmote(emote);
            }}
          />

          <Modals
            activeModal={activeModal === 'furniture' ? null : activeModal}
            state={gameState}
            onClose={() => setActiveModal(null)}
            onBuyStock={handleBuyStock}
            onBuyDecoration={handleBuyDecoration}
            onToggleDecoration={handleToggleDecoration}
            onBuyUpgrade={handleBuyUpgrade}
            onHireEmployee={handleHireEmployee}
            onFireEmployee={handleFireEmployee}
            onChangeBuildingColor={handleChangeBuildingColor}
            onBuyOrEquipFacade={handleBuyOrEquipFacade}
            onCreateCustomFacade={handleCreateCustomFacade}
            onUpdateProductPrice={handleUpdateProductPrice}
          />

          <FurnitureModal
            isOpen={activeModal === 'furniture'}
            state={gameState}
            onClose={() => setActiveModal(null)}
            onBuyFurniture={handleBuyFurniture}
            onStartPlacement={(item) => {
              setPlacingItem(item);
              setSelectedSpotId('');
              engineRef.current?.setSnapToGrid(snapToGrid);
              engineRef.current?.startPlacement(item);
            }}
            onPlaceAtFixedSpot={(item, pos, rotY) =>
              engineRef.current?.placeAtFixedSpot(item, pos, rotY) ?? false
            }
            onRemoveFurniture={handleRemoveFurniture}
            onSellFurniture={handleSellFurniture}
          />

          <CheckoutMinigameModal
            session={checkoutSession}
            onComplete={(npcIndex: number, soldItems: CheckoutItem[]) => {
              engineRef.current?.completeCheckoutMinigame(npcIndex, soldItems);
              setCheckoutSession(null);
            }}
            onCancel={(npcIndex: number) => {
              engineRef.current?.cancelCheckoutMinigame(npcIndex);
              setCheckoutSession(null);
            }}
          />

          {placingItem && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 max-w-[95vw]">
              {!placementStatus.valid && placementStatus.reason && (
                <div className="px-3.5 py-1 rounded-full bg-[#e63946] text-white text-xs font-bold shadow-md">
                  {placementStatus.reason}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 bg-white/95 border-2 border-[#ff758f] rounded-2xl px-4 py-2.5 shadow-xl">
                <span className="text-xs font-extrabold text-[#6d597a]">
                  Posicionando: {placingItem.name}
                </span>
                <select
                  value={selectedSpotId}
                  onChange={(e) => {
                    const spotId = e.target.value;
                    setSelectedSpotId(spotId);
                    if (spotId) {
                      engineRef.current?.movePlacementToFixedSpot(spotId);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#e0f2fe] text-[#1d4e89] text-xs font-bold border border-[#bde0fe] cursor-pointer"
                >
                  <option value="">Lugar Fixo...</option>
                  {FIXED_FURNITURE_SPOTS.filter((s) => s.location === placingItem.location).map(
                    (spot) => (
                      <option key={spot.id} value={spot.id}>
                        {spot.label}
                      </option>
                    )
                  )}
                </select>
                {placementStatus.lockedToSpot && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpotId('');
                      engineRef.current?.setPlacementFreeMode();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#fff3d6] text-[#7f5539] text-xs font-bold cursor-pointer"
                  >
                    Modo Livre
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = !snapToGrid;
                    setSnapToGrid(next);
                    engineRef.current?.setSnapToGrid(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    snapToGrid
                      ? 'bg-[#2ec4b6] text-white'
                      : 'bg-gray-100 text-[#6d597a]'
                  }`}
                >
                  Grade Fixa: {snapToGrid ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.rotatePlacement()}
                  className="px-3 py-1.5 rounded-xl bg-[#d8c2f0] text-[#4a306d] text-xs font-bold cursor-pointer"
                >
                  Girar (R)
                </button>
                <button
                  type="button"
                  disabled={!placementStatus.valid}
                  onClick={() => engineRef.current?.confirmPlacement()}
                  className="px-3 py-1.5 rounded-xl bg-[#ff758f] hover:bg-[#ff5c7c] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar (Enter)
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.cancelPlacement(true)}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar (Esc)
                </button>
              </div>
            </div>
          )}

          {dailySummary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#ffc2d1] overflow-hidden">
                <div className="px-6 py-4 bg-[#fff0f3] border-b border-[#ffc2d1] text-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#b56576]">
                    Fechamento Financeiro
                  </span>
                  <h3 className="text-xl font-extrabold text-[#6d597a]">
                    Planilha do Dia {dailySummary.day}
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#d8f3dc]/60">
                    <span className="text-sm font-bold text-[#2d6a4f]">Total Lucrado (Vendas)</span>
                    <span className="text-base font-extrabold text-[#2d6a4f] tabular-nums">
                      + R$ {dailySummary.income}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#ffe5ec]">
                    <span className="text-sm font-bold text-[#9d2a4b]">Total Gasto (Despesas)</span>
                    <span className="text-base font-extrabold text-[#9d2a4b] tabular-nums">
                      - R$ {dailySummary.expenses}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#f3e8ff] border border-[#d8c2f0]">
                    <span className="text-sm font-extrabold text-[#6d597a]">Saldo Líquido do Dia</span>
                    <span
                      className={`text-lg font-extrabold tabular-nums ${
                        dailySummary.profit >= 0 ? 'text-[#2d6a4f]' : 'text-[#d62828]'
                      }`}
                    >
                      {dailySummary.profit >= 0
                        ? `+ R$ ${dailySummary.profit}`
                        : `- R$ ${Math.abs(dailySummary.profit)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setDailySummary(null);
                    }}
                    className="w-full mt-2 py-3 rounded-2xl bg-[#ff758f] hover:bg-[#ff5c7c] text-white font-extrabold text-sm shadow-md cursor-pointer"
                  >
                    Começar Novo Dia (08:00)
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
