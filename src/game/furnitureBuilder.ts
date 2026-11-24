import * as THREE from 'three';
import { FurnitureMaterialType, OwnedFurnitureItem } from '../data/furnitureCatalog';

export function buildFurnitureMesh(
  modelType: string,
  color: string,
  materialType: FurnitureMaterialType = 'pastel'
): THREE.Group {
  const group = new THREE.Group();
  const roughness = materialType === 'glossy' ? 0.2 : materialType === 'wood' ? 0.75 : 0.55;
  const metalness = materialType === 'glossy' ? 0.25 : 0.05;

  const mainMat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#8d5b4c', roughness: 0.75 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.25, metalness: 0.7 });

  if (modelType === 'sofa') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.75), mainMat);
    seat.position.y = 0.24;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 0.18), mainMat);
    back.position.set(0, 0.55, -0.28);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.75), mainMat);
    armL.position.set(-0.67, 0.4, 0);
    const armR = armL.clone();
    armR.position.x = 0.67;
    group.add(seat, back, armL, armR);
  } else if (modelType === 'armchair' || modelType === 'chair') {
    const w = modelType === 'armchair' ? 0.72 : 0.48;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, w), mainMat);
    seat.position.y = 0.42;
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.48, 0.1), mainMat);
    back.position.set(0, 0.68, -w / 2 + 0.05);
    group.add(seat, back);
    [-w / 2 + 0.06, w / 2 - 0.06].forEach((lx) => {
      [-w / 2 + 0.06, w / 2 - 0.06].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), woodMat);
        leg.position.set(lx, 0.21, lz);
        group.add(leg);
      });
    });
  } else if (modelType === 'bench') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.5), mainMat);
    seat.position.y = 0.42;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 0.08), mainMat);
    back.position.set(0, 0.65, -0.21);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.45), woodMat);
    legL.position.set(-0.58, 0.21, 0);
    const legR = legL.clone();
    legR.position.x = 0.58;
    group.add(seat, back, legL, legR);
  } else if (modelType === 'table' || modelType === 'counter') {
    const h = modelType === 'counter' ? 0.9 : 0.72;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.75), mainMat);
    top.position.y = h;
    group.add(top);
    if (modelType === 'counter') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.14, h - 0.04, 0.68), mainMat);
      base.position.y = (h - 0.04) / 2;
      group.add(base);
    } else {
      [-0.5, 0.5].forEach((lx) => {
        [-0.28, 0.28].forEach((lz) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 8), woodMat);
          leg.position.set(lx, h / 2, lz);
          group.add(leg);
        });
      });
    }
  } else if (modelType === 'bed' || modelType === 'bed_double') {
    const w = modelType === 'bed_double' ? 1.5 : 1.0;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, 1.85), woodMat);
    frame.position.y = 0.18;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.18, 1.76), whiteMat);
    mattress.position.y = 0.36;
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.19, 1.15), mainMat);
    blanket.position.set(0, 0.365, 0.3);
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(w, 0.75, 0.1), mainMat);
    headboard.position.set(0, 0.45, -0.88);
    group.add(frame, mattress, blanket, headboard);
  } else if (modelType === 'wardrobe' || modelType === 'fridge') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.58), mainMat);
    body.position.y = 0.925;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.05), goldMat);
    handle.position.set(0.12, 1.0, 0.31);
    group.add(body, handle);
  } else if (modelType === 'shelf') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.4), mainMat);
    frame.position.y = 0.75;
    group.add(frame);
  } else if (modelType === 'vanity' || modelType === 'nightstand') {
    const w = modelType === 'vanity' ? 1.05 : 0.5;
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.72, 0.48), mainMat);
    base.position.y = 0.36;
    group.add(base);
    if (modelType === 'vanity') {
      const mirror = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.05, 18),
        new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.1, metalness: 0.85 })
      );
      mirror.rotation.x = Math.PI / 2;
      mirror.position.set(0, 1.08, -0.18);
      group.add(mirror);
    }
  } else if (modelType === 'tv') {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.42), woodMat);
    stand.position.y = 0.225;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.06), mainMat);
    screen.position.set(0, 0.85, 0);
    group.add(stand, screen);
  } else if (modelType === 'stove' || modelType === 'sink') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.6), mainMat);
    body.position.y = 0.425;
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.05, 0.62),
      new THREE.MeshStandardMaterial({ color: '#adb5bd', roughness: 0.3, metalness: 0.6 })
    );
    top.position.y = 0.86;
    group.add(body, top);
  } else if (modelType === 'bathtub') {
    const tub = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.78), mainMat);
    tub.position.y = 0.275;
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.05, 0.62),
      new THREE.MeshStandardMaterial({ color: '#90e0ef', roughness: 0.15 })
    );
    water.position.y = 0.54;
    group.add(tub, water);
  } else if (modelType === 'shower') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), whiteMat);
    base.position.y = 0.06;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 1.9, 0.04),
      new THREE.MeshStandardMaterial({ color: '#caf0f8', transparent: true, opacity: 0.4 })
    );
    glass.position.set(0, 1.0, 0.42);
    group.add(base, glass);
  } else if (modelType === 'rug') {
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.03, 24), mainMat);
    rug.position.y = 0.015;
    group.add(rug);
  } else if (modelType === 'lamp') {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.14, 1.35, 8), goldMat);
    stand.position.y = 0.675;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 12), mainMat);
    shade.position.y = 1.42;
    group.add(stand, shade);
  } else if (modelType === 'mirror') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.55, 0.08), mainMat);
    frame.position.y = 0.85;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 1.4, 0.09),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.08, metalness: 0.85 })
    );
    glass.position.y = 0.85;
    group.add(frame, glass);
  } else if (modelType === 'plant' || modelType === 'flower_patch') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 12), whiteMat);
    pot.position.y = 0.18;
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), mainMat);
    foliage.position.y = 0.52;
    group.add(pot, foliage);
  } else if (modelType === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.1, 8), woodMat);
    trunk.position.y = 0.55;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), mainMat);
    crown.position.y = 1.4;
    group.add(trunk, crown);
  } else if (modelType === 'bush') {
    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), mainMat);
    b1.position.y = 0.32;
    group.add(b1);
  } else if (modelType === 'fountain') {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.35, 18), mainMat);
    basin.position.y = 0.175;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.85, 12), mainMat);
    pillar.position.y = 0.6;
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.05, 18),
      new THREE.MeshStandardMaterial({ color: '#90e0ef', roughness: 0.15 })
    );
    water.position.y = 0.35;
    group.add(basin, pillar, water);
  } else if (modelType === 'swing') {
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), woodMat);
    pL.position.set(-0.65, 0.85, 0);
    const pR = pL.clone();
    pR.position.x = 0.65;
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), woodMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = 1.7;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.42), mainMat);
    seat.position.y = 0.55;
    group.add(pL, pR, topBar, seat);
  } else if (modelType === 'stones') {
    [-0.18, 0.15, 0].forEach((sx, i) => {
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 - i * 0.02, 0), mainMat);
      st.scale.set(1.2, 0.6, 1);
      st.position.set(sx, 0.08, i === 2 ? 0.18 : 0);
      group.add(st);
    });
  } else if (modelType === 'sign') {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), woodMat);
    post.position.y = 0.55;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 0.06), mainMat);
    board.position.y = 1.15;
    group.add(post, board);
  } else {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mainMat);
    box.position.y = 0.3;
    group.add(box);
  }

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

export interface FurnitureCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function getFurnitureCollider(item: OwnedFurnitureItem): FurnitureCollider | null {
  if (!item.placed) return null;
  // Tapetes e pedras decorativas no chão permitem passagem por cima
  if (item.modelType === 'rug' || item.modelType === 'stones') return null;

  let hw = 0.35;
  let hd = 0.35;

  switch (item.modelType) {
    case 'sofa':
      hw = 0.76;
      hd = 0.38;
      break;
    case 'armchair':
      hw = 0.37;
      hd = 0.37;
      break;
    case 'chair':
      hw = 0.25;
      hd = 0.25;
      break;
    case 'bench':
      hw = 0.71;
      hd = 0.26;
      break;
    case 'table':
    case 'counter':
      hw = 0.61;
      hd = 0.38;
      break;
    case 'bed':
      hw = 0.52;
      hd = 0.93;
      break;
    case 'bed_double':
      hw = 0.76;
      hd = 0.93;
      break;
    case 'wardrobe':
    case 'fridge':
      hw = 0.48;
      hd = 0.3;
      break;
    case 'shelf':
      hw = 0.56;
      hd = 0.22;
      break;
    case 'vanity':
      hw = 0.53;
      hd = 0.25;
      break;
    case 'nightstand':
      hw = 0.26;
      hd = 0.25;
      break;
    case 'tv':
      hw = 0.61;
      hd = 0.22;
      break;
    case 'stove':
    case 'sink':
      hw = 0.44;
      hd = 0.32;
      break;
    case 'bathtub':
      hw = 0.76;
      hd = 0.4;
      break;
    case 'shower':
      hw = 0.46;
      hd = 0.46;
      break;
    case 'lamp':
      hw = 0.22;
      hd = 0.22;
      break;
    case 'mirror':
      hw = 0.35;
      hd = 0.14;
      break;
    case 'plant':
    case 'flower_patch':
    case 'bush':
      hw = 0.28;
      hd = 0.28;
      break;
    case 'tree':
      hw = 0.36;
      hd = 0.36;
      break;
    case 'fountain':
      hw = 0.88;
      hd = 0.88;
      break;
    case 'swing':
      hw = 0.7;
      hd = 0.3;
      break;
    case 'sign':
      hw = 0.38;
      hd = 0.14;
      break;
    default:
      hw = 0.32;
      hd = 0.32;
      break;
  }

  const rot = item.rotationY || 0;
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const rx = c * hw + s * hd;
  const rz = s * hw + c * hd;

  const [x, , z] = item.position;
  return {
    minX: x - rx,
    maxX: x + rx,
    minZ: z - rz,
    maxZ: z + rz,
  };
}

export function syncPlacedFurniture(group: THREE.Group, items: OwnedFurnitureItem[]) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  items.forEach((item) => {
    if (!item.placed) return;
    const mesh = buildFurnitureMesh(item.modelType, item.color, item.materialType);
    mesh.position.set(item.position[0], item.position[1], item.position[2]);
    mesh.rotation.y = item.rotationY;
    group.add(mesh);
  });
}
