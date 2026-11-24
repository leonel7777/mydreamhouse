import * as THREE from 'three';
import { DecorationItem, Product } from '../types/game';

export interface WorldRefs {
  streetLights: THREE.PointLight[];
  shopLights: THREE.PointLight[];
  lampBulbs: THREE.MeshStandardMaterial[];
  windowMats: THREE.MeshStandardMaterial[];
  shelfItemsGroup: THREE.Group;
  decorationsGroup: THREE.Group;
  shopGroup: THREE.Group;
  shopFloor: THREE.Mesh;
  shopBackWall: THREE.Mesh;
  shopLeftWall: THREE.Mesh;
  shopRightWall: THREE.Mesh;
  shopRoof: THREE.Mesh;
  shopBackPaintings: THREE.Group[];
  shopBackLight: THREE.PointLight;
  shopBackCollider: { minX: number; maxX: number; minZ: number; maxZ: number };
  shopLeftCollider: { minX: number; maxX: number; minZ: number; maxZ: number };
  shopRightCollider: { minX: number; maxX: number; minZ: number; maxZ: number };
  gardenGate: THREE.Group;
  houseDoor: THREE.Group;
  houseDoorLeft: THREE.Group;
  houseDoorRight: THREE.Group;
  shopDoorLeft: THREE.Group;
  shopDoorRight: THREE.Group;
  shopWallMat: THREE.MeshStandardMaterial;
  houseWallMat: THREE.MeshStandardMaterial;
  awningMat: THREE.MeshStandardMaterial;
  roofMat: THREE.MeshStandardMaterial;
  skyDome: THREE.Mesh;
  skyUniforms: {
    topColor: { value: THREE.Color };
    horizonColor: { value: THREE.Color };
    bottomColor: { value: THREE.Color };
    brightness: { value: number };
  };
  sunGroup: THREE.Group;
  sunCoreMat: THREE.MeshBasicMaterial;
  sunGlowMat: THREE.MeshBasicMaterial;
  moonGroup: THREE.Group;
  moonCoreMat: THREE.MeshBasicMaterial;
  moonGlowMat: THREE.MeshBasicMaterial;
  starsMat: THREE.PointsMaterial;
  cloudsGroup: THREE.Group;
  cloudMats: THREE.MeshStandardMaterial[];
  rainPoints: THREE.Points;
  rainPositions: Float32Array;
  rainMat: THREE.PointsMaterial;
  benches: { x: number; y: number; z: number; yaw: number }[];
  cashierAlertMesh: THREE.Mesh;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[];
}

function createFacadeSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 1024, 224);
    grad.addColorStop(0, '#fff7fa');
    grad.addColorStop(0.5, '#ffeaf2');
    grad.addColorStop(1, '#f9e8ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 224);

    // Moldura interna elegante
    ctx.strokeStyle = '#ff758f';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, 988, 188);
    ctx.strokeStyle = '#d8b4e2';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 964, 164);

    // Texto principal
    ctx.fillStyle = '#5c3c6e';
    ctx.font = 'bold 78px "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZENE COLLECTION', 512, 102);

    // Subtítulo decorativo discreto
    ctx.fillStyle = '#b56576';
    ctx.font = '600 22px "Trebuchet MS", sans-serif';
    ctx.fillText('BOUTIQUE & ACESSÓRIOS', 512, 164);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(90, 50, 20, 0.35)' : 'rgba(155, 100, 50, 0.25)';
      ctx.fillRect(0, (i * 256) / 45, 256, 3 + (i % 3));
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRoofTileTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  const rows = 8;
  const cols = 8;
  const rowH = size / rows;
  const colW = size / cols;
  const tileShades = ['#c92a2a', '#b91c1c', '#d63333', '#a61e1e'];

  if (ctx && bctx) {
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#444444';
    bctx.fillRect(0, 0, size, size);

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const stagger = (r % 2) * (colW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + stagger;
        const shade = tileShades[(r * 3 + c + 10) % tileShades.length];

        // Telha arredondada (estilo colonial/cerâmica vermelha)
        ctx.fillStyle = shade;
        ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 3);

        // Brilho superior da telha
        ctx.fillStyle = 'rgba(255, 195, 180, 0.2)';
        ctx.fillRect(x + 2, y + 2, colW - 4, 4);

        // Curva inferior e sombra de sobreposição
        ctx.fillStyle = 'rgba(70, 10, 10, 0.48)';
        ctx.fillRect(x, y + rowH - 4, colW, 4);
        ctx.fillRect(x + colW - 2, y, 2, rowH);

        // Mapa de relevo (bump) para destacar as telhas na luz do sol
        const bGrad = bctx.createLinearGradient(0, y, 0, y + rowH);
        bGrad.addColorStop(0, '#dedede');
        bGrad.addColorStop(0.78, '#9a9a9a');
        bGrad.addColorStop(1, '#262626');
        bctx.fillStyle = bGrad;
        bctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 4);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(5, 4);

  return { map, bumpMap };
}

export function buildNeighborhood(scene: THREE.Scene): WorldRefs {
  const streetLights: THREE.PointLight[] = [];
  const shopLights: THREE.PointLight[] = [];
  const lampBulbs: THREE.MeshStandardMaterial[] = [];
  const windowMats: THREE.MeshStandardMaterial[] = [];
  const benches: { x: number; y: number; z: number; yaw: number }[] = [];
  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

  // Ground (extended terrain sem fundo branco)
  const grassGeo = new THREE.PlaneGeometry(280, 280);
  const grassMat = new THREE.MeshStandardMaterial({ color: '#9ed9b5', roughness: 0.92 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  // ==================== PAISAGEM DE MONTANHAS AO REDOR DO MUNDO ====================
  const mountainGroup = new THREE.Group();
  const foothillMats = [
    new THREE.MeshStandardMaterial({ color: '#78be94', roughness: 0.92, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#63ab82', roughness: 0.92, flatShading: true }),
  ];
  const ridgeMats = [
    new THREE.MeshStandardMaterial({ color: '#587e76', roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#5d7b8c', roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#4d6a7d', roughness: 0.9, flatShading: true }),
  ];
  const snowMat = new THREE.MeshStandardMaterial({ color: '#edf3f8', roughness: 0.78, flatShading: true });
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: '#7f5539', roughness: 0.9 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: '#3b7a57', roughness: 0.85, flatShading: true });

  // Colinas verdes suaves no entorno médio
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const dist = 39 + (i % 3) * 5;
    const hx = Math.cos(angle) * dist;
    const hz = Math.sin(angle) * dist + 2;
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(10 + (i % 4) * 2.5, 14, 10),
      foothillMats[i % foothillMats.length]
    );
    hill.scale.set(1.5, 0.34 + (i % 3) * 0.08, 1.2);
    hill.position.set(hx, 0, hz);
    hill.receiveShadow = true;
    mountainGroup.add(hill);
  }

  // Cadeias de montanhas em 360 graus (picos médios e altos com topo nevado)
  const addMountainPeak = (
    x: number,
    z: number,
    radius: number,
    height: number,
    mat: THREE.MeshStandardMaterial,
    withSnow: boolean,
    rotY: number
  ) => {
    const peak = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), mat);
    body.position.y = height * 0.5;
    body.scale.set(1.15, 1, 0.92);
    body.rotation.y = rotY;
    peak.add(body);

    if (withSnow) {
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.36, height * 0.35, 7),
        snowMat
      );
      cap.position.y = height * 0.835;
      cap.scale.set(1.15, 1, 0.92);
      cap.rotation.y = rotY;
      peak.add(cap);
    }

    peak.position.set(x, -0.3, z);
    mountainGroup.add(peak);
  };

  // Anel interno de montanhas verdes (30 picos)
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + 0.08;
    const dist = 52 + (i % 3) * 5;
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * dist + 3;
    const rad = 11 + (i % 4) * 2.4;
    const h = 11 + (i % 5) * 2.8;
    addMountainPeak(mx, mz, rad, h, foothillMats[i % foothillMats.length], false, i * 0.7);
  }

  // Anel externo de grandes montanhas (26 picos altos com neve)
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2;
    const dist = 74 + (i % 3) * 8;
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * dist + 3;
    const rad = 16 + (i % 4) * 3.5;
    const h = 22 + (i % 5) * 4.5;
    addMountainPeak(mx, mz, rad, h, ridgeMats[i % ridgeMats.length], h >= 25, i * 1.1);
  }

  // Pinheiros espalhados na base das montanhas
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + 0.05;
    const dist = 33 + (i % 4) * 4.2;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist + 3;
    // Evitar área da rua e casas
    if (Math.abs(tx) < 27 && tz > -9 && tz < 16) continue;
    const pine = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.0, 6), pineTrunkMat);
    trunk.position.y = 0.5;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 7), pineLeafMat);
    c1.position.y = 1.6;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.4, 7), pineLeafMat);
    c2.position.y = 2.45;
    pine.add(trunk, c1, c2);
    pine.position.set(tx, 0, tz);
    pine.scale.setScalar(0.9 + (i % 3) * 0.25);
    mountainGroup.add(pine);
  }
  scene.add(mountainGroup);

  // Main Street (Rua Principal)
  const roadMat = new THREE.MeshStandardMaterial({ color: '#8d99ae', roughness: 0.85 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(60, 0.04, 6.5), roadMat);
  road.position.set(0, 0.02, 7.5);
  road.receiveShadow = true;
  scene.add(road);

  // Dashed road lines
  const lineMat = new THREE.MeshStandardMaterial({ color: '#fff3d6', roughness: 0.6 });
  for (let x = -26; x <= 26; x += 4) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.18), lineMat);
    dash.position.set(x, 0.03, 7.5);
    scene.add(dash);
  }

  // Sidewalks (cinza escuro)
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: '#4a4e54', roughness: 0.85 });
  const sidewalkNorth = new THREE.Mesh(new THREE.BoxGeometry(60, 0.08, 2.6), sidewalkMat);
  sidewalkNorth.position.set(0, 0.04, 3.0);
  sidewalkNorth.receiveShadow = true;
  scene.add(sidewalkNorth);

  const sidewalkSouth = new THREE.Mesh(new THREE.BoxGeometry(60, 0.08, 2.6), sidewalkMat);
  sidewalkSouth.position.set(0, 0.04, 12.0);
  sidewalkSouth.receiveShadow = true;
  scene.add(sidewalkSouth);

  // Stylized Trees & Flower Beds along the street
  const createTree = (x: number, z: number, scale = 1) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: '#a98467', roughness: 0.85 })
    );
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    tree.add(trunk);

    const leavesMat = new THREE.MeshStandardMaterial({ color: '#95d5b2', roughness: 0.75 });
    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), leavesMat);
    crown1.position.y = 1.85;
    crown1.castShadow = true;
    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), leavesMat);
    crown2.position.set(0.35, 1.5, 0.2);
    crown2.castShadow = true;
    tree.add(crown1, crown2);

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    scene.add(tree);
    colliders.push({
      minX: x - 0.24 * scale,
      maxX: x + 0.24 * scale,
      minZ: z - 0.24 * scale,
      maxZ: z + 0.24 * scale,
    });
  };

  // Trees on north sidewalk and additional trees across the street
  [-18, -10, 7.5, 19, -21, -15, -6, 2, 10, 16, 22].forEach((x, idx) => {
    const z = idx < 4 ? 2.2 : 13.8;
    createTree(x, z, 0.95 + ((idx * 3) % 4) * 0.12);
  });

  // 3 Bancos de praça no outro lado da rua (south sidewalk, z: ~12.2)
  const createParkBench = (x: number, z: number, rotY = 0) => {
    const benchGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8d5b4c', roughness: 0.75 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#495057', roughness: 0.35, metalness: 0.8 });

    // Assento com réguas de madeira
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), woodMat);
    seat.position.y = 0.44;
    seat.castShadow = true;
    benchGroup.add(seat);

    // Encosto
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.08), woodMat);
    back.position.set(0, 0.72, 0.22);
    back.castShadow = true;
    benchGroup.add(back);

    // Pés de ferro/metal
    [-0.7, 0.7].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.46), metalMat);
      leg.position.set(lx, 0.22, 0.04);
      leg.castShadow = true;
      benchGroup.add(leg);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.46), metalMat);
      arm.position.set(lx, 0.56, 0.04);
      arm.castShadow = true;
      benchGroup.add(arm);
    });

    benchGroup.position.set(x, 0.04, z);
    benchGroup.rotation.y = rotY;
    scene.add(benchGroup);
    colliders.push({ minX: x - 0.9, maxX: x + 0.9, minZ: z - 0.4, maxZ: z + 0.4 });
  };

  [-11, 0, 11].forEach((bx) => {
    createParkBench(bx, 12.2, 0); // Bancos virados ao contrário (rotY = 0)
    benches.push({ x: bx, y: 0.02, z: 12.14, yaw: Math.PI });
  });

  // Pedras decorativas (rochas de praça) no outro lado da rua
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#90a4ae', roughness: 0.85 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#78909c', roughness: 0.9 });
  const createRockCluster = (x: number, z: number, scale = 1) => {
    const rockGroup = new THREE.Group();
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), stoneMat);
    r1.scale.set(1.4, 0.8, 1.1);
    r1.position.set(0, 0.25, 0);
    r1.castShadow = true;
    r1.receiveShadow = true;
    rockGroup.add(r1);

    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), darkStoneMat);
    r2.scale.set(1.1, 0.7, 1.3);
    r2.position.set(0.35, 0.16, 0.2);
    r2.castShadow = true;
    rockGroup.add(r2);

    const r3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
    r3.position.set(-0.3, 0.12, -0.15);
    r3.castShadow = true;
    rockGroup.add(r3);

    rockGroup.position.set(x, 0.04, z);
    rockGroup.scale.setScalar(scale);
    scene.add(rockGroup);
    colliders.push({ minX: x - 0.55 * scale, maxX: x + 0.55 * scale, minZ: z - 0.45 * scale, maxZ: z + 0.45 * scale });
  };

  [-17, -5, 6, 17].forEach((rx, idx) => {
    createRockCluster(rx, 13.6, 0.9 + (idx % 2) * 0.25);
  });

  // Flower clusters & colorful pebbles along the sidewalks
  const flowerColors = ['#ff8fab', '#d8c2f0', '#ffd166', '#bde0fe', '#98f5e1'];
  for (let i = 0; i < 18; i++) {
    const fx = -20 + i * 2.3;
    const fz = i % 2 === 0 ? 1.8 : 13.3;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.6 })
    );
    flower.position.set(fx, 0.16, fz);
    scene.add(flower);

    // Pedrinhas coloridas na calçada (removidas na frente da casa da Elizene: x entre -19 e -9, z = 2.6)
    const pebbleX = fx + 0.6;
    const pebbleZ = i % 2 === 0 ? 2.6 : 12.2;
    const isInFrontOfHouse = pebbleZ < 4 && pebbleX >= -19.2 && pebbleX <= -8.8;
    if (!isInFrontOfHouse) {
      const pebble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.11, 0),
        new THREE.MeshStandardMaterial({
          color: flowerColors[(i + 2) % flowerColors.length],
          roughness: 0.55,
        })
      );
      pebble.scale.set(1.2, 0.65, 1.0);
      pebble.position.set(pebbleX, 0.1, pebbleZ);
      scene.add(pebble);
    }
  }

  // Street Lamps
  const createLamp = (x: number, z: number) => {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: '#6d6875', roughness: 0.4, metalness: 0.5 })
    );
    pole.position.y = 1.6;
    pole.castShadow = true;
    lamp.add(pole);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fff3d6',
      emissive: '#ffd166',
      emissiveIntensity: 0.1,
      roughness: 0.2,
    });
    lampBulbs.push(bulbMat);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), bulbMat);
    bulb.position.y = 3.25;
    lamp.add(bulb);

    const pt = new THREE.PointLight('#ffd166', 0, 10, 1.5);
    pt.position.set(0, 3.1, 0);
    lamp.add(pt);
    streetLights.push(pt);

    lamp.position.set(x, 0, z);
    scene.add(lamp);
    colliders.push({
      minX: x - 0.18,
      maxX: x + 0.18,
      minZ: z - 0.18,
      maxZ: z + 0.18,
    });
  };

  // Street lamps positioned safely along the sidewalk; lamp on the other side of the house (-19.5)
  [-19.5, -5, 5, 14].forEach((x) => createLamp(x, 2.0));

  // ==================== LOJA PRINCIPAL (ELIZENE'S BOUTIQUE) ====================
  const shopGroup = new THREE.Group();
  scene.add(shopGroup);

  // Shop Floor
  const shopFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 0.1, 7.6),
    new THREE.MeshStandardMaterial({ color: '#f3d5e5', roughness: 0.6 })
  );
  shopFloor.position.set(0, 0.05, -2.0);
  shopFloor.receiveShadow = true;
  shopGroup.add(shopFloor);

  const wallMat = new THREE.MeshStandardMaterial({ color: '#ffb3c6', roughness: 0.65 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.5 });

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.4, 0.25), wallMat);
  backWall.position.set(0, 1.7, -5.7);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  shopGroup.add(backWall);
  const shopBackCollider = { minX: -4.4, maxX: 4.4, minZ: -6.0, maxZ: -5.4 };
  colliders.push(shopBackCollider);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.4, 7.6), wallMat);
  leftWall.position.set(-4.2, 1.7, -2.0);
  leftWall.castShadow = true;
  shopGroup.add(leftWall);
  const shopLeftCollider = { minX: -4.5, maxX: -3.9, minZ: -5.9, maxZ: 1.9 };
  colliders.push(shopLeftCollider);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.4, 7.6), wallMat);
  rightWall.position.set(4.2, 1.7, -2.0);
  rightWall.castShadow = true;
  shopGroup.add(rightWall);
  const shopRightCollider = { minX: 3.9, maxX: 4.5, minZ: -5.9, maxZ: 1.9 };
  colliders.push(shopRightCollider);

  // Front walls (with wide open doorway in center)
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 0.25), wallMat);
  frontLeft.position.set(-2.9, 1.7, 1.7);
  frontLeft.castShadow = true;
  shopGroup.add(frontLeft);
  colliders.push({ minX: -4.4, maxX: -1.4, minZ: 1.4, maxZ: 2.0 });

  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 0.25), wallMat);
  frontRight.position.set(2.9, 1.7, 1.7);
  frontRight.castShadow = true;
  shopGroup.add(frontRight);
  colliders.push({ minX: 1.4, maxX: 4.4, minZ: 1.4, maxZ: 2.0 });

  // Porta dupla da loja com animação de abertura
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.4 });
  const doorGlassMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
  });

  const shopDoorLeft = new THREE.Group();
  shopDoorLeft.position.set(-1.35, 0, 1.7);
  const dLeftPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.08), doorGlassMat);
  dLeftPanel.position.set(0.65, 1.25, 0);
  const dLeftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8), doorFrameMat);
  dLeftHandle.position.set(1.18, 1.2, 0.06);
  shopDoorLeft.add(dLeftPanel, dLeftHandle);
  shopGroup.add(shopDoorLeft);

  const shopDoorRight = new THREE.Group();
  shopDoorRight.position.set(1.35, 0, 1.7);
  const dRightPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.08), doorGlassMat);
  dRightPanel.position.set(-0.65, 1.25, 0);
  const dRightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8), doorFrameMat);
  dRightHandle.position.set(-1.18, 1.2, 0.06);
  shopDoorRight.add(dRightPanel, dRightHandle);
  shopGroup.add(shopDoorRight);

  // Vitrines organizadas nas janelas frontais da loja (com colisão)
  const vitrineMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.35,
    roughness: 0.15,
  });
  [-2.7, 2.7].forEach((vx, idx) => {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.58, 0.68),
      new THREE.MeshStandardMaterial({ color: '#fff0f3', roughness: 0.5 })
    );
    base.position.set(vx, 0.29, 1.15);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.82, 0.62), vitrineMat);
    glass.position.set(vx, 0.99, 1.15);
    const acc = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: idx === 0 ? '#ff758f' : '#d8c2f0',
        roughness: 0.25,
        metalness: 0.3,
      })
    );
    acc.position.set(vx, 0.88, 1.15);
    shopGroup.add(base, glass, acc);
  });

  // Passadeira central da boutique (alinhada da entrada ao corredor central)
  const aisleRunnerBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.018, 4.9),
    new THREE.MeshStandardMaterial({ color: '#f9c5d1', roughness: 0.88 })
  );
  aisleRunnerBorder.position.set(0, 0.102, -1.45);
  aisleRunnerBorder.receiveShadow = true;
  const aisleRunnerCore = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.022, 4.6),
    new THREE.MeshStandardMaterial({ color: '#fff5f8', roughness: 0.86 })
  );
  aisleRunnerCore.position.set(0, 0.104, -1.45);
  aisleRunnerCore.receiveShadow = true;
  shopGroup.add(aisleRunnerBorder, aisleRunnerCore);

  // Provador (Fitting Room) alinhado na parede direita
  const provadorGroup = new THREE.Group();
  provadorGroup.position.set(3.38, 0, -1.05);
  const provadorBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.05, 1.35),
    new THREE.MeshStandardMaterial({ color: '#ffe5ec', roughness: 0.7 })
  );
  provadorBase.position.set(0.05, 0.09, 0);
  const curtain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 2.25, 16, 1, true, 0, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: '#d8c2f0', roughness: 0.7, side: THREE.DoubleSide })
  );
  curtain.position.y = 1.18;
  curtain.rotation.y = Math.PI * 0.42;
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.8, 0.75),
    new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.08, metalness: 0.85 })
  );
  mirror.position.set(0.62, 1.12, 0);
  provadorGroup.add(provadorBase, curtain, mirror);
  shopGroup.add(provadorGroup);

  // Quadros femininos decorativos nas paredes da loja
  const createFemininePaintingTexture = (
    theme: 'dress' | 'perfume' | 'bag' | 'heels'
  ): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const palettes: Record<typeof theme, { bg1: string; bg2: string; accent: string; soft: string }> = {
        dress: { bg1: '#fff5f8', bg2: '#ffe0ea', accent: '#ff5c8a', soft: '#d8c2f0' },
        perfume: { bg1: '#f8f2ff', bg2: '#eadcfb', accent: '#9d79d6', soft: '#ff8fab' },
        bag: { bg1: '#fffaf0', bg2: '#fde8e9', accent: '#e06d8c', soft: '#98f5e1' },
        heels: { bg1: '#fff4f0', bg2: '#ffe5ec', accent: '#e63975', soft: '#ffd166' },
      };
      const pal = palettes[theme];
      const grad = ctx.createLinearGradient(0, 0, 320, 240);
      grad.addColorStop(0, pal.bg1);
      grad.addColorStop(1, pal.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 240);

      // Moldura interna delicada
      ctx.strokeStyle = '#e9c46a';
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, 292, 212);

      // Flores nos cantos
      const drawFlower = (fx: number, fy: number, col: string) => {
        ctx.fillStyle = col;
        for (let a = 0; a < 5; a++) {
          const ang = (a * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(ang) * 7, fy + Math.sin(ang) * 7, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawFlower(34, 34, pal.soft);
      drawFlower(286, 34, pal.accent);
      drawFlower(34, 206, pal.accent);
      drawFlower(286, 206, pal.soft);

      ctx.save();
      ctx.translate(160, 122);
      if (theme === 'dress') {
        // Vestido de boutique rosa estilizado
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-22, -48);
        ctx.lineTo(22, -48);
        ctx.lineTo(14, -12);
        ctx.lineTo(54, 58);
        ctx.quadraticCurveTo(0, 72, -54, 58);
        ctx.lineTo(-14, -12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff0f3';
        ctx.fillRect(-16, -15, 32, 6);
        ctx.fillStyle = '#6d597a';
        ctx.font = 'bold 16px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.fillText('MODA & CHARME', 0, 82);
      } else if (theme === 'perfume') {
        // Frasco de perfume elegante com laço
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-34, -22, 68, 72, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pal.soft;
        ctx.beginPath();
        ctx.roundRect(-24, -8, 48, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(-12, -38, 24, 16);
        ctx.fillRect(-18, -52, 36, 14);
        ctx.fillStyle = '#6d597a';
        ctx.font = 'bold 15px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESSENCE ROSE', 0, 80);
      } else if (theme === 'bag') {
        // Bolsa matelassê + coração
        ctx.strokeStyle = '#e9c46a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, -24, 24, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.roundRect(-42, -20, 84, 62, 12);
        ctx.fill();
        ctx.fillStyle = '#fff5f8';
        ctx.beginPath();
        ctx.moveTo(-42, -8);
        ctx.lineTo(0, 14);
        ctx.lineTo(42, -8);
        ctx.strokeStyle = '#fff5f8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#e9c46a';
        ctx.beginPath();
        ctx.arc(0, 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6d597a';
        ctx.font = 'bold 15px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.fillText('BELEZA & ESTILO', 0, 80);
      } else {
        // Sapato salto alto feminino e batom
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(-46, 26);
        ctx.quadraticCurveTo(-8, 22, 22, -16);
        ctx.lineTo(42, 4);
        ctx.quadraticCurveTo(8, 44, -46, 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(30, 4, 8, 36);
        // Batom ao lado
        ctx.fillStyle = '#2b2d42';
        ctx.fillRect(-52, -14, 18, 32);
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.moveTo(-50, -14);
        ctx.lineTo(-36, -14);
        ctx.lineTo(-36, -34);
        ctx.lineTo(-50, -26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6d597a';
        ctx.font = 'bold 15px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.fillText('GLAMOUR BOUTIQUE', 0, 80);
      }
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const addShopPainting = (
    theme: 'dress' | 'perfume' | 'bag' | 'heels',
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotY: number
  ) => {
    const frameGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#e9c46a',
      roughness: 0.3,
      metalness: 0.55,
    });
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.04), frameMat);
    outerFrame.castShadow = true;
    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: createFemininePaintingTexture(theme),
        roughness: 0.45,
      })
    );
    artMesh.position.z = 0.022;
    frameGroup.add(outerFrame, artMesh);
    frameGroup.position.set(x, y, z);
    frameGroup.rotation.y = rotY;
    shopGroup.add(frameGroup);
    return frameGroup;
  };

  // Monta os 4 quadros femininos nas paredes internas da loja
  const backPainting1 = addShopPainting('dress', 1.32, 0.92, -0.95, 2.38, -5.55, 0);
  const backPainting2 = addShopPainting('perfume', 0.96, 0.88, 2.35, 2.38, -5.55, 0);
  const shopBackPaintings = [backPainting1, backPainting2];
  addShopPainting('bag', 1.24, 0.86, -4.05, 2.38, -2.62, Math.PI / 2);
  addShopPainting('heels', 1.15, 0.86, 4.05, 2.38, -2.55, -Math.PI / 2);

  // Cute Awning / Signboard
  const awning = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.35, 1.2), trimMat);
  awning.position.set(0, 3.35, 2.0);
  awning.castShadow = true;
  shopGroup.add(awning);

  // Fachada Frontal da Loja com letreiro "ZENE COLLECTION"
  const facadeSignGroup = new THREE.Group();
  facadeSignGroup.position.set(0, 4.18, 2.08);
  const signBacking = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.22, 0.26), trimMat);
  signBacking.castShadow = true;
  const signFaceTex = createFacadeSignTexture();
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(5.68, 0.98),
    new THREE.MeshStandardMaterial({
      map: signFaceTex,
      roughness: 0.4,
      emissive: '#fff0f5',
      emissiveMap: signFaceTex,
      emissiveIntensity: 0.22,
    })
  );
  signFace.position.z = 0.138;
  facadeSignGroup.add(signBacking, signFace);
  shopGroup.add(facadeSignGroup);

  // Pilastras decorativas da fachada da loja
  [-4.15, 4.15].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.4, 0.34), trimMat);
    pillar.position.set(px, 1.7, 1.78);
    pillar.castShadow = true;
    shopGroup.add(pillar);
  });

  // Roof (slightly translucent or open-top friendly, we use a cute pitched roof)
  const roofMat = new THREE.MeshStandardMaterial({ color: '#ffc2d1', roughness: 0.6 });
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 0.25, 8.0),
    roofMat
  );
  roof.position.set(0, 3.55, -2.0);
  roof.castShadow = true;
  shopGroup.add(roof);

  // Shop Interior Lights
  const shopLight = new THREE.PointLight('#fff3d6', 0.4, 12, 1.2);
  shopLight.position.set(0, 3.1, -2.0);
  shopGroup.add(shopLight);
  shopLights.push(shopLight);

  const shopBackLight = new THREE.PointLight('#fff3d6', 0.35, 14, 1.2);
  shopBackLight.position.set(0, 3.1, -4.5);
  shopGroup.add(shopBackLight);
  shopLights.push(shopBackLight);

  const woodTex = createWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Checkout Counter (sem barreira física para andar livremente por toda a loja)
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.76), woodMat);
  counter.position.set(2.35, 0.48, -3.85);
  counter.castShadow = true;
  shopGroup.add(counter);

  const register = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.34, 0.34),
    new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.3 })
  );
  register.position.set(2.35, 1.12, -3.85);
  const scannerPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.05, 0.24),
    new THREE.MeshStandardMaterial({ color: '#2ec4b6', roughness: 0.25 })
  );
  scannerPad.position.set(1.85, 0.98, -3.85);
  const cashierMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.02, 0.85),
    new THREE.MeshStandardMaterial({ color: '#f9c5d1', roughness: 0.85 })
  );
  cashierMat.position.set(2.35, 0.104, -4.85);
  shopGroup.add(register, scannerPad, cashierMat);

  // Indicador visual acima do caixa quando uma cliente aguarda atendimento
  const cashierAlertMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({
      color: '#ffd166',
      emissive: '#f4a261',
      emissiveIntensity: 0.65,
      roughness: 0.25,
    })
  );
  cashierAlertMesh.position.set(2.35, 2.15, -3.85);
  cashierAlertMesh.visible = false;
  shopGroup.add(cashierAlertMesh);

  // Display Shelves organizadas e alinhadas junto às paredes (sem barreiras internas)
  const shelfMat = woodMat;
  const wallShelves: { x: number; z: number; w: number; d: number }[] = [
    { x: -3.55, z: -3.9, w: 0.6, d: 1.7 },   // Parede esquerda fundo
    { x: -3.55, z: -1.35, w: 0.6, d: 1.7 },  // Parede esquerda frente
    { x: -0.95, z: -5.05, w: 1.6, d: 0.6 },  // Parede do fundo
  ];
  wallShelves.forEach(({ x, z, w, d }) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w, 1.3, d), shelfMat);
    shelf.position.set(x, 0.65, z);
    shelf.castShadow = true;
    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.06, 0.08, d + 0.06),
      new THREE.MeshStandardMaterial({ color: '#fff0f3', roughness: 0.5 })
    );
    topTrim.position.set(x, 1.31, z);
    shopGroup.add(shelf, topTrim);
  });

  // Group for dynamic 3D product items on shelves
  const shelfItemsGroup = new THREE.Group();
  shopGroup.add(shelfItemsGroup);

  // ==================== JARDIM ENCANTADOR (RIGHT OF SHOP) ====================
  const gardenFloor = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 0.08, 7.6),
    new THREE.MeshStandardMaterial({ color: '#a3d9a5', roughness: 0.85 })
  );
  gardenFloor.position.set(12.5, 0.04, -2.0);
  gardenFloor.receiveShadow = true;
  scene.add(gardenFloor);

  // Garden Fence
  const fenceMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
  const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.8, 0.15), fenceMat);
  fenceBack.position.set(12.5, 0.4, -5.7);
  scene.add(fenceBack);

  const gardenGate = new THREE.Group();
  const gateBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.15), trimMat);
  gateBar.position.set(12.5, 0.45, 1.7);
  gardenGate.add(gateBar);
  scene.add(gardenGate);

  // ==================== CASA DA ELIZENE (LEFT OF SHOP) ====================
  const houseGroup = new THREE.Group();
  scene.add(houseGroup);

  const houseFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 0.1, 7.2),
    new THREE.MeshStandardMaterial({ color: '#fefae0', roughness: 0.65 })
  );
  houseFloor.position.set(-14.0, 0.05, -2.0);
  houseFloor.receiveShadow = true;
  houseGroup.add(houseFloor);

  const houseWallMat = new THREE.MeshStandardMaterial({ color: '#e2ece9', roughness: 0.7 });
  const hBack = new THREE.Mesh(new THREE.BoxGeometry(8.0, 3.2, 0.25), houseWallMat);
  hBack.position.set(-14.0, 1.6, -5.5);
  hBack.castShadow = true;
  hBack.receiveShadow = true;
  houseGroup.add(hBack);
  colliders.push({ minX: -18.1, maxX: -9.9, minZ: -5.75, maxZ: -5.25 });

  const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 7.2), houseWallMat);
  hLeft.position.set(-18.0, 1.6, -2.0);
  hLeft.castShadow = true;
  hLeft.receiveShadow = true;
  houseGroup.add(hLeft);
  colliders.push({ minX: -18.25, maxX: -17.75, minZ: -5.7, maxZ: 1.75 });

  const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 7.2), houseWallMat);
  hRight.position.set(-10.0, 1.6, -2.0);
  hRight.castShadow = true;
  hRight.receiveShadow = true;
  houseGroup.add(hRight);
  colliders.push({ minX: -10.25, maxX: -9.75, minZ: -5.7, maxZ: 1.75 });

  // Parede da frente da Casa da Elizene (voltada para a rua, com vão central para porta de vidro)
  const hFrontLeft = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 0.25), houseWallMat);
  hFrontLeft.position.set(-16.5, 1.6, 1.6);
  hFrontLeft.castShadow = true;
  hFrontLeft.receiveShadow = true;
  houseGroup.add(hFrontLeft);
  colliders.push({ minX: -18.1, maxX: -15.0, minZ: 1.4, maxZ: 1.82 });

  const hFrontRight = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 0.25), houseWallMat);
  hFrontRight.position.set(-11.5, 1.6, 1.6);
  hFrontRight.castShadow = true;
  hFrontRight.receiveShadow = true;
  houseGroup.add(hFrontRight);
  colliders.push({ minX: -13.0, maxX: -9.9, minZ: 1.4, maxZ: 1.82 });

  const hFrontLintel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 0.25), houseWallMat);
  hFrontLintel.position.set(-14.0, 2.775, 1.6);
  hFrontLintel.castShadow = true;
  houseGroup.add(hFrontLintel);

  // Janelas frontais da Casa da Elizene
  const hWindowFrameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
  const hWindowGlassMat = new THREE.MeshStandardMaterial({
    color: '#dff4ff',
    emissive: '#ffe6a7',
    emissiveIntensity: 0,
    roughness: 0.15,
    metalness: 0.1,
  });
  windowMats.push(hWindowGlassMat);
  [-16.5, -11.5].forEach((wx) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.05, 0.3), hWindowFrameMat);
    frame.position.set(wx, 1.65, 1.6);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.84, 0.32), hWindowGlassMat);
    pane.position.set(wx, 1.65, 1.6);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.86, 0.34), hWindowFrameMat);
    mullion.position.set(wx, 1.65, 1.6);
    houseGroup.add(frame, pane, mullion);
  });

  const { map: roofTileMap, bumpMap: roofTileBump } = createRoofTileTextures();
  const hRoofMat = new THREE.MeshStandardMaterial({
    map: roofTileMap,
    bumpMap: roofTileBump,
    bumpScale: 0.045,
    color: '#ffffff',
    roughness: 0.72,
    metalness: 0.04,
  });
  const hRoof = new THREE.Mesh(
    new THREE.ConeGeometry(6.3, 2.05, 4),
    hRoofMat
  );
  hRoof.rotation.y = Math.PI / 4;
  hRoof.position.set(-14.0, 4.22, -2.0);
  hRoof.castShadow = true;
  hRoof.receiveShadow = true;
  houseGroup.add(hRoof);

  // Borda/beiral vermelho escuro e chaminé do telhado da casa
  const hRoofTrim = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 0.16, 7.8),
    new THREE.MeshStandardMaterial({ color: '#9b1c1c', roughness: 0.68 })
  );
  hRoofTrim.position.set(-14.0, 3.22, -2.0);
  hRoofTrim.castShadow = true;
  houseGroup.add(hRoofTrim);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.1, 0.65),
    new THREE.MeshStandardMaterial({ color: '#a4161a', roughness: 0.8 })
  );
  chimney.position.set(-11.8, 4.5, -3.6);
  chimney.castShadow = true;
  houseGroup.add(chimney);

  // Porta dupla de vidro da Casa da Elizene
  const hDoorFrameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 });
  const hDoorGlassMat = new THREE.MeshStandardMaterial({
    color: '#dff4ff',
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    metalness: 0.15,
  });
  const hHandleMat = new THREE.MeshStandardMaterial({ color: '#e9c46a', roughness: 0.25, metalness: 0.75 });

  const buildHouseGlassLeaf = (hingeX: number, dir: 1 | -1) => {
    const leaf = new THREE.Group();
    leaf.position.set(hingeX, 0, 1.6);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.24, 0.05), hDoorGlassMat);
    glass.position.set(dir * 0.49, 1.18, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.08), hDoorFrameMat);
    topBar.position.set(dir * 0.49, 2.31, 0);
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.1, 0.08), hDoorFrameMat);
    botBar.position.set(dir * 0.49, 0.05, 0);
    const outerStile = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.35, 0.08), hDoorFrameMat);
    outerStile.position.set(dir * 0.035, 1.175, 0);
    const innerStile = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.08), hDoorFrameMat);
    innerStile.position.set(dir * 0.95, 1.175, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8), hHandleMat);
    handle.position.set(dir * 0.88, 1.12, 0.07);
    leaf.add(glass, topBar, botBar, outerStile, innerStile, handle);
    houseGroup.add(leaf);
    return leaf;
  };

  const houseDoorLeft = buildHouseGlassLeaf(-15.0, 1);
  const houseDoorRight = buildHouseGlassLeaf(-13.0, -1);

  // Plaquinha de cadeado na porta enquanto a casa estiver bloqueada
  const houseDoor = new THREE.Group();
  const lockPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.34, 0.06),
    new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.45 })
  );
  lockPlate.position.set(-14.0, 1.28, 1.72);
  houseDoor.add(lockPlate);
  houseGroup.add(houseDoor);

  // Tapete na frente da porta de vidro da casa
  const houseFrontRug = new THREE.Group();
  houseFrontRug.position.set(-14.0, 0.095, 2.38);
  const rugBorder = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.03, 1.04),
    new THREE.MeshStandardMaterial({ color: '#d8c2f0', roughness: 0.85 })
  );
  rugBorder.receiveShadow = true;
  const rugCenter = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.036, 0.82),
    new THREE.MeshStandardMaterial({ color: '#ffc2d1', roughness: 0.85 })
  );
  rugCenter.receiveShadow = true;
  const rugStripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.04, 0.26),
    new THREE.MeshStandardMaterial({ color: '#fff3d6', roughness: 0.8 })
  );
  rugStripe.receiveShadow = true;
  houseFrontRug.add(rugBorder, rugCenter, rugStripe);
  houseGroup.add(houseFrontRug);

  // ==================== CÉU 3D, SOL, LUA, ESTRELAS, NUVENS & CHUVA ====================
  const skyUniforms = {
    topColor: { value: new THREE.Color('#6ea8d6') },
    horizonColor: { value: new THREE.Color('#a4cbe8') },
    bottomColor: { value: new THREE.Color('#7fb692') },
    brightness: { value: 0.92 },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform float brightness;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        vec3 col = h >= 0.0
          ? mix(horizonColor, topColor, pow(clamp(h, 0.0, 1.0), 0.58))
          : mix(horizonColor, bottomColor, pow(clamp(-h * 2.5, 0.0, 1.0), 0.7));
        gl_FragColor = vec4(col * brightness, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(135, 32, 20), skyMat);
  skyDome.renderOrder = -10;
  scene.add(skyDome);

  // Sol 3D
  const sunGroup = new THREE.Group();
  const sunCoreMat = new THREE.MeshBasicMaterial({
    color: '#ffe58f',
    transparent: true,
    opacity: 1,
    fog: false,
  });
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: '#ffd166',
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    fog: false,
  });
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(3.1, 24, 24), sunCoreMat);
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(4.8, 24, 24), sunGlowMat);
  sunGroup.add(sunCore, sunGlow);
  scene.add(sunGroup);

  // Lua 3D
  const moonGroup = new THREE.Group();
  const moonCoreMat = new THREE.MeshBasicMaterial({
    color: '#edf2ff',
    transparent: true,
    opacity: 0,
    fog: false,
  });
  const moonGlowMat = new THREE.MeshBasicMaterial({
    color: '#a9c6ff',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const moonCore = new THREE.Mesh(new THREE.SphereGeometry(2.3, 24, 24), moonCoreMat);
  const moonGlow = new THREE.Mesh(new THREE.SphereGeometry(3.6, 24, 24), moonGlowMat);
  const craterMat = new THREE.MeshBasicMaterial({
    color: '#cbd8f0',
    transparent: true,
    opacity: 0.65,
    fog: false,
  });
  const crater1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), craterMat);
  crater1.position.set(0.9, 0.55, 1.82);
  const crater2 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), craterMat);
  crater2.position.set(-0.75, -0.45, 1.98);
  moonGroup.add(moonCore, moonGlow, crater1, crater2);
  scene.add(moonGroup);

  // Estrelas Noturnas
  const starCount = 220;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.15 + Math.random() * 0.85); // Apenas acima do horizonte
    const r = 116 + Math.random() * 6;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMat = new THREE.PointsMaterial({
    color: '#fffbe6',
    size: 0.75,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const starsPoints = new THREE.Points(starsGeo, starsMat);
  scene.add(starsPoints);

  // Nuvens 3D
  const cloudsGroup = new THREE.Group();
  const cloudMats = [
    new THREE.MeshStandardMaterial({ color: '#f4f7fb', roughness: 0.95, transparent: true, opacity: 0.88 }),
    new THREE.MeshStandardMaterial({ color: '#eaeff5', roughness: 0.95, transparent: true, opacity: 0.85 }),
  ];
  for (let c = 0; c < 11; c++) {
    const cluster = new THREE.Group();
    const mat = cloudMats[c % cloudMats.length];
    const puffOffsets = [
      [0, 0, 0, 1.45],
      [-1.3, -0.2, 0.1, 1.05],
      [1.35, -0.18, -0.15, 1.1],
      [0.4, 0.45, 0.25, 1.0],
      [-0.5, 0.35, -0.2, 0.95],
    ];
    puffOffsets.forEach(([ox, oy, oz, rad]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), mat);
      puff.position.set(ox, oy, oz);
      puff.scale.set(1.2, 0.72, 0.95);
      cluster.add(puff);
    });
    const baseScale = 1.2 + (c % 3) * 0.45;
    cluster.scale.setScalar(baseScale);
    cluster.position.set(-48 + c * 9.5, 22 + (c % 4) * 2.4, -28 + ((c * 13) % 42));
    cluster.userData.speed = 0.45 + (c % 3) * 0.22;
    cluster.userData.baseScale = baseScale;
    cloudsGroup.add(cluster);
  }
  scene.add(cloudsGroup);

  // Partículas de Chuva (CanvasTexture procedural)
  const rainCanvas = document.createElement('canvas');
  rainCanvas.width = 16;
  rainCanvas.height = 64;
  const rctx = rainCanvas.getContext('2d');
  if (rctx) {
    const grad = rctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, 'rgba(207, 232, 255, 0)');
    grad.addColorStop(0.35, 'rgba(207, 232, 255, 0.75)');
    grad.addColorStop(1, 'rgba(225, 242, 255, 0.95)');
    rctx.fillStyle = grad;
    rctx.fillRect(6, 0, 4, 64);
  }
  const rainTex = new THREE.CanvasTexture(rainCanvas);
  rainTex.colorSpace = THREE.SRGBColorSpace;

  const rainCount = 1100;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 44;
    rainPositions[i * 3 + 1] = Math.random() * 20;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 44;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    map: rainTex,
    color: '#d8ecff',
    size: 0.65,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.frustumCulled = false;
  rainPoints.visible = false;
  scene.add(rainPoints);

  // Dynamic Decorations Group
  const decorationsGroup = new THREE.Group();
  scene.add(decorationsGroup);

  return {
    streetLights,
    shopLights,
    lampBulbs,
    windowMats,
    shelfItemsGroup,
    decorationsGroup,
    shopGroup,
    shopFloor,
    shopBackWall: backWall,
    shopLeftWall: leftWall,
    shopRightWall: rightWall,
    shopRoof: roof,
    shopBackPaintings,
    shopBackLight,
    shopBackCollider,
    shopLeftCollider,
    shopRightCollider,
    gardenGate,
    houseDoor,
    houseDoorLeft,
    houseDoorRight,
    shopDoorLeft,
    shopDoorRight,
    shopWallMat: wallMat,
    houseWallMat,
    awningMat: trimMat,
    roofMat,
    skyDome,
    skyUniforms,
    sunGroup,
    sunCoreMat,
    sunGlowMat,
    moonGroup,
    moonCoreMat,
    moonGlowMat,
    starsMat,
    cloudsGroup,
    cloudMats,
    rainPoints,
    rainPositions,
    rainMat,
    benches,
    cashierAlertMesh,
    colliders,
  };
}

export function syncShelfProducts(group: THREE.Group, products: Product[]) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  const positions: [number, number, number][] = [
    [-3.55, 1.46, -4.35],
    [-3.55, 1.46, -3.45],
    [-3.55, 1.46, -1.8],
    [-3.55, 1.46, -0.9],
    [-1.35, 1.46, -5.05],
    [-0.55, 1.46, -5.05],
    [-3.55, 1.46, -3.9],
    [-0.95, 1.46, -5.05],
  ];

  products.forEach((prod, idx) => {
    if (prod.stock <= 0) return;
    const pos = positions[idx % positions.length];
    const itemGroup = new THREE.Group();
    const kind = idx % 3;
    const bodyMat = new THREE.MeshStandardMaterial({ color: prod.color, roughness: 0.3 });
    const capMat = new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.25, metalness: 0.7 });

    if (kind === 0) {
      // Perfume
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.2, 12), bodyMat);
      bottle.position.y = 0.1;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), capMat);
      neck.position.y = 0.22;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), capMat);
      cap.position.y = 0.27;
      itemGroup.add(bottle, neck, cap);
    } else if (kind === 1) {
      // Creme de cabelo (pote)
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.14, 14), bodyMat);
      jar.position.y = 0.07;
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.125, 0.125, 0.04, 14),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })
      );
      lid.position.y = 0.16;
      itemGroup.add(jar, lid);
    } else {
      // Kit Shampoo e Condicionador
      const shampoo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 10), bodyMat);
      shampoo.position.set(-0.07, 0.12, 0);
      const sCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 8), capMat);
      sCap.position.set(-0.07, 0.26, 0);

      const cond = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.21, 10),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 })
      );
      cond.position.set(0.07, 0.105, 0);
      const cCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 8), bodyMat);
      cCap.position.set(0.07, 0.23, 0);
      itemGroup.add(shampoo, sCap, cond, cCap);
    }

    itemGroup.position.set(pos[0], pos[1] - 0.12, pos[2]);
    group.add(itemGroup);
  });
}

export function syncDecorations(group: THREE.Group, decorations: DecorationItem[]) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  decorations.forEach((dec) => {
    if (!dec.owned || !dec.placed) return;
    const mat = new THREE.MeshStandardMaterial({ color: dec.color, roughness: 0.55 });
    let mesh: THREE.Object3D;

    if (dec.category === 'Tapetes') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.04, 24), mat);
    } else if (dec.category === 'Sofás' || dec.id.includes('sofa')) {
      const sofa = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), mat);
      seat.position.y = 0.25;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.2), mat);
      back.position.set(0, 0.6, -0.3);
      sofa.add(seat, back);
      mesh = sofa;
    } else if (dec.category === 'Plantas') {
      const plant = new THREE.Group();
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.18, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })
      );
      pot.position.y = 0.2;
      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), mat);
      leaves.position.y = 0.6;
      plant.add(pot, leaves);
      mesh = plant;
    } else if (dec.category === 'Luminárias') {
      const lamp = new THREE.Group();
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.15, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.3, metalness: 0.6 })
      );
      stand.position.y = 0.7;
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.35, 12), mat);
      shade.position.y = 1.45;
      lamp.add(stand, shade);
      mesh = lamp;
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), mat);
      mesh.position.y = 0.25;
    }

    mesh.position.set(dec.position[0], dec.position[1], dec.position[2]);
    group.add(mesh);
  });
}

export interface DeliveryTruckRig {
  root: THREE.Group;
  wheels: THREE.Group[];
  cargoParcel: THREE.Group;
}

function createTruckLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff8fb';
    ctx.fillRect(0, 0, 512, 192);
    ctx.fillStyle = '#ff758f';
    ctx.fillRect(0, 146, 512, 46);
    ctx.strokeStyle = '#ff758f';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 172);
    ctx.fillStyle = '#5c3c6e';
    ctx.font = 'bold 48px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZENE ENTREGAS', 256, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('ESTOQUE BOUTIQUE', 256, 169);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildDeliveryTruck(): DeliveryTruckRig {
  const root = new THREE.Group();
  const wheels: THREE.Group[] = [];

  const chassisMat = new THREE.MeshStandardMaterial({ color: '#2b2d42', roughness: 0.65, metalness: 0.35 });
  const cabMat = new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.4, metalness: 0.12 });
  const cargoMat = new THREE.MeshStandardMaterial({ color: '#fff8fb', roughness: 0.5, metalness: 0.05 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#bde0fe', roughness: 0.15, metalness: 0.25 });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1f2421', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#dee2e6', roughness: 0.3, metalness: 0.75 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: '#fff3d6',
    emissive: '#ffd166',
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  // Chassi
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.24, 1.56), chassisMat);
  chassis.position.set(0, 0.44, 0);
  chassis.castShadow = true;
  root.add(chassis);

  // Cabine dianteira (+X)
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.25, 1.52), cabMat);
  cabBody.position.set(1.42, 1.15, 0);
  cabBody.castShadow = true;
  root.add(cabBody);

  const cabNose = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.72, 1.48), cabMat);
  cabNose.position.set(2.15, 0.88, 0);
  cabNose.castShadow = true;
  root.add(cabNose);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 1.32), glassMat);
  windshield.position.set(2.06, 1.42, 0);
  windshield.rotation.z = 0.12;
  root.add(windshield);

  // Janelas laterais da cabine
  [-0.77, 0.77].forEach((wz) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.04), glassMat);
    sideWin.position.set(1.48, 1.4, wz);
    root.add(sideWin);
  });

  // Faróis e para-choque
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 1.58), chassisMat);
  bumper.position.set(2.38, 0.56, 0);
  root.add(bumper);
  [-0.5, 0.5].forEach((hz) => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.24), lightMat);
    headlight.position.set(2.38, 0.82, hz);
    root.add(headlight);
  });

  // Baú de carga (-X) com letreiro ZENE ENTREGAS
  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.72, 1.62), cargoMat);
  cargoBox.position.set(-0.62, 1.42, 0);
  cargoBox.castShadow = true;
  cargoBox.receiveShadow = true;
  root.add(cargoBox);

  const logoTex = createTruckLogoTexture();
  const logoMat = new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.45 });
  const logoFront = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.9), logoMat);
  logoFront.position.set(-0.62, 1.46, 0.82);
  const logoBack = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.9), logoMat);
  logoBack.position.set(-0.62, 1.46, -0.82);
  logoBack.rotation.y = Math.PI;
  root.add(logoFront, logoBack);

  // 4 Rodas giratórias
  const wheelCoords: [number, number][] = [
    [-1.45, 0.78],
    [-1.45, -0.78],
    [1.45, 0.78],
    [1.45, -0.78],
  ];
  wheelCoords.forEach(([wx, wz]) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, 0.36, wz);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12), rimMat);
    rim.rotation.x = Math.PI / 2;
    wGroup.add(tire, rim);
    root.add(wGroup);
    wheels.push(wGroup);
  });

  // Pilha de caixas de entrega (animada descarregando na calçada até a loja)
  const cargoParcel = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.75 });
  const tapeMat = new THREE.MeshStandardMaterial({ color: '#ff758f', roughness: 0.4 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.55), boxMat);
  b1.position.y = 0.21;
  b1.castShadow = true;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.34, 0.45), boxMat);
  b2.position.set(0.04, 0.59, -0.02);
  b2.castShadow = true;
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.08, 0.12), tapeMat);
  ribbon.position.y = 0.24;
  cargoParcel.add(b1, b2, ribbon);
  cargoParcel.visible = false;

  return { root, wheels, cargoParcel };
}
