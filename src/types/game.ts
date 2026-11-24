import { OwnedFurnitureItem } from '../data/furnitureCatalog';

export type GamePhase = 'title' | 'customize' | 'playing' | 'paused';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

export type SkinTone = '#fde2c4' | '#f5c6a5' | '#e0a370' | '#b57445' | '#7a4928';
export type HairStyle = 'long' | 'ponytail' | 'bun' | 'bob';
export type EyeStyle = 'sweet' | 'sparkly' | 'cat';
export type OutfitType = 'dress' | 'skirt' | 'pants';
export type AccessoryType = 'none' | 'bow' | 'necklace' | 'earrings' | 'bracelet';
export type BagType = 'none' | 'tote' | 'crossbody';

export interface ElizeneCustomization {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: string;
  eyeStyle: EyeStyle;
  eyeColor: string;
  outfitType: OutfitType;
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  bagType: BagType;
  bagColor: string;
  accessory: AccessoryType;
}

export type ProductCategory =
  | 'bolsas'
  | 'lacos'
  | 'colares'
  | 'pulseiras'
  | 'brincos'
  | 'oculos'
  | 'presilhas'
  | 'cabelo';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  costPrice: number;
  sellPrice: number;
  stock: number;
  color: string;
  unlocked: boolean;
}

export interface CheckoutItem {
  uid: string;
  productId: string;
  name: string;
  sellPrice: number;
  color: string;
}

export interface CheckoutSession {
  npcIndex: number;
  customerName: string;
  items: CheckoutItem[];
}

export type EmployeeRole = 'cashier' | 'organizer' | 'cleaner' | 'guard';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  roleLabel: string;
  description: string;
  hireCost: number;
  dailySalary: number;
  hired: boolean;
  hairColor: string;
  outfitColor: string;
}

export type PastelColorName =
  | 'Rosa pastel'
  | 'Lilás'
  | 'Azul-claro'
  | 'Creme'
  | 'Branco'
  | 'Bege'
  | 'Verde-menta';

export const PASTEL_PALETTE: { name: PastelColorName; hex: string }[] = [
  { name: 'Rosa pastel', hex: '#f9c5d1' },
  { name: 'Lilás', hex: '#d8c2f0' },
  { name: 'Azul-claro', hex: '#bde0fe' },
  { name: 'Creme', hex: '#fff3d6' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Bege', hex: '#eadbc8' },
  { name: 'Verde-menta', hex: '#c1ebd7' },
];

export const BUILDING_COLORS: { name: string; hex: string }[] = [
  { name: 'Rosa Pastel', hex: '#ffb3c6' },
  { name: 'Lilás', hex: '#d8c2f0' },
  { name: 'Azul-Claro', hex: '#bde0fe' },
  { name: 'Creme', hex: '#fff3d6' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Bege', hex: '#eadbc8' },
  { name: 'Verde-Menta', hex: '#c1ebd7' },
  { name: 'Pêssego', hex: '#ffd6ba' },
  { name: 'Amarelo Doce', hex: '#ffe699' },
  { name: 'Coral Suave', hex: '#ff9ebb' },
  { name: 'Lavanda', hex: '#cdb4db' },
  { name: 'Turquesa', hex: '#98f5e1' },
];

export type DecorationLocation = 'shop' | 'garden' | 'house';

export interface DecorationItem {
  id: string;
  name: string;
  category: string;
  price: number;
  owned: boolean;
  placed: boolean;
  color: string;
  location: DecorationLocation;
  position: [number, number, number];
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  level: number;
  maxLevel: number;
  type: 'inventory' | 'shelves' | 'cashier' | 'shop_expand' | 'garden' | 'house' | 'weapon';
}

export interface FacadeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  awningColor: string;
  roofColor: string;
}

export interface EarningsEntry {
  id: string;
  day: number;
  time: string;
  description: string;
  amount: number; // positive = income, negative = expense
}

export interface GameState {
  money: number;
  day: number;
  timeMinutes: number; // 480 = 08:00, 1140 = 19:00, 1440 = 24:00
  shopOpen: boolean;
  gardenUnlocked: boolean;
  houseUnlocked: boolean;
  inventoryCapacity: number;
  maxShelves: number;
  cashierSpeedLevel: number;
  weaponLevel: number;
  shopExpanded: boolean;
  shopWallColor: string;
  houseWallColor: string;
  customization: ElizeneCustomization;
  products: Product[];
  employees: Employee[];
  decorations: DecorationItem[];
  upgrades: UpgradeItem[];
  facades: FacadeItem[];
  ownedFurniture: OwnedFurnitureItem[];
  earningsHistory: EarningsEntry[];
  totalSalesCount: number;
}

export const DEFAULT_CUSTOMIZATION: ElizeneCustomization = {
  skinTone: '#f5c6a5',
  hairStyle: 'long',
  hairColor: '#5c3a21',
  eyeStyle: 'sweet',
  eyeColor: '#4a3525',
  outfitType: 'dress',
  topColor: '#f9c5d1',
  bottomColor: '#d8c2f0',
  shoeColor: '#ffffff',
  bagType: 'tote',
  bagColor: '#f4a2b8',
  accessory: 'bow',
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'bolsa_rosa', name: 'Bolsa Charmosa', category: 'bolsas', costPrice: 25, sellPrice: 55, stock: 5, color: '#f9c5d1', unlocked: true },
  { id: 'laco_cetim', name: 'Laço de Cetim', category: 'lacos', costPrice: 8, sellPrice: 20, stock: 8, color: '#d8c2f0', unlocked: true },
  { id: 'colar_perola', name: 'Colar Pérola', category: 'colares', costPrice: 18, sellPrice: 42, stock: 5, color: '#fff3d6', unlocked: true },
  { id: 'pulseira_doce', name: 'Pulseira Doce', category: 'pulseiras', costPrice: 10, sellPrice: 24, stock: 6, color: '#bde0fe', unlocked: true },
  { id: 'brinco_flor', name: 'Brinco Florzinha', category: 'brincos', costPrice: 12, sellPrice: 28, stock: 4, color: '#f4a2b8', unlocked: true },
  { id: 'oculos_sol', name: 'Óculos Pastel', category: 'oculos', costPrice: 20, sellPrice: 48, stock: 3, color: '#c1ebd7', unlocked: true },
  { id: 'presilha_estrela', name: 'Presilha Estrela', category: 'presilhas', costPrice: 6, sellPrice: 16, stock: 8, color: '#ffd166', unlocked: true },
  { id: 'tiara_veludo', name: 'Tiara de Veludo', category: 'cabelo', costPrice: 14, sellPrice: 32, stock: 4, color: '#e295b0', unlocked: true },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_cashier',
    name: 'Sofia',
    role: 'cashier',
    roleLabel: 'Caixa',
    description: 'Atende clientes no caixa, registra compras e acelera pagamentos.',
    hireCost: 300,
    dailySalary: 60,
    hired: false,
    hairColor: '#3b2416',
    outfitColor: '#f9c5d1',
  },
  {
    id: 'emp_organizer',
    name: 'Clara',
    role: 'organizer',
    roleLabel: 'Organização',
    description: 'Reorganiza as prateleiras e mantém os produtos sempre arrumados.',
    hireCost: 360,
    dailySalary: 70,
    hired: false,
    hairColor: '#c98a4b',
    outfitColor: '#d8c2f0',
  },
  {
    id: 'emp_cleaner',
    name: 'Bia',
    role: 'cleaner',
    roleLabel: 'Limpeza',
    description: 'Limpa o chão e remove sujeiras que aparecem durante o expediente.',
    hireCost: 260,
    dailySalary: 50,
    hired: false,
    hairColor: '#222222',
    outfitColor: '#c1ebd7',
  },
  {
    id: 'emp_guard',
    name: 'Valéria',
    role: 'guard',
    roleLabel: 'Segurança',
    description: 'Mulher forte que vigia a entrada e impede que ladras roubem a loja.',
    hireCost: 480,
    dailySalary: 95,
    hired: false,
    hairColor: '#1b1b1e',
    outfitColor: '#2b2d42',
  },
];

export const INITIAL_DECORATIONS: DecorationItem[] = [
  { id: 'dec_rug_shop', name: 'Tapete Fofo', category: 'Tapetes', price: 60, owned: false, placed: false, color: '#f9c5d1', location: 'shop', position: [0, 0.02, 0.5] },
  { id: 'dec_sofa_shop', name: 'Sofá Aconchegante', category: 'Sofás', price: 120, owned: false, placed: false, color: '#d8c2f0', location: 'shop', position: [-3.2, 0, 2.2] },
  { id: 'dec_plant_shop', name: 'Vaso de Flores', category: 'Plantas', price: 45, owned: false, placed: false, color: '#c1ebd7', location: 'shop', position: [3.3, 0, 2.5] },
  { id: 'dec_lamp_shop', name: 'Luminária Elegante', category: 'Luminárias', price: 75, owned: false, placed: false, color: '#fff3d6', location: 'shop', position: [-3.3, 0, -2.5] },
  { id: 'dec_table_shop', name: 'Mesinha Central', category: 'Mesas', price: 90, owned: false, placed: false, color: '#ffffff', location: 'shop', position: [0, 0, 1.5] },
  { id: 'dec_bench_garden', name: 'Banco Florido', category: 'Jardim', price: 85, owned: false, placed: false, color: '#bde0fe', location: 'garden', position: [12, 0, 2] },
  { id: 'dec_fountain_garden', name: 'Fonte Encantada', category: 'Jardim', price: 180, owned: false, placed: false, color: '#ffffff', location: 'garden', position: [14, 0, -1] },
  { id: 'dec_sofa_house', name: 'Sofá da Sala', category: 'Casa', price: 140, owned: false, placed: false, color: '#f9c5d1', location: 'house', position: [-14, 0, -1] },
  { id: 'dec_rug_house', name: 'Tapete da Casa', category: 'Casa', price: 70, owned: false, placed: false, color: '#eadbc8', location: 'house', position: [-14, 0.02, 1] },
];

export const INITIAL_UPGRADES: UpgradeItem[] = [
  { id: 'upg_inventory', name: 'Expandir Estoque', description: 'Aumenta a capacidade máxima de estoque da loja (+25 itens).', price: 120, level: 1, maxLevel: 8, type: 'inventory' },
  { id: 'upg_shelves', name: 'Novas Prateleiras', description: 'Adiciona mais espaço de exposição para atrair clientes.', price: 160, level: 1, maxLevel: 6, type: 'shelves' },
  { id: 'upg_cashier', name: 'Caixa Express', description: 'Melhora o balcão e acelera o atendimento.', price: 140, level: 1, maxLevel: 6, type: 'cashier' },
  { id: 'upg_shop_expand', name: 'Evolução da Loja', description: 'Aumenta o tamanho físico da loja e atrai mais clientes (até nível 5).', price: 300, level: 1, maxLevel: 5, type: 'shop_expand' },
  { id: 'upg_weapon', name: 'Arma de Defesa da Loja', description: 'Compra e evolui uma arma de defesa para espantar a ladra de longe com [F] (até Nível 3).', price: 380, level: 0, maxLevel: 3, type: 'weapon' },
  { id: 'upg_garden', name: 'Jardim Encantador', description: 'Desbloqueia o acesso ao jardim ao lado da loja!', price: 4000, level: 0, maxLevel: 1, type: 'garden' },
  { id: 'upg_house', name: 'Casa da Elizene', description: 'Compra a casa própria da Elizene para entrar e decorar!', price: 4000, level: 0, maxLevel: 1, type: 'house' },
];

export const INITIAL_FACADES: FacadeItem[] = [
  { id: 'fac_classic', name: 'Clássica Rosa', description: 'Toldo rosa vibrante tradicional da boutique.', price: 0, owned: true, equipped: true, awningColor: '#ff758f', roofColor: '#ffc2d1' },
  { id: 'fac_lavender', name: 'Doce Lavanda', description: 'Fachada delicada em tons de lilás e lavanda.', price: 180, owned: false, equipped: false, awningColor: '#9d79d6', roofColor: '#d8c2f0' },
  { id: 'fac_mint', name: 'Jardim Menta', description: 'Visual refrescante em verde-menta pastel.', price: 220, owned: false, equipped: false, awningColor: '#52b788', roofColor: '#c1ebd7' },
  { id: 'fac_paris', name: 'Boutique Paris', description: 'Elegância em azul-celeste com toque parisiense.', price: 280, owned: false, equipped: false, awningColor: '#457b9d', roofColor: '#bde0fe' },
  { id: 'fac_gold', name: 'Luxo Dourado', description: 'Fachada premium dourada para grandes empresárias.', price: 450, owned: false, equipped: false, awningColor: '#e9c46a', roofColor: '#fff3d6' },
];

export function createInitialGameState(): GameState {
  return {
    money: 200,
    day: 1,
    timeMinutes: 480, // 08:00
    shopOpen: true,
    gardenUnlocked: false,
    houseUnlocked: false,
    inventoryCapacity: 50,
    maxShelves: 2,
    cashierSpeedLevel: 1,
    weaponLevel: 0,
    shopExpanded: false,
    shopWallColor: '#ffb3c6',
    houseWallColor: '#e2ece9',
    customization: { ...DEFAULT_CUSTOMIZATION },
    products: INITIAL_PRODUCTS.map((p) => ({ ...p })),
    employees: INITIAL_EMPLOYEES.map((e) => ({ ...e })),
    decorations: INITIAL_DECORATIONS.map((d) => ({ ...d })),
    upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
    facades: INITIAL_FACADES.map((f) => ({ ...f })),
    ownedFurniture: [],
    earningsHistory: [
      { id: 'init', day: 1, time: '08:00', description: 'Capital inicial da Boutique', amount: 200 },
    ],
    totalSalesCount: 0,
  };
}
