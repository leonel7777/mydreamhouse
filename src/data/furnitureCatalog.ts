export type FurnitureLocation = 'garden' | 'house' | 'shop';
export type FurnitureRoom = 'Jardim' | 'Sala' | 'Quarto' | 'Cozinha' | 'Banheiro' | 'Loja';
export type FurnitureMaterialType = 'pastel' | 'wood' | 'glossy';

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  location: FurnitureLocation;
  room: FurnitureRoom;
  price: number;
  modelType: string;
  defaultColor: string;
}

export interface OwnedFurnitureItem {
  instanceId: string;
  catalogId: string;
  name: string;
  location: FurnitureLocation;
  room: FurnitureRoom;
  price: number;
  modelType: string;
  color: string;
  materialType: FurnitureMaterialType;
  placed: boolean;
  position: [number, number, number];
  rotationY: number;
}

export interface FixedFurnitureSpot {
  id: string;
  label: string;
  location: FurnitureLocation;
  position: [number, number, number];
  rotationY: number;
}

export const FIXED_FURNITURE_SPOTS: FixedFurnitureSpot[] = [
  // Loja
  { id: 'shop_center', label: 'Centro da Loja', location: 'shop', position: [0, 0, -1.6], rotationY: 0 },
  { id: 'shop_front_l', label: 'Entrada Esquerda', location: 'shop', position: [-2.6, 0, -0.1], rotationY: 0 },
  { id: 'shop_front_r', label: 'Entrada Direita', location: 'shop', position: [2.6, 0, -0.1], rotationY: 0 },
  { id: 'shop_side_l', label: 'Lateral Esquerda', location: 'shop', position: [-2.1, 0, -2.5], rotationY: Math.PI / 2 },
  { id: 'shop_side_r', label: 'Lateral Direita', location: 'shop', position: [2.2, 0, -1.4], rotationY: -Math.PI / 2 },
  { id: 'shop_back_l', label: 'Fundo Esquerdo', location: 'shop', position: [-0.8, 0, -3.7], rotationY: 0 },

  // Casa da Elizene
  { id: 'house_living_center', label: 'Sala · Centro', location: 'house', position: [-14.0, 0, -0.8], rotationY: 0 },
  { id: 'house_living_front', label: 'Sala · Frente Esquerda', location: 'house', position: [-16.2, 0, 0.2], rotationY: 0 },
  { id: 'house_bedroom_l', label: 'Quarto · Canto Esquerdo', location: 'house', position: [-16.4, 0, -4.1], rotationY: 0 },
  { id: 'house_bedroom_r', label: 'Quarto · Canto Direito', location: 'house', position: [-11.6, 0, -4.1], rotationY: 0 },
  { id: 'house_kitchen', label: 'Cozinha · Parede Esquerda', location: 'house', position: [-16.5, 0, -2.0], rotationY: Math.PI / 2 },
  { id: 'house_bath', label: 'Banheiro · Parede Direita', location: 'house', position: [-11.5, 0, -1.6], rotationY: -Math.PI / 2 },

  // Jardim
  { id: 'garden_center', label: 'Centro do Jardim', location: 'garden', position: [12.5, 0, -2.0], rotationY: 0 },
  { id: 'garden_back_l', label: 'Fundo Esquerdo', location: 'garden', position: [9.5, 0, -4.2], rotationY: 0 },
  { id: 'garden_back_r', label: 'Fundo Direito', location: 'garden', position: [15.5, 0, -4.2], rotationY: 0 },
  { id: 'garden_front_l', label: 'Frente Esquerda', location: 'garden', position: [9.8, 0, 0.2], rotationY: 0 },
  { id: 'garden_front_r', label: 'Frente Direita', location: 'garden', position: [15.2, 0, 0.2], rotationY: 0 },
  { id: 'garden_back_c', label: 'Fundo Central', location: 'garden', position: [12.5, 0, -4.5], rotationY: 0 },
];

export const FURNITURE_COLORS: { name: string; hex: string }[] = [
  { name: 'Rosa pastel', hex: '#f9c5d1' },
  { name: 'Rosa choque', hex: '#ff758f' },
  { name: 'Lilás', hex: '#d8c2f0' },
  { name: 'Roxo', hex: '#9d79d6' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Bege', hex: '#eadbc8' },
  { name: 'Creme', hex: '#fff3d6' },
  { name: 'Amarelo', hex: '#ffd166' },
  { name: 'Azul-claro', hex: '#bde0fe' },
  { name: 'Azul-petróleo', hex: '#457b9d' },
  { name: 'Verde-menta', hex: '#c1ebd7' },
  { name: 'Marrom', hex: '#8d5b4c' },
  { name: 'Preto', hex: '#2b2d42' },
  { name: 'Vermelho', hex: '#e63946' },
];

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  // ==================== JARDIM ====================
  { id: 'f_g_bench', name: 'Banco de Jardim', location: 'garden', room: 'Jardim', price: 150, modelType: 'bench', defaultColor: '#bde0fe' },
  { id: 'f_g_table', name: 'Mesinha Externa', location: 'garden', room: 'Jardim', price: 120, modelType: 'table', defaultColor: '#ffffff' },
  { id: 'f_g_chair', name: 'Cadeira de Jardim', location: 'garden', room: 'Jardim', price: 60, modelType: 'chair', defaultColor: '#f9c5d1' },
  { id: 'f_g_armchair', name: 'Poltrona Externa', location: 'garden', room: 'Jardim', price: 180, modelType: 'armchair', defaultColor: '#c1ebd7' },
  { id: 'f_g_sofa', name: 'Sofá Externo', location: 'garden', room: 'Jardim', price: 350, modelType: 'sofa', defaultColor: '#fff3d6' },
  { id: 'f_g_swing', name: 'Balanço', location: 'garden', room: 'Jardim', price: 260, modelType: 'swing', defaultColor: '#f9c5d1' },
  { id: 'f_g_picnic', name: 'Mesa de Piquenique', location: 'garden', room: 'Jardim', price: 220, modelType: 'table', defaultColor: '#eadbc8' },
  { id: 'f_g_vase', name: 'Vaso de Flores', location: 'garden', room: 'Jardim', price: 50, modelType: 'plant', defaultColor: '#f9c5d1' },
  { id: 'f_g_roses', name: 'Rosas', location: 'garden', room: 'Jardim', price: 45, modelType: 'flower_patch', defaultColor: '#ff758f' },
  { id: 'f_g_tulips', name: 'Tulipas', location: 'garden', room: 'Jardim', price: 45, modelType: 'flower_patch', defaultColor: '#d8c2f0' },
  { id: 'f_g_sunflower', name: 'Girassóis', location: 'garden', room: 'Jardim', price: 55, modelType: 'flower_patch', defaultColor: '#ffd166' },
  { id: 'f_g_tree', name: 'Árvore Pequena', location: 'garden', room: 'Jardim', price: 110, modelType: 'tree', defaultColor: '#95d5b2' },
  { id: 'f_g_bush', name: 'Arbusto', location: 'garden', room: 'Jardim', price: 40, modelType: 'bush', defaultColor: '#74c69d' },
  { id: 'f_g_fountain', name: 'Fonte de Água', location: 'garden', room: 'Jardim', price: 400, modelType: 'fountain', defaultColor: '#ffffff' },
  { id: 'f_g_stones', name: 'Pedras Decorativas', location: 'garden', room: 'Jardim', price: 35, modelType: 'stones', defaultColor: '#adb5bd' },
  { id: 'f_g_lamp', name: 'Luminária de Jardim', location: 'garden', room: 'Jardim', price: 90, modelType: 'lamp', defaultColor: '#fff3d6' },

  // ==================== CASA: SALA ====================
  { id: 'f_h_sofa', name: 'Sofá da Sala', location: 'house', room: 'Sala', price: 350, modelType: 'sofa', defaultColor: '#f9c5d1' },
  { id: 'f_h_armchair', name: 'Poltrona', location: 'house', room: 'Sala', price: 160, modelType: 'armchair', defaultColor: '#d8c2f0' },
  { id: 'f_h_coffeetable', name: 'Mesa de Centro', location: 'house', room: 'Sala', price: 140, modelType: 'table', defaultColor: '#ffffff' },
  { id: 'f_h_bookshelf', name: 'Estante', location: 'house', room: 'Sala', price: 210, modelType: 'shelf', defaultColor: '#eadbc8' },
  { id: 'f_h_tv', name: 'Televisor', location: 'house', room: 'Sala', price: 380, modelType: 'tv', defaultColor: '#343a40' },
  { id: 'f_h_rug', name: 'Tapete da Sala', location: 'house', room: 'Sala', price: 90, modelType: 'rug', defaultColor: '#f9c5d1' },
  { id: 'f_h_lamp', name: 'Luminária', location: 'house', room: 'Sala', price: 95, modelType: 'lamp', defaultColor: '#fff3d6' },

  // ==================== CASA: QUARTO ====================
  { id: 'f_h_bed_single', name: 'Cama de Solteiro', location: 'house', room: 'Quarto', price: 420, modelType: 'bed', defaultColor: '#bde0fe' },
  { id: 'f_h_bed_double', name: 'Cama de Casal', location: 'house', room: 'Quarto', price: 500, modelType: 'bed_double', defaultColor: '#f9c5d1' },
  { id: 'f_h_wardrobe', name: 'Guarda-Roupa', location: 'house', room: 'Quarto', price: 360, modelType: 'wardrobe', defaultColor: '#ffffff' },
  { id: 'f_h_nightstand', name: 'Criado-Mudo', location: 'house', room: 'Quarto', price: 110, modelType: 'nightstand', defaultColor: '#eadbc8' },
  { id: 'f_h_vanity', name: 'Penteadeira', location: 'house', room: 'Quarto', price: 450, modelType: 'vanity', defaultColor: '#f9c5d1' },
  { id: 'f_h_mirror', name: 'Espelho', location: 'house', room: 'Quarto', price: 130, modelType: 'mirror', defaultColor: '#d8c2f0' },
  { id: 'f_h_desk', name: 'Escrivaninha', location: 'house', room: 'Quarto', price: 200, modelType: 'table', defaultColor: '#ffffff' },
  { id: 'f_h_chair_q', name: 'Cadeira', location: 'house', room: 'Quarto', price: 60, modelType: 'chair', defaultColor: '#d8c2f0' },

  // ==================== CASA: COZINHA ====================
  { id: 'f_h_fridge', name: 'Geladeira', location: 'house', room: 'Cozinha', price: 480, modelType: 'fridge', defaultColor: '#ffffff' },
  { id: 'f_h_stove', name: 'Fogão', location: 'house', room: 'Cozinha', price: 390, modelType: 'stove', defaultColor: '#f8f9fa' },
  { id: 'f_h_cabinet', name: 'Armário de Cozinha', location: 'house', room: 'Cozinha', price: 240, modelType: 'wardrobe', defaultColor: '#c1ebd7' },
  { id: 'f_h_sink_k', name: 'Pia de Cozinha', location: 'house', room: 'Cozinha', price: 220, modelType: 'sink', defaultColor: '#ffffff' },
  { id: 'f_h_dining', name: 'Mesa de Jantar', location: 'house', room: 'Cozinha', price: 200, modelType: 'table', defaultColor: '#eadbc8' },
  { id: 'f_h_chair_k', name: 'Cadeira de Cozinha', location: 'house', room: 'Cozinha', price: 60, modelType: 'chair', defaultColor: '#fff3d6' },

  // ==================== CASA: BANHEIRO ====================
  { id: 'f_h_bathtub', name: 'Banheira', location: 'house', room: 'Banheiro', price: 460, modelType: 'bathtub', defaultColor: '#ffffff' },
  { id: 'f_h_shower', name: 'Chuveiro', location: 'house', room: 'Banheiro', price: 320, modelType: 'shower', defaultColor: '#bde0fe' },
  { id: 'f_h_sink_b', name: 'Pia de Banheiro', location: 'house', room: 'Banheiro', price: 180, modelType: 'sink', defaultColor: '#ffffff' },
  { id: 'f_h_rug_b', name: 'Tapete de Banheiro', location: 'house', room: 'Banheiro', price: 45, modelType: 'rug', defaultColor: '#c1ebd7' },
  { id: 'f_h_plant_b', name: 'Planta Decorativa', location: 'house', room: 'Banheiro', price: 50, modelType: 'plant', defaultColor: '#c1ebd7' },

  // ==================== LOJA ====================
  { id: 'f_s_counter', name: 'Balcão de Atendimento', location: 'shop', room: 'Loja', price: 260, modelType: 'counter', defaultColor: '#8d5b4c' },
  { id: 'f_s_shelf', name: 'Prateleira', location: 'shop', room: 'Loja', price: 180, modelType: 'shelf', defaultColor: '#8d5b4c' },
  { id: 'f_s_table', name: 'Mesa Expositora', location: 'shop', room: 'Loja', price: 200, modelType: 'table', defaultColor: '#ffffff' },
  { id: 'f_s_chair', name: 'Cadeira', location: 'shop', room: 'Loja', price: 60, modelType: 'chair', defaultColor: '#f9c5d1' },
  { id: 'f_s_sofa', name: 'Sofá para Clientes', location: 'shop', room: 'Loja', price: 350, modelType: 'sofa', defaultColor: '#d8c2f0' },
  { id: 'f_s_mirror', name: 'Espelho', location: 'shop', room: 'Loja', price: 130, modelType: 'mirror', defaultColor: '#f9c5d1' },
  { id: 'f_s_plant', name: 'Vaso de Flores', location: 'shop', room: 'Loja', price: 50, modelType: 'plant', defaultColor: '#c1ebd7' },
  { id: 'f_s_rug', name: 'Tapete da Loja', location: 'shop', room: 'Loja', price: 90, modelType: 'rug', defaultColor: '#f9c5d1' },
  { id: 'f_s_lamp', name: 'Luminária', location: 'shop', room: 'Loja', price: 95, modelType: 'lamp', defaultColor: '#fff3d6' },
  { id: 'f_s_promo', name: 'Placa de Promoção', location: 'shop', room: 'Loja', price: 85, modelType: 'sign', defaultColor: '#ff758f' },
];
