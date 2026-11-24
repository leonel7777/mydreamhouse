import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CheckoutItem,
  CheckoutSession,
  ElizeneCustomization,
  GameState,
  WeatherType,
} from '../types/game';
import {
  animateCharacter,
  buildCharacter,
  CharacterAnimState,
  CharacterRig,
} from './characterBuilder';
import {
  buildDeliveryTruck,
  buildNeighborhood,
  DeliveryTruckRig,
  syncDecorations,
  syncShelfProducts,
  WorldRefs,
} from './worldBuilder';
import { buildFurnitureMesh, getFurnitureCollider, syncPlacedFurniture } from './furnitureBuilder';
import { FIXED_FURNITURE_SPOTS, OwnedFurnitureItem } from '../data/furnitureCatalog';
import { soundEngine } from '../audio/soundEngine';

interface NpcActor {
  rig: CharacterRig;
  state: 'stroll' | 'entering' | 'browsing' | 'checkout' | 'exiting';
  target: THREE.Vector3;
  timer: number;
  chosenProductId?: string;
  chosenItems?: CheckoutItem[];
  awaitingMinigame?: boolean;
  checkoutOrder?: number;
  stuckTime?: number;
  prevX?: number;
  prevZ?: number;
}

interface EmployeeActor {
  id: string;
  role: 'cashier' | 'organizer' | 'cleaner' | 'guard';
  rig: CharacterRig;
  target: THREE.Vector3;
  timer: number;
  actionTimer: number;
  stuckTime?: number;
  prevX?: number;
  prevZ?: number;
}

interface ThiefActor {
  id: string;
  rig: CharacterRig;
  state: 'entering' | 'stealing' | 'fleeing' | 'blocked_flee';
  target: THREE.Vector3;
  timer: number;
  stolenCount: number;
  maxSteal: number;
  lootMoney: number;
  stolenProductIds: string[];
  hp: number;
  hitStunTimer: number;
  stuckTime?: number;
  prevX?: number;
  prevZ?: number;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private world: WorldRefs;

  private playerRig: CharacterRig;
  private playerPos = new THREE.Vector3(0, 0, 4.2);
  private playerVelY = 0;
  private playerYaw = Math.PI;
  private isGrounded = true;
  private playerAnim: CharacterAnimState = 'idle';
  private emoteTimer = 0;

  private camYaw = 0;
  private camPitch = 0.42;
  private camDist = 7.5;
  private cameraRaycaster = new THREE.Raycaster();
  private isDragging = false;
  private lastMouse = { x: 0, y: 0 };

  private keys = new Set<string>();
  private npcs: NpcActor[] = [];
  private employees: EmployeeActor[] = [];
  private thieves: ThiefActor[] = [];
  private thiefSpawnTimer = 10;
  private waitingAlertSent = false;
  private nextCheckoutOrder = 1;
  private deliveryTruck: DeliveryTruckRig;
  private truckAnim: {
    active: boolean;
    phase: 'arriving' | 'unloading' | 'leaving';
    x: number;
    speed: number;
    unloadTimer: number;
    pendingLabel: string | null;
    queuedLabel: string | null;
  } = {
    active: false,
    phase: 'arriving',
    x: -34,
    speed: 0,
    unloadTimer: 0,
    pendingLabel: null,
    queuedLabel: null,
  };
  private clock = new THREE.Clock();
  private elapsed = 0;
  private currentTimeMinutes = 480;
  private frameId = 0;
  private isSoftwareGl = false;
  private disposed = false;

  private getState: () => GameState;
  private onSale: (productId: string, amount: number) => void;
  private onTimeTick: (newTimeMinutes: number, newDay: boolean) => void;
  private onInteractPrompt: (prompt: string | null) => void;
  private onInteractAction: (action: string) => void;
  private onPlaceFurniture?: (instanceId: string, pos: [number, number, number], rotY: number) => void;
  private onCancelPlacement?: () => void;
  private onPlacementStatus?: (status: { valid: boolean; lockedToSpot: boolean; reason: string | null }) => void;
  private onWeatherChange?: (weather: WeatherType) => void;
  private onTheftItem?: (productId: string, productName: string) => void;
  private onRestoreStolenItems?: (productIds: string[]) => void;
  private onCatchThief?: (rewardAmount: number, stolenCount: number) => void;
  private onStartCheckoutMinigame?: (session: CheckoutSession) => void;
  private onAlert?: (message: string) => void;
  private inputPaused = false;

  private weather: WeatherType = 'sunny';
  private weatherCycleIdx = 0;
  private weatherTimer = 45;
  private cloudiness = 0;
  private raininess = 0;

  private sittingBench: { seatPos: THREE.Vector3; standPos: THREE.Vector3; yaw: number } | null = null;
  private pendingBench: { seatPos: THREE.Vector3; yaw: number } | null = null;

  private placedFurnitureGroup = new THREE.Group();
  private placementItem: OwnedFurnitureItem | null = null;
  private placementGhost: THREE.Group | null = null;
  private placementRing: THREE.Mesh | null = null;
  private placementValid = false;
  private placementRotY = 0;
  private placementLockedToSpot = false;
  private snapToGrid = false;
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private mouseNdc = new THREE.Vector2();

  constructor(
    container: HTMLElement,
    getState: () => GameState,
    callbacks: {
      onSale: (productId: string, amount: number) => void;
      onTimeTick: (newTimeMinutes: number, newDay: boolean) => void;
      onInteractPrompt: (prompt: string | null) => void;
      onInteractAction: (action: string) => void;
      onPlaceFurniture?: (instanceId: string, pos: [number, number, number], rotY: number) => void;
      onCancelPlacement?: () => void;
      onPlacementStatus?: (status: { valid: boolean; lockedToSpot: boolean; reason: string | null }) => void;
      onWeatherChange?: (weather: WeatherType) => void;
      onTheftItem?: (productId: string, productName: string) => void;
      onRestoreStolenItems?: (productIds: string[]) => void;
      onCatchThief?: (rewardAmount: number, stolenCount: number) => void;
      onStartCheckoutMinigame?: (session: CheckoutSession) => void;
      onAlert?: (message: string) => void;
    }
  ) {
    this.container = container;
    this.getState = getState;
    this.onSale = callbacks.onSale;
    this.onTimeTick = callbacks.onTimeTick;
    this.onInteractPrompt = callbacks.onInteractPrompt;
    this.onInteractAction = callbacks.onInteractAction;
    this.onPlaceFurniture = callbacks.onPlaceFurniture;
    this.onCancelPlacement = callbacks.onCancelPlacement;
    this.onPlacementStatus = callbacks.onPlacementStatus;
    this.onWeatherChange = callbacks.onWeatherChange;
    this.onTheftItem = callbacks.onTheftItem;
    this.onRestoreStolenItems = callbacks.onRestoreStolenItems;
    this.onCatchThief = callbacks.onCatchThief;
    this.onStartCheckoutMinigame = callbacks.onStartCheckoutMinigame;
    this.onAlert = callbacks.onAlert;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Brilho do céu/exposição reduzido sutilmente para evitar estouro de luz
    this.renderer.toneMappingExposure = 0.94;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#98bfe2');
    this.scene.fog = new THREE.Fog('#98bfe2', 46, 135);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );

    this.hemiLight = new THREE.HemisphereLight('#fff0d4', '#b7e4c7', 0.68);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff4dc', 1.22);
    this.sunLight.position.set(15, 22, 12);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 65;
    const d = 22;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.world = buildNeighborhood(this.scene);
    this.scene.add(this.placedFurnitureGroup);

    this.deliveryTruck = buildDeliveryTruck();
    this.deliveryTruck.root.visible = false;
    this.scene.add(this.deliveryTruck.root);
    this.scene.add(this.deliveryTruck.cargoParcel);

    const state = this.getState();
    this.currentTimeMinutes = state.timeMinutes;
    this.currentWeaponLevel = state.weaponLevel ?? 0;
    this.playerRig = buildCharacter(state.customization, { weaponLevel: this.currentWeaponLevel });
    this.playerRig.root.position.copy(this.playerPos);
    this.scene.add(this.playerRig.root);

    this.spawnInitialNpcs();
    this.syncWorldState();
    this.bindEvents();
    this.tick();
  }

  private currentWeaponLevel = 0;

  public updateCustomization(custom: ElizeneCustomization) {
    this.scene.remove(this.playerRig.root);
    this.playerRig = buildCharacter(custom, { weaponLevel: this.currentWeaponLevel });
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.scene.add(this.playerRig.root);
  }

  private getShopExpandDepth(): number {
    const shopExpandUpg = this.getState().upgrades.find((u) => u.id === 'upg_shop_expand');
    const level = shopExpandUpg ? Math.max(1, shopExpandUpg.level) : 1;
    return (level - 1) * 2.2;
  }

  public syncWorldState() {
    const state = this.getState();
    const nextWeaponLevel = state.weaponLevel ?? 0;
    if (nextWeaponLevel !== this.currentWeaponLevel) {
      this.currentWeaponLevel = nextWeaponLevel;
      this.updateCustomization(state.customization);
    }
    syncShelfProducts(this.world.shelfItemsGroup, state.products);
    syncDecorations(this.world.decorationsGroup, state.decorations);
    this.world.gardenGate.visible = !state.gardenUnlocked;
    this.world.houseDoor.visible = !state.houseUnlocked;
    if (state.shopWallColor) this.world.shopWallMat.color.set(state.shopWallColor);
    if (state.houseWallColor) this.world.houseWallMat.color.set(state.houseWallColor);
    const equippedFacade = state.facades?.find((f) => f.equipped);
    if (equippedFacade) {
      this.world.awningMat.color.set(equippedFacade.awningColor);
      this.world.roofMat.color.set(equippedFacade.roofColor);
    }

    // Expande a loja SOMENTE para trás (-Z), mantendo a frente alinhada atrás da calçada
    const extraDepth = this.getShopExpandDepth();
    this.world.shopGroup.scale.set(1, 1, 1);
    this.world.shopFloor.scale.set(1, 1, (7.6 + extraDepth) / 7.6);
    this.world.shopFloor.position.z = -2.0 - extraDepth / 2;
    this.world.shopLeftWall.scale.set(1, 1, (7.6 + extraDepth) / 7.6);
    this.world.shopLeftWall.position.z = -2.0 - extraDepth / 2;
    this.world.shopRightWall.scale.set(1, 1, (7.6 + extraDepth) / 7.6);
    this.world.shopRightWall.position.z = -2.0 - extraDepth / 2;
    this.world.shopRoof.scale.set(1, 1, (8.0 + extraDepth) / 8.0);
    this.world.shopRoof.position.z = -2.0 - extraDepth / 2;
    this.world.shopBackWall.position.z = -5.7 - extraDepth;
    this.world.shopBackPaintings.forEach((p) => {
      p.position.z = -5.55 - extraDepth;
    });
    this.world.shopBackLight.position.z = -4.2 - extraDepth * 0.75;
    this.world.shopBackCollider.minZ = -6.0 - extraDepth;
    this.world.shopBackCollider.maxZ = -5.4 - extraDepth;
    this.world.shopLeftCollider.minZ = -5.9 - extraDepth;
    this.world.shopRightCollider.minZ = -5.9 - extraDepth;

    syncPlacedFurniture(this.placedFurnitureGroup, state.ownedFurniture ?? []);
    if (!this.sittingBench) {
      this.pushOutOfCollision(this.playerPos, 0.35);
    }

    // Remove fired employees from 3D scene
    for (let i = this.employees.length - 1; i >= 0; i--) {
      const actor = this.employees[i];
      const stateEmp = state.employees.find((e) => e.id === actor.id);
      if (!stateEmp || !stateEmp.hired) {
        this.scene.remove(actor.rig.root);
        this.employees.splice(i, 1);
      }
    }

    // Sync hired employees
    state.employees.forEach((emp) => {
      if (emp.hired && !this.employees.find((e) => e.id === emp.id)) {
        const isGuard = emp.role === 'guard';
        const rig = buildCharacter(
          {
            skinTone: isGuard ? '#e0a370' : '#f5c6a5',
            hairStyle:
              emp.role === 'cashier'
                ? 'bun'
                : emp.role === 'organizer'
                ? 'ponytail'
                : isGuard
                ? 'ponytail'
                : 'bob',
            hairColor: emp.hairColor,
            eyeStyle: isGuard ? 'cat' : 'sweet',
            eyeColor: '#4a3525',
            outfitType: isGuard ? 'pants' : 'dress',
            topColor: emp.outfitColor,
            bottomColor: isGuard ? '#1b1b1e' : '#ffffff',
            shoeColor: isGuard ? '#111827' : '#ffffff',
            bagType: 'none',
            bagColor: '#ffffff',
            accessory: 'none',
          },
          { isStrong: isGuard }
        );
        const startPos =
          emp.role === 'cashier'
            ? new THREE.Vector3(2.35, 0, -4.85)
            : emp.role === 'organizer'
            ? new THREE.Vector3(-2.0, 0, -3.0)
            : emp.role === 'guard'
            ? new THREE.Vector3(-1.1, 0, 0.45)
            : new THREE.Vector3(0, 0, -1.0);
        rig.root.position.copy(startPos);
        this.scene.add(rig.root);
        this.employees.push({
          id: emp.id,
          role: emp.role,
          rig,
          target: startPos.clone(),
          timer: 0,
          actionTimer: 0,
        });
      }
    });
  }

  public setInputPaused(paused: boolean) {
    this.inputPaused = paused;
    if (paused) {
      this.keys.clear();
    }
  }

  public triggerEmote(emote: 'wave' | 'dance') {
    this.playerAnim = emote;
    this.emoteTimer = 2.2;
  }

  public setWeather(next: WeatherType) {
    this.weather = next;
    this.weatherTimer = 50;
    this.onWeatherChange?.(next);
  }

  public cycleWeather() {
    const order: WeatherType[] = ['sunny', 'cloudy', 'rainy'];
    const nextIdx = (order.indexOf(this.weather) + 1) % order.length;
    soundEngine.playClick();
    this.setWeather(order[nextIdx]);
  }

  public setSnapToGrid(enabled: boolean) {
    this.snapToGrid = enabled;
    if (this.placementGhost && this.placementItem && enabled && !this.placementLockedToSpot) {
      const sx = Math.round(this.placementGhost.position.x * 2) / 2;
      const sz = Math.round(this.placementGhost.position.z * 2) / 2;
      this.placementGhost.position.set(sx, 0, sz);
      this.updatePlacementIndicator(sx, sz);
    }
  }

  public setPlacementFreeMode() {
    this.placementLockedToSpot = false;
    if (this.placementGhost) {
      this.updatePlacementIndicator(
        this.placementGhost.position.x,
        this.placementGhost.position.z
      );
    }
  }

  public startPlacement(item: OwnedFurnitureItem) {
    this.cancelPlacement(false);
    this.placementItem = item;
    this.placementRotY = item.rotationY || 0;
    this.placementLockedToSpot = false;
    this.placementGhost = buildFurnitureMesh(item.modelType, item.color, item.materialType);

    const locationSpots = FIXED_FURNITURE_SPOTS.filter((s) => s.location === item.location);
    const freeSpot = locationSpots.find((s) =>
      this.checkPlacementValid(s.position[0], s.position[2], item)
    );
    const fallbackSpot = locationSpots[0];

    const startX = item.placed
      ? item.position[0]
      : freeSpot
      ? freeSpot.position[0]
      : fallbackSpot
      ? fallbackSpot.position[0]
      : item.location === 'house'
      ? -14.0
      : item.location === 'garden'
      ? 12.5
      : 0;
    const startZ = item.placed
      ? item.position[2]
      : freeSpot
      ? freeSpot.position[2]
      : fallbackSpot
      ? fallbackSpot.position[2]
      : -1.6;

    this.placementGhost.position.set(startX, 0, startZ);
    this.placementGhost.rotation.y = this.placementRotY;

    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#2ec4b6', side: THREE.DoubleSide });
    this.placementRing = new THREE.Mesh(ringGeo, ringMat);
    this.placementRing.rotation.x = -Math.PI / 2;
    this.placementRing.position.y = 0.04;
    this.placementGhost.add(this.placementRing);

    this.scene.add(this.placementGhost);
    this.updatePlacementIndicator(startX, startZ);
  }

  public movePlacementToFixedSpot(spotId: string): boolean {
    if (!this.placementItem || !this.placementGhost) return false;
    const spot = FIXED_FURNITURE_SPOTS.find((s) => s.id === spotId);
    if (!spot || spot.location !== this.placementItem.location) return false;
    this.placementLockedToSpot = true;
    this.placementRotY = spot.rotationY;
    this.placementGhost.rotation.y = this.placementRotY;
    this.placementGhost.position.set(spot.position[0], 0, spot.position[2]);
    this.updatePlacementIndicator(spot.position[0], spot.position[2]);
    soundEngine.playClick();
    return this.placementValid;
  }

  public placeAtFixedSpot(
    item: OwnedFurnitureItem,
    position: [number, number, number],
    rotationY: number
  ): boolean {
    if (!this.checkPlacementValid(position[0], position[2], item)) {
      return false;
    }
    this.cancelPlacement(false);
    this.onPlaceFurniture?.(item.instanceId, [position[0], 0, position[2]], rotationY);
    soundEngine.playPurchase();
    return true;
  }

  private getPlacementInvalidReason(
    x: number,
    z: number,
    item: OwnedFurnitureItem
  ): string | null {
    const state = this.getState();
    if (item.location === 'garden' && !state.gardenUnlocked) {
      return 'Desbloqueie o Jardim em Upgrades.';
    }
    if (item.location === 'house' && !state.houseUnlocked) {
      return 'Desbloqueie a Casa em Upgrades.';
    }
    let inBounds = false;
    const extraDepth = this.getShopExpandDepth();
    if (item.location === 'shop') {
      inBounds = x >= -3.9 && x <= 3.9 && z >= -5.3 - extraDepth && z <= 1.3;
    } else if (item.location === 'garden') {
      inBounds = x >= 8.3 && x <= 16.7 && z >= -5.2 && z <= 1.2;
    } else if (item.location === 'house') {
      inBounds = x >= -17.6 && x <= -10.4 && z >= -5.1 && z <= 1.1;
    }
    if (!inBounds) {
      const areaName =
        item.location === 'shop' ? 'Loja' : item.location === 'garden' ? 'Jardim' : 'Casa';
      return `Mova para dentro da área: ${areaName}.`;
    }

    const candidateItem: OwnedFurnitureItem = {
      ...item,
      placed: true,
      position: [x, 0, z],
      rotationY: this.placementRotY,
    };
    const candidateCol = getFurnitureCollider(candidateItem);

    const others = (state.ownedFurniture ?? []).filter(
      (f) => f.placed && f.instanceId !== item.instanceId
    );
    for (const o of others) {
      const otherCol = getFurnitureCollider(o);
      if (candidateCol && otherCol) {
        const overlaps =
          candidateCol.minX < otherCol.maxX &&
          candidateCol.maxX > otherCol.minX &&
          candidateCol.minZ < otherCol.maxZ &&
          candidateCol.maxZ > otherCol.minZ;
        if (overlaps) return 'Espaço ocupado por outro móvel.';
      } else {
        const dist = Math.hypot(x - o.position[0], z - o.position[2]);
        if (dist < 0.85) return 'Espaço ocupado por outro móvel.';
      }
    }
    return null;
  }

  private updatePlacementIndicator(x: number, z: number) {
    if (!this.placementItem) return;
    const reason = this.getPlacementInvalidReason(x, z, this.placementItem);
    this.placementValid = reason === null;
    if (this.placementRing && this.placementRing.material instanceof THREE.MeshBasicMaterial) {
      this.placementRing.material.color.set(this.placementValid ? '#2ec4b6' : '#e63946');
    }
    this.onPlacementStatus?.({
      valid: this.placementValid,
      lockedToSpot: this.placementLockedToSpot,
      reason,
    });
  }

  public rotatePlacement() {
    if (!this.placementGhost) return;
    this.placementRotY += Math.PI / 4;
    this.placementGhost.rotation.y = this.placementRotY;
    this.updatePlacementIndicator(
      this.placementGhost.position.x,
      this.placementGhost.position.z
    );
    soundEngine.playClick();
  }

  public confirmPlacement(): boolean {
    if (!this.placementItem || !this.placementGhost) return false;
    const p = this.placementGhost.position;
    this.updatePlacementIndicator(p.x, p.z);
    if (!this.placementValid) return false;
    this.onPlaceFurniture?.(this.placementItem.instanceId, [p.x, 0, p.z], this.placementRotY);
    this.cancelPlacement(false);
    soundEngine.playPurchase();
    return true;
  }

  public cancelPlacement(notify = true) {
    if (this.placementGhost) {
      this.scene.remove(this.placementGhost);
      this.placementGhost = null;
    }
    this.placementRing = null;
    this.placementItem = null;
    this.placementLockedToSpot = false;
    if (notify) this.onCancelPlacement?.();
  }

  private spawnInitialNpcs() {
    const npcConfigs: ElizeneCustomization[] = [
      {
        skinTone: '#fde2c4',
        hairStyle: 'ponytail',
        hairColor: '#8d5524',
        eyeStyle: 'sparkly',
        eyeColor: '#3a5a40',
        outfitType: 'skirt',
        topColor: '#bde0fe',
        bottomColor: '#ffffff',
        shoeColor: '#f9c5d1',
        bagType: 'tote',
        bagColor: '#ffffff',
        accessory: 'bow',
      },
      {
        skinTone: '#e0a370',
        hairStyle: 'long',
        hairColor: '#222222',
        eyeStyle: 'sweet',
        eyeColor: '#4a3525',
        outfitType: 'dress',
        topColor: '#d8c2f0',
        bottomColor: '#d8c2f0',
        shoeColor: '#ffffff',
        bagType: 'crossbody',
        bagColor: '#ffd166',
        accessory: 'earrings',
      },
      {
        skinTone: '#b57445',
        hairStyle: 'bun',
        hairColor: '#1a1a1a',
        eyeStyle: 'cat',
        eyeColor: '#3d2b1f',
        outfitType: 'pants',
        topColor: '#fff3d6',
        bottomColor: '#f4a2b8',
        shoeColor: '#ffffff',
        bagType: 'none',
        bagColor: '#ffffff',
        accessory: 'necklace',
      },
      {
        skinTone: '#f5c6a5',
        hairStyle: 'bob',
        hairColor: '#c98a4b',
        eyeStyle: 'sweet',
        eyeColor: '#457b9d',
        outfitType: 'dress',
        topColor: '#c1ebd7',
        bottomColor: '#c1ebd7',
        shoeColor: '#ffffff',
        bagType: 'tote',
        bagColor: '#f9c5d1',
        accessory: 'none',
      },
      {
        skinTone: '#f5c6a5',
        hairStyle: 'long',
        hairColor: '#7f4f24',
        eyeStyle: 'sparkly',
        eyeColor: '#6d597a',
        outfitType: 'skirt',
        topColor: '#ffccd5',
        bottomColor: '#6d597a',
        shoeColor: '#ffffff',
        bagType: 'crossbody',
        bagColor: '#ff758f',
        accessory: 'bracelet',
      },
      {
        skinTone: '#b57445',
        hairStyle: 'ponytail',
        hairColor: '#1f1a17',
        eyeStyle: 'cat',
        eyeColor: '#2b2d42',
        outfitType: 'dress',
        topColor: '#ffd6a5',
        bottomColor: '#ffd6a5',
        shoeColor: '#f9c5d1',
        bagType: 'tote',
        bagColor: '#fff1e6',
        accessory: 'earrings',
      },
      {
        skinTone: '#fde2c4',
        hairStyle: 'bun',
        hairColor: '#b5651d',
        eyeStyle: 'sweet',
        eyeColor: '#2a9d8f',
        outfitType: 'pants',
        topColor: '#cdb4db',
        bottomColor: '#f8edeb',
        shoeColor: '#ffffff',
        bagType: 'none',
        bagColor: '#ffffff',
        accessory: 'bow',
      },
      {
        skinTone: '#7a4928',
        hairStyle: 'bob',
        hairColor: '#141414',
        eyeStyle: 'sparkly',
        eyeColor: '#3d2b1f',
        outfitType: 'skirt',
        topColor: '#a2d2ff',
        bottomColor: '#bde0fe',
        shoeColor: '#ffd166',
        bagType: 'crossbody',
        bagColor: '#ffffff',
        accessory: 'necklace',
      },
    ];

    // Embaralha para variar as clientes a cada respawn diário
    const shuffled = [...npcConfigs].sort(() => Math.random() - 0.5).slice(0, 5);

    shuffled.forEach((cfg, idx) => {
      const rig = buildCharacter(cfg);
      const startX = -14 + idx * 7 + (Math.random() - 0.5) * 2.2;
      const startZ = 3.0 + (idx % 2) * 0.55;
      const pos = new THREE.Vector3(startX, 0, startZ);
      rig.root.position.copy(pos);
      this.scene.add(rig.root);
      this.npcs.push({
        rig,
        state: 'stroll',
        target: new THREE.Vector3(
          THREE.MathUtils.clamp(startX + (Math.random() < 0.5 ? 4 : -4), -18, 18),
          0,
          startZ
        ),
        timer: 0.8 + idx * 1.1,
      });
    });
  }

  public respawnAllNpcsForNewDay() {
    // 1. Remove todas as clientes atuais e limpa a fila do caixa
    for (const npc of this.npcs) {
      this.scene.remove(npc.rig.root);
    }
    this.npcs = [];
    this.nextCheckoutOrder = 1;
    this.waitingAlertSent = false;
    this.world.cashierAlertMesh.visible = false;

    // 2. Remove qualquer ladra remanescente do dia anterior e reinicia o ciclo
    for (const thief of this.thieves) {
      this.scene.remove(thief.rig.root);
    }
    this.thieves = [];
    this.thiefSpawnTimer = 10;

    // 3. Remove e reposiciona todas as funcionárias contratadas para o novo expediente
    for (const emp of this.employees) {
      this.scene.remove(emp.rig.root);
    }
    this.employees = [];

    // 4. Respawna todas as clientes e funcionárias para o novo dia
    this.spawnInitialNpcs();
    this.syncWorldState();
    this.onAlert?.('Fim do dia! Todos os NPCs reapareceram para um novo expediente.');
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: true });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (this.inputPaused) return;
    this.keys.add(code);
    if (code === 'Space') {
      if (this.sittingBench) {
        this.standUp();
      } else if (this.isGrounded) {
        this.playerVelY = 6.2;
        this.isGrounded = false;
        soundEngine.playJump();
      }
    }
    if (code === 'KeyE') {
      this.handleInteract();
    }
    if (code === 'KeyF') {
      this.performPunch();
    }
    if (code === 'KeyR' && this.placementItem) {
      this.rotatePlacement();
    }
    if (code === 'Enter' && this.placementItem) {
      this.confirmPlacement();
    }
    if (code === 'Escape' && this.placementItem) {
      this.cancelPlacement(true);
    }
    if (code === 'Digit1') this.triggerEmote('wave');
    if (code === 'Digit2') this.triggerEmote('dance');
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.isDragging = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.placementItem && e.button === 0) {
      if (this.placementLockedToSpot) {
        this.placementLockedToSpot = false;
        this.onMouseMove(e);
        return;
      }
      this.confirmPlacement();
      return;
    }
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.placementGhost && this.placementItem) {
      // Não mover o objeto quando o cursor estiver sobre botões da interface ou travado em lugar fixo
      if (this.placementLockedToSpot || e.target !== this.renderer.domElement) {
        return;
      }
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.cameraRaycaster.setFromCamera(this.mouseNdc, this.camera);
      const hitPt = new THREE.Vector3();
      if (this.cameraRaycaster.ray.intersectPlane(this.groundPlane, hitPt)) {
        const px = this.snapToGrid ? Math.round(hitPt.x * 2) / 2 : hitPt.x;
        const pz = this.snapToGrid ? Math.round(hitPt.z * 2) / 2 : hitPt.z;
        this.placementGhost.position.set(px, 0, pz);
        this.updatePlacementIndicator(px, pz);
      }
      return;
    }
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.lastMouse = { x: e.clientX, y: e.clientY };
    this.camYaw -= dx * 0.006;
    this.camPitch = Math.max(0.15, Math.min(1.1, this.camPitch + dy * 0.005));
  };

  private checkPlacementValid(x: number, z: number, item: OwnedFurnitureItem): boolean {
    return this.getPlacementInvalidReason(x, z, item) === null;
  }

  private onMouseUp = () => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    this.camDist = Math.max(4, Math.min(14, this.camDist + e.deltaY * 0.005));
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private getAllBenches(): { x: number; y: number; z: number; yaw: number }[] {
    const seats = [...this.world.benches];
    const placed = this.getState().ownedFurniture ?? [];
    for (const item of placed) {
      if (
        item.placed &&
        (item.modelType === 'bench' ||
          item.modelType === 'sofa' ||
          item.modelType === 'armchair' ||
          item.modelType === 'chair')
      ) {
        seats.push({
          x: item.position[0],
          y: item.position[1],
          z: item.position[2],
          yaw: item.rotationY || 0,
        });
      }
    }
    return seats;
  }

  private standUp() {
    if (!this.sittingBench) return;
    this.playerPos.copy(this.sittingBench.standPos);
    this.sittingBench = null;
    this.pushOutOfCollision(this.playerPos, 0.35);
    this.playerAnim = 'idle';
    soundEngine.playClick();
  }

  private getNearbyInteractable(): { action: string; prompt: string } | null {
    if (this.sittingBench) {
      return { action: 'stand_up', prompt: '[E] ou WASD para Levantar' };
    }
    const p = this.playerPos;

    const state = this.getState();
    const weaponLevel = state.weaponLevel ?? 0;
    const hitReach = weaponLevel > 0 ? 2.6 + weaponLevel * 0.9 : 2.45;

    // Verificar se há ladra por perto para Elizene espantar/bater e pegar o dinheiro dela
    const nearbyThief = this.thieves.find(
      (t) =>
        t.state !== 'blocked_flee' &&
        Math.hypot(p.x - t.rig.root.position.x, p.z - t.rig.root.position.z) < hitReach
    );
    if (nearbyThief) {
      return {
        action: 'hit_thief',
        prompt:
          weaponLevel > 0
            ? `[F] ou [E] Espantar Ladra com Arma (${nearbyThief.hp}/3)`
            : `[F] ou [E] Bater na Ladra (${nearbyThief.hp}/3)`,
      };
    }
    const hasCashier = state.employees.some((e) => e.role === 'cashier' && e.hired);
    if (p.distanceTo(new THREE.Vector3(2.35, 0, -3.85)) < 2.65) {
      const frontCustomer = this.getFrontCheckoutCustomer();
      if (
        !hasCashier &&
        frontCustomer &&
        !frontCustomer.awaitingMinigame &&
        frontCustomer.rig.root.position.distanceTo(frontCustomer.target) < 0.85
      ) {
        return { action: 'serve_checkout', prompt: '[E] Ir para o Caixa (Atender Cliente)' };
      }
      return { action: 'shop_stock', prompt: '[E] Gerenciar Estoque & Caixa' };
    }
    if (p.distanceTo(new THREE.Vector3(-2.5, 0, -2.5)) < 2.2) {
      return { action: 'shop_stock', prompt: '[E] Repor Prateleiras' };
    }
    if (p.distanceTo(new THREE.Vector3(12.5, 0, 1.8)) < 2.5 && !state.gardenUnlocked) {
      return { action: 'upgrades', prompt: '[E] Desbloquear Jardim Encantador' };
    }
    if (p.distanceTo(new THREE.Vector3(-14.0, 0, 1.8)) < 2.5 && !state.houseUnlocked) {
      return { action: 'upgrades', prompt: '[E] Comprar Casa da Elizene' };
    }

    // Verificar proximidade de bancos para sentar
    let closestBench: { seatPos: THREE.Vector3; yaw: number } | null = null;
    let closestDist = 2.05;
    for (const b of this.getAllBenches()) {
      const dist = Math.hypot(p.x - b.x, p.z - b.z);
      if (dist < closestDist) {
        closestDist = dist;
        closestBench = {
          seatPos: new THREE.Vector3(b.x, b.y, b.z),
          yaw: b.yaw,
        };
      }
    }
    if (closestBench) {
      this.pendingBench = closestBench;
      return { action: 'sit_bench', prompt: '[E] Sentar no Banco' };
    }
    this.pendingBench = null;
    return null;
  }

  public triggerInteract() {
    this.handleInteract();
  }

  public performPunch() {
    if (this.sittingBench) {
      this.standUp();
    }
    this.playerAnim = 'punch';
    this.emoteTimer = 0.4;

    const weaponLevel = this.getState().weaponLevel ?? 0;
    const hitReach = weaponLevel > 0 ? 2.75 + weaponLevel * 0.95 : 2.55;
    const damage = weaponLevel > 0 ? 1 + weaponLevel : 1;

    let hitAny = false;
    for (const thief of this.thieves) {
      if (thief.state === 'blocked_flee') continue;
      const tPos = thief.rig.root.position;
      const dx = tPos.x - this.playerPos.x;
      const dz = tPos.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < hitReach) {
        hitAny = true;
        this.playerYaw = Math.atan2(dx, dz);
        if (weaponLevel > 0) {
          soundEngine.playWeaponZap();
        } else {
          soundEngine.playHit();
        }
        thief.hp -= damage;
        thief.hitStunTimer = 0.45;
        if (dist > 0.05) {
          const pushStep = weaponLevel > 0 ? 0.75 : 0.55;
          tPos.x = THREE.MathUtils.clamp(tPos.x + (dx / dist) * pushStep, -24, 24);
          tPos.z = THREE.MathUtils.clamp(tPos.z + (dz / dist) * pushStep, -5.0, 13.0);
        }
        if (thief.hp <= 0) {
          const reward = thief.lootMoney;
          const stolen = thief.stolenCount;
          if (weaponLevel >= 2 && thief.stolenProductIds.length > 0) {
            this.onRestoreStolenItems?.([...thief.stolenProductIds]);
            thief.stolenProductIds = [];
          }
          this.onCatchThief?.(reward, stolen);
          soundEngine.playCashRegister();
          thief.state = 'blocked_flee';
          thief.target.set(tPos.x >= 0 ? 26 : -26, 0, 8.4);
          this.onAlert?.(
            weaponLevel > 0
              ? `Você usou a arma de defesa, espantou a ladra pela rua e pegou R$ ${reward}!`
              : `Você derrotou a ladra e pegou R$ ${reward} dela! Ela fugiu pela rua.`
          );
        } else {
          this.onAlert?.(
            weaponLevel > 0
              ? `Disparo da arma de defesa acertou! Falta ${thief.hp} disparo para espantar a ladra!`
              : `Você bateu na ladra! Faltam ${thief.hp} golpe(s) para pegar o dinheiro dela!`
          );
        }
        break;
      }
    }
    if (!hitAny) {
      if (weaponLevel > 0) {
        soundEngine.playWeaponZap();
      } else {
        soundEngine.playClick();
      }
    }
  }

  public completeCheckoutMinigame(npcIndex: number, soldItems: CheckoutItem[]) {
    const npc = this.npcs[npcIndex];
    let totalEarned = 0;
    const state = this.getState();

    this.playerPos.set(2.35, 0, -4.85);
    this.playerYaw = 0;
    this.playerAnim = 'serve';
    this.emoteTimer = 0.9;

    for (const item of soldItems) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (prod && prod.stock > 0) {
        this.onSale(item.productId, item.sellPrice);
        totalEarned += item.sellPrice;
      }
    }

    if (npc) {
      npc.awaitingMinigame = false;
      npc.chosenProductId = undefined;
      npc.chosenItems = undefined;
      npc.checkoutOrder = undefined;
      npc.stuckTime = 0;
      npc.state = 'exiting';
      npc.target.set(0, 0, 2.85);
      npc.timer = 0.3;
    }

    if (totalEarned > 0) {
      this.onAlert?.(
        `Elizene atendeu a cliente no caixa! (${soldItems.length} produto(s) · +R$ ${totalEarned})`
      );
    }
  }

  public cancelCheckoutMinigame(npcIndex: number) {
    const npc = this.npcs[npcIndex];
    if (npc) {
      npc.awaitingMinigame = false;
      npc.timer = 35;
    }
  }

  private handleInteract() {
    const near = this.getNearbyInteractable();
    if (!near) return;
    if (near.action === 'stand_up') {
      this.standUp();
      return;
    }
    if (near.action === 'hit_thief') {
      this.performPunch();
      return;
    }
    if (near.action === 'serve_checkout') {
      const waiting = this.getFrontCheckoutCustomer();
      const waitingIdx = waiting ? this.npcs.indexOf(waiting) : -1;
      if (
        waitingIdx !== -1 &&
        waiting &&
        !waiting.awaitingMinigame &&
        waiting.rig.root.position.distanceTo(waiting.target) < 0.95
      ) {
        const state = this.getState();
        // Posiciona a Elizene atrás do balcão do caixa olhando para a cliente
        this.playerPos.set(2.35, 0, -4.85);
        this.playerYaw = 0;
        this.playerAnim = 'serve';
        this.emoteTimer = 1.1;

        waiting.rig.root.position.set(2.35, 0, -2.95);
        waiting.rig.root.rotation.y = Math.PI;
        waiting.awaitingMinigame = true;
        waiting.timer = 999;

        // Filtra apenas produtos que ainda têm estoque disponível no momento do pagamento
        const stockMap = new Map<string, number>();
        state.products.forEach((p) => stockMap.set(p.id, p.stock));
        const rawItems =
          waiting.chosenItems && waiting.chosenItems.length > 0 ? waiting.chosenItems : [];
        let items: CheckoutItem[] = [];
        for (const it of rawItems) {
          const rem = stockMap.get(it.productId) ?? 0;
          if (rem > 0) {
            stockMap.set(it.productId, rem - 1);
            const liveProd = state.products.find((p) => p.id === it.productId);
            items.push({
              ...it,
              sellPrice: liveProd ? liveProd.sellPrice : it.sellPrice,
            });
          }
        }
        if (items.length === 0) {
          const fallbackProd =
            state.products.find((p) => p.id === waiting.chosenProductId && p.stock > 0) ??
            state.products.find((p) => p.stock > 0);
          if (fallbackProd) {
            items = [
              {
                uid: `ci_${Date.now()}_0`,
                productId: fallbackProd.id,
                name: fallbackProd.name,
                sellPrice: fallbackProd.sellPrice,
                color: fallbackProd.color,
              },
            ];
          }
        }

        if (items.length > 0 && this.onStartCheckoutMinigame) {
          soundEngine.playClick();
          this.onStartCheckoutMinigame({
            npcIndex: waitingIdx,
            customerName: 'Cliente da Boutique',
            items,
          });
        } else {
          this.completeCheckoutMinigame(waitingIdx, []);
          this.onAlert?.('Os produtos da cliente acabaram no estoque e ela foi embora.');
        }
      }
      return;
    }
    if (near.action === 'sit_bench' && this.pendingBench) {
      soundEngine.playClick();
      this.sittingBench = {
        seatPos: this.pendingBench.seatPos.clone(),
        standPos: this.playerPos.clone(),
        yaw: this.pendingBench.yaw,
      };
      this.playerPos.copy(this.sittingBench.seatPos);
      this.playerYaw = this.sittingBench.yaw;
      this.emoteTimer = 0;
      this.playerAnim = 'sit';
      return;
    }
    soundEngine.playClick();
    this.onInteractAction(near.action);
  }

  private updatePlayer(dt: number) {
    let moveX = 0;
    let moveZ = 0;
    if (!this.inputPaused) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    }

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (this.sittingBench) {
      if (isMoving) {
        this.standUp();
      } else {
        this.playerPos.copy(this.sittingBench.seatPos);
        this.playerYaw = this.sittingBench.yaw;
        this.playerRig.root.position.copy(this.playerPos);
        this.playerRig.root.rotation.y = this.playerYaw;
        this.playerAnim = 'sit';
        animateCharacter(this.playerRig, 'sit', this.elapsed);

        const lookTarget = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.15, this.playerPos.z);
        const camDir = new THREE.Vector3(
          Math.sin(this.camYaw) * Math.cos(this.camPitch),
          Math.sin(this.camPitch),
          Math.cos(this.camYaw) * Math.cos(this.camPitch)
        ).normalize();
        const desiredCamPos = lookTarget.clone().addScaledVector(camDir, this.camDist);
        desiredCamPos.y = Math.max(0.5, desiredCamPos.y);
        this.camera.position.lerp(desiredCamPos, 0.22);
        this.camera.lookAt(lookTarget);

        const near = this.getNearbyInteractable();
        this.onInteractPrompt(near ? near.prompt : null);
        return;
      }
    }

    const isRunning = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = isRunning ? 7.2 : 4.2;

    if (isMoving) {
      const angle = Math.atan2(moveX, moveZ) + this.camYaw;
      const vx = Math.sin(angle) * speed * dt;
      const vz = Math.cos(angle) * speed * dt;

      const extraDepth = this.getShopExpandDepth();
      const inShopX = Math.abs(this.playerPos.x) < 4.35;
      const minZBound = inShopX ? -5.3 - extraDepth : -5.2;

      const nextX = Math.max(-24, Math.min(24, this.playerPos.x + vx));
      const nextZ = Math.max(minZBound, Math.min(14, this.playerPos.z + vz));

      if (!this.checkCollision(nextX, this.playerPos.z)) {
        this.playerPos.x = nextX;
      }
      if (!this.checkCollision(this.playerPos.x, nextZ)) {
        this.playerPos.z = nextZ;
      }

      this.playerYaw = angle;
      this.emoteTimer = 0;
    }

    // Gravity & Jump
    if (!this.isGrounded) {
      this.playerVelY -= 16 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelY = 0;
        this.isGrounded = true;
      }
    }

    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.root.rotation.y = this.playerYaw;

    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt;
    } else if (!this.isGrounded) {
      this.playerAnim = 'jump';
    } else if (isMoving) {
      this.playerAnim = isRunning ? 'run' : 'walk';
    } else {
      this.playerAnim = 'idle';
    }

    animateCharacter(this.playerRig, this.playerAnim, this.elapsed);

    // Update Camera with Wall-Collision Physics
    const lookTarget = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.35, this.playerPos.z);
    const camDir = new THREE.Vector3(
      Math.sin(this.camYaw) * Math.cos(this.camPitch),
      Math.sin(this.camPitch),
      Math.cos(this.camYaw) * Math.cos(this.camPitch)
    ).normalize();

    let effectiveDist = this.camDist;
    this.cameraRaycaster.set(lookTarget, camDir);
    this.cameraRaycaster.far = this.camDist;
    const hits = this.cameraRaycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      if (
        hit.object instanceof THREE.Mesh &&
        !this.playerRig.root.getObjectById(hit.object.id) &&
        hit.distance > 0.4
      ) {
        effectiveDist = Math.max(1.2, hit.distance - 0.35);
        break;
      }
    }

    const desiredCamPos = lookTarget.clone().addScaledVector(camDir, effectiveDist);
    desiredCamPos.y = Math.max(0.5, desiredCamPos.y);
    this.camera.position.lerp(desiredCamPos, 0.22);
    this.camera.lookAt(lookTarget);

    const near = this.getNearbyInteractable();
    this.onInteractPrompt(near ? near.prompt : null);
  }

  private checkCollision(x: number, z: number, r = 0.35): boolean {
    for (const c of this.world.colliders) {
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
        return true;
      }
    }
    const state = this.getState();
    // Física sólida em todos os móveis comprados e posicionados (loja, casa e jardim)
    for (const furn of state.ownedFurniture ?? []) {
      const fc = getFurnitureCollider(furn);
      if (fc && x + r > fc.minX && x - r < fc.maxX && z + r > fc.minZ && z - r < fc.maxZ) {
        return true;
      }
    }
    // Física sólida do caminhão de entrega na rua
    if (this.truckAnim.active) {
      const tx = this.truckAnim.x;
      if (x + r > tx - 2.15 && x - r < tx + 2.45 && z + r > 5.15 && z - r < 6.85) {
        return true;
      }
    }
    // Bloquear entrada na casa da Elizene enquanto não desbloqueada
    if (!state.houseUnlocked && x + r > -15.0 && x - r < -13.0 && z + r > 1.38 && z - r < 1.82) {
      return true;
    }
    // Bloquear entrada no jardim enquanto não desbloqueado
    if (!state.gardenUnlocked && x + r > 11.2 && x - r < 13.8 && z + r > 1.48 && z - r < 1.92) {
      return true;
    }
    return false;
  }

  private pushOutOfCollision(pos: THREE.Vector3, radius = 0.34) {
    if (!this.checkCollision(pos.x, pos.z, radius)) return;
    const distances = [0.2, 0.42, 0.68, 0.95];
    for (const d of distances) {
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        const cx = THREE.MathUtils.clamp(pos.x + Math.cos(ang) * d, -24.2, 24.2);
        const cz = THREE.MathUtils.clamp(pos.z + Math.sin(ang) * d, -5.2, 13.8);
        if (!this.checkCollision(cx, cz, radius)) {
          pos.x = cx;
          pos.z = cz;
          return;
        }
      }
    }
  }

  private getDoorwayAwareTarget(pos: THREE.Vector3, dest: THREE.Vector3): THREE.Vector3 {
    const posInShopZone = pos.z < 2.35 && Math.abs(pos.x) < 4.4;
    const destInsideShop = dest.z < 1.35 && Math.abs(dest.x) < 4.35;
    const destOutsideShop = dest.z > 2.4 || Math.abs(dest.x) >= 4.4;

    // Saindo da loja: primeiro alinha dentro em frente à porta, depois atravessa até a calçada (z >= 2.6)
    if (posInShopZone && destOutsideShop) {
      if (pos.z < 1.0 && Math.abs(pos.x) > 0.78) {
        return new THREE.Vector3(THREE.MathUtils.clamp(pos.x, -0.45, 0.45), 0, 0.8);
      }
      if (pos.z < 2.55) {
        return new THREE.Vector3(THREE.MathUtils.clamp(pos.x, -0.5, 0.5), 0, 2.85);
      }
    }

    // Entrando na loja: garante contorno por fora das paredes laterais antes de passar pela porta
    if (!posInShopZone && destInsideShop) {
      if (Math.abs(pos.x) > 4.4 && pos.z < 2.55) {
        return new THREE.Vector3(pos.x, 0, 2.95);
      }
      if (this.truckAnim.active && pos.z >= 6.9 && Math.abs(pos.x - this.truckAnim.x) < 3.4) {
        const dodgeX = pos.x >= this.truckAnim.x ? this.truckAnim.x + 3.4 : this.truckAnim.x - 3.4;
        return new THREE.Vector3(THREE.MathUtils.clamp(dodgeX, -22, 22), 0, 4.4);
      }
      if (pos.z > 2.45 && Math.abs(pos.x) > 0.78) {
        return new THREE.Vector3(THREE.MathUtils.clamp(dest.x, -0.45, 0.45), 0, 2.85);
      }
      if (pos.z > 1.05) {
        return new THREE.Vector3(THREE.MathUtils.clamp(pos.x, -0.45, 0.45), 0, 0.75);
      }
    } else if (posInShopZone && pos.z >= 1.15 && destInsideShop && Math.abs(pos.x) > 0.9) {
      return new THREE.Vector3(0, 0, 0.75);
    }

    // Se o destino é fugir pela rua (z >= 7.5), vai primeiro até a faixa da rua (desviando do caminhão)
    if (dest.z >= 7.5 && pos.z >= 2.4 && pos.z < 7.6 && Math.abs(pos.x) < 22) {
      const laneX =
        this.truckAnim.active && Math.abs(pos.x - this.truckAnim.x) < 3.4
          ? pos.x >= this.truckAnim.x
            ? this.truckAnim.x + 3.4
            : this.truckAnim.x - 3.4
          : THREE.MathUtils.clamp(pos.x, -3.5, 3.5);
      return new THREE.Vector3(laneX, 0, 8.4);
    }

    return dest;
  }

  private moveNpcDirect(
    pos: THREE.Vector3,
    rawTarget: THREE.Vector3,
    speed: number,
    dt: number,
    minXBound = -24.2,
    maxXBound = 24.2,
    fallbackYaw = 0
  ): number {
    const stepTarget = this.getDoorwayAwareTarget(pos, rawTarget);
    const dx = stepTarget.x - pos.x;
    const dz = stepTarget.z - pos.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) return fallbackYaw;

    const step = Math.min(len, speed * dt);
    const dirX = dx / len;
    const dirZ = dz / len;

    const extraDepth = this.getShopExpandDepth();
    const minZBound = Math.abs(pos.x) < 4.35 ? -5.2 - extraDepth : -5.2;

    pos.x = THREE.MathUtils.clamp(pos.x + dirX * step, minXBound, maxXBound);
    pos.z = THREE.MathUtils.clamp(pos.z + dirZ * step, minZBound, 13.8);

    return Math.atan2(dirX, dirZ);
  }

  public triggerDeliveryTruck(productName: string, qty: number) {
    const label = `+${qty}x ${productName}`;
    if (!this.truckAnim.active) {
      this.truckAnim = {
        active: true,
        phase: 'arriving',
        x: -34,
        speed: 12,
        unloadTimer: 0,
        pendingLabel: label,
        queuedLabel: null,
      };
      this.deliveryTruck.root.position.set(-34, 0.04, 6.0);
      this.deliveryTruck.root.visible = true;
      this.deliveryTruck.cargoParcel.visible = false;
      this.onAlert?.(`Caminhão Zene Entregas a caminho com ${label}!`);
    } else if (this.truckAnim.phase === 'arriving' || this.truckAnim.phase === 'unloading') {
      this.truckAnim.pendingLabel = label;
      if (this.truckAnim.phase === 'unloading') {
        this.truckAnim.unloadTimer = Math.max(this.truckAnim.unloadTimer, 1.8);
      }
    } else {
      this.truckAnim.queuedLabel = label;
    }
  }

  private updateDeliveryTruck(dt: number) {
    if (!this.truckAnim.active) return;
    const t = this.truckAnim;
    const targetStopX = -0.5;

    // Evitar que o caminhão atravesse a Elizene caso ela esteja parada na pista da rua
    if (
      Math.abs(this.playerPos.z - 6.0) < 1.25 &&
      Math.abs(this.playerPos.x - t.x) < 2.65
    ) {
      this.playerPos.z = this.playerPos.z <= 6.0 ? 4.65 : 7.35;
    }

    if (t.phase === 'arriving') {
      const distLeft = targetStopX - t.x;
      t.speed = THREE.MathUtils.clamp(distLeft * 1.45, 3.8, 14.5);
      const dx = t.speed * dt;
      t.x += dx;
      this.deliveryTruck.root.position.set(t.x, 0.04, 6.0);
      this.deliveryTruck.wheels.forEach((w) => {
        w.rotation.z -= dx / 0.36;
      });
      if (t.x >= targetStopX - 0.08) {
        t.x = targetStopX;
        t.phase = 'unloading';
        t.unloadTimer = 2.2;
        this.deliveryTruck.root.position.set(t.x, 0.04, 6.0);
        this.deliveryTruck.cargoParcel.visible = true;
        this.deliveryTruck.cargoParcel.position.set(t.x - 1.2, 0.08, 4.9);
        this.deliveryTruck.cargoParcel.scale.setScalar(1);
        soundEngine.playClick();
        if (t.pendingLabel) {
          this.onAlert?.(`Caminhão descarregando ${t.pendingLabel} na loja!`);
        }
      }
    } else if (t.phase === 'unloading') {
      t.unloadTimer -= dt;
      const progress = THREE.MathUtils.clamp(1 - t.unloadTimer / 2.2, 0, 1);
      // Anima a pilha de caixas indo do caminhão até a porta da loja
      const px = THREE.MathUtils.lerp(t.x - 1.2, -0.2, progress);
      const pz = THREE.MathUtils.lerp(4.9, 1.85, progress);
      const hop = Math.abs(Math.sin(progress * Math.PI * 5)) * 0.14;
      const shrink = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
      this.deliveryTruck.cargoParcel.position.set(px, 0.08 + hop, pz);
      this.deliveryTruck.cargoParcel.scale.setScalar(Math.max(0.05, shrink));

      if (t.unloadTimer <= 0) {
        this.deliveryTruck.cargoParcel.visible = false;
        t.phase = 'leaving';
        t.speed = 2.5;
        soundEngine.playPurchase();
        this.onAlert?.('Produtos entregues e armazenados no estoque da loja!');
      }
    } else if (t.phase === 'leaving') {
      t.speed = Math.min(16, t.speed + 9 * dt);
      const dx = t.speed * dt;
      t.x += dx;
      this.deliveryTruck.root.position.set(t.x, 0.04, 6.0);
      this.deliveryTruck.wheels.forEach((w) => {
        w.rotation.z -= dx / 0.36;
      });

      if (t.x >= 35) {
        t.active = false;
        this.deliveryTruck.root.visible = false;
        if (t.queuedLabel) {
          const next = t.queuedLabel;
          t.queuedLabel = null;
          this.triggerDeliveryTruck(next, 1);
        }
      }
    }
  }

  private getFrontCheckoutCustomer(): NpcActor | undefined {
    const inQueue = this.npcs
      .filter((n) => n.state === 'checkout')
      .sort((a, b) => {
        if (a.awaitingMinigame && !b.awaitingMinigame) return -1;
        if (!a.awaitingMinigame && b.awaitingMinigame) return 1;
        return (a.checkoutOrder ?? 999999) - (b.checkoutOrder ?? 999999);
      });
    return inQueue[0];
  }

  private updateNpcs(dt: number) {
    const state = this.getState();
    const availableProducts = state.products.filter((p) => p.stock > 0);
    const hasCashier = state.employees.some((e) => e.role === 'cashier' && e.hired);
    const extraDepth = this.getShopExpandDepth();
    const shelfSpots: [number, number][] = [
      [-2.5, -3.7],
      [-2.5, -1.35],
      [-0.95, -4.15],
    ];
    if (extraDepth > 0.5) {
      shelfSpots.push([-2.2, -5.8 - extraDepth * 0.45]);
      shelfSpots.push([1.8, -5.8 - extraDepth * 0.65]);
    }

    const queueSlots: [number, number][] = [
      [2.35, -2.95], // 1º lugar no caixa
      [2.1, -2.1],   // 2º lugar na fila
      [2.0, -1.25],  // 3º lugar na fila
      [2.0, -0.4],   // 4º lugar na fila
      [2.0, 0.45],   // 5º lugar na fila
    ];

    // Ordena todas as clientes atualmente na fila do caixa e atribui posições separadas
    const orderedQueue = this.npcs
      .filter((n) => n.state === 'checkout')
      .sort((a, b) => {
        if (a.awaitingMinigame && !b.awaitingMinigame) return -1;
        if (!a.awaitingMinigame && b.awaitingMinigame) return 1;
        return (a.checkoutOrder ?? 999999) - (b.checkoutOrder ?? 999999);
      });
    const queuePositionMap = new Map<NpcActor, number>();
    orderedQueue.forEach((n, qIdx) => {
      queuePositionMap.set(n, qIdx);
      const slot = queueSlots[Math.min(qIdx, queueSlots.length - 1)];
      n.target.set(slot[0], 0, slot[1]);
    });

    const cashierAutoTime = Math.max(0.8, 2.0 - state.cashierSpeedLevel * 0.35);
    let anyWaitingAtCashier = false;

    const sendNpcToCheckoutOrExit = (npc: NpcActor, idx: number, laneX: number) => {
      const remainingMap = new Map<string, number>();
      availableProducts.forEach((p) => remainingMap.set(p.id, p.stock));
      const totalUnits = availableProducts.reduce((s, p) => s + p.stock, 0);
      const desiredCount = Math.min(totalUnits, 1 + Math.floor(Math.random() * 3));
      const basket: CheckoutItem[] = [];

      for (let k = 0; k < desiredCount; k++) {
        const pool = availableProducts.filter((p) => (remainingMap.get(p.id) ?? 0) > 0);
        if (pool.length === 0) break;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        remainingMap.set(picked.id, (remainingMap.get(picked.id) ?? 1) - 1);
        basket.push({
          uid: `ci_${Date.now()}_${idx}_${k}_${Math.random().toString(36).slice(2, 5)}`,
          productId: picked.id,
          name: picked.name,
          sellPrice: picked.sellPrice,
          color: picked.color,
        });
      }

      if (basket.length > 0) {
        const activeQueueCount = this.npcs.filter((n) => n.state === 'checkout').length;
        npc.chosenProductId = basket[0].productId;
        npc.chosenItems = basket;
        npc.state = 'checkout';
        npc.checkoutOrder = this.nextCheckoutOrder++;
        npc.stuckTime = 0;
        const nextSlot = queueSlots[Math.min(activeQueueCount, queueSlots.length - 1)];
        npc.target.set(nextSlot[0], 0, nextSlot[1]);
        npc.timer = hasCashier ? cashierAutoTime : 45;
      } else {
        npc.state = 'exiting';
        npc.stuckTime = 0;
        npc.target.set(laneX, 0, 2.85);
        npc.timer = 0.4;
      }
    };

    this.npcs.forEach((npc, idx) => {
      if (npc.awaitingMinigame) {
        npc.rig.root.rotation.y = Math.PI;
        animateCharacter(npc.rig, 'idle', this.elapsed);
        return;
      }

      const laneX = ((idx % 5) - 2) * 0.24;
      const pos = npc.rig.root.position;
      const queueIndex = queuePositionMap.get(npc);
      const isFrontOfQueue = queueIndex === 0;

      // Se Sofia foi contratada enquanto a cliente já aguardava na fila, acelera o atendimento
      if (hasCashier && npc.state === 'checkout' && npc.timer > cashierAutoTime + 0.5) {
        npc.timer = cashierAutoTime;
      }

      // Se a loja fechou ou ficou sem estoque antes de entrar, volta para a calçada
      if (npc.state === 'entering' && (!state.shopOpen || availableProducts.length === 0)) {
        if (pos.z < 2.2) {
          npc.state = 'exiting';
          npc.target.set(laneX, 0, 2.85);
          npc.timer = 0.3;
        } else {
          npc.state = 'stroll';
          npc.target.set(-14 + Math.random() * 28, 0, 3.0 + (idx % 2) * 0.55);
          npc.timer = 2 + Math.random() * 2;
        }
        npc.stuckTime = 0;
      }

      const arriveDist = npc.state === 'checkout' ? 0.36 : 0.4;
      const dist = pos.distanceTo(npc.target);

      if (dist > arriveDist) {
        const yaw = this.moveNpcDirect(
          pos,
          npc.target,
          2.05,
          dt,
          -23.5,
          23.5,
          npc.rig.root.rotation.y
        );
        npc.rig.root.rotation.y = yaw;
        animateCharacter(npc.rig, 'walk', this.elapsed);

        // Detecção e recuperação automática caso o NPC trave em algum obstáculo/fila
        const moved = Math.hypot(
          pos.x - (npc.prevX ?? pos.x),
          pos.z - (npc.prevZ ?? pos.z)
        );
        npc.prevX = pos.x;
        npc.prevZ = pos.z;

        if (moved < 0.008) {
          npc.stuckTime = (npc.stuckTime ?? 0) + dt;
        } else {
          npc.stuckTime = 0;
        }

        if ((npc.stuckTime ?? 0) > 1.35) {
          npc.stuckTime = 0;
          if (npc.state === 'stroll') {
            npc.target.set(-16 + Math.random() * 32, 0, 3.0 + (idx % 2) * 0.55);
            npc.timer = 1.5;
          } else if (npc.state === 'entering') {
            if (pos.z < 1.35 && Math.abs(pos.x) < 4.2) {
              const freeSpots = shelfSpots.filter(
                (s) =>
                  !this.npcs.some(
                    (o) =>
                      o !== npc &&
                      o.state === 'browsing' &&
                      Math.hypot(o.target.x - s[0], o.target.z - s[1]) < 0.5
                  )
              );
              const poolSpots = freeSpots.length > 0 ? freeSpots : shelfSpots;
              const spot = poolSpots[Math.floor(Math.random() * poolSpots.length)];
              npc.state = 'browsing';
              npc.target.set(spot[0], 0, spot[1]);
              npc.timer = 1.8;
            } else {
              npc.state = 'stroll';
              npc.target.set(-14 + Math.random() * 28, 0, 3.0 + (idx % 2) * 0.55);
              npc.timer = 2.0;
            }
          } else if (npc.state === 'browsing') {
            if (pos.z < 1.4 && Math.abs(pos.x) < 4.2) {
              sendNpcToCheckoutOrExit(npc, idx, laneX);
            } else {
              npc.state = 'exiting';
              npc.target.set(laneX, 0, 2.85);
              npc.timer = 0.3;
            }
          } else if (npc.state === 'checkout') {
            if (isFrontOfQueue) {
              if (pos.z < 1.5 && Math.abs(pos.x) < 4.2) {
                npc.timer -= dt * 4;
              } else {
                npc.state = 'stroll';
                npc.chosenProductId = undefined;
                npc.chosenItems = undefined;
                npc.checkoutOrder = undefined;
                npc.target.set(-14 + Math.random() * 28, 0, 3.0 + (idx % 2) * 0.55);
                npc.timer = 2.0;
              }
            }
          } else if (npc.state === 'exiting') {
            if (pos.z >= 2.2) {
              npc.state = 'stroll';
              npc.target.set(-14 + Math.random() * 28, 0, 3.0 + (idx % 2) * 0.55);
              npc.timer = 2.0;
            } else {
              pos.x = THREE.MathUtils.lerp(pos.x, laneX, 0.35);
              npc.target.set(laneX, 0, 2.85);
            }
          }
        }
      } else {
        npc.stuckTime = 0;
        npc.prevX = pos.x;
        npc.prevZ = pos.z;

        if (npc.state === 'checkout') {
          npc.rig.root.rotation.y = Math.PI;
        } else if (npc.state === 'browsing') {
          npc.rig.root.rotation.y = npc.target.x < -1.5 ? -Math.PI / 2 : Math.PI;
        }

        const waitingForElizene = npc.state === 'checkout' && isFrontOfQueue && !hasCashier;
        if (waitingForElizene) {
          anyWaitingAtCashier = true;
        }

        const isPicking =
          npc.state === 'browsing' || (npc.state === 'checkout' && isFrontOfQueue && hasCashier);
        animateCharacter(npc.rig, isPicking ? 'interact' : 'idle', this.elapsed);

        // Na fila do caixa, só a 1ª cliente avança o atendimento; as demais aguardam sua vez
        if (npc.state !== 'checkout' || isFrontOfQueue) {
          npc.timer -= dt;
        }

        if (npc.timer <= 0) {
          if (npc.state === 'stroll') {
            const isPeak = state.timeMinutes >= 720 && state.timeMinutes < 900; // 12:00 - 15:00
            const enterChance = isPeak ? 0.9 : 0.65;
            if (state.shopOpen && availableProducts.length > 0 && Math.random() < enterChance) {
              npc.state = 'entering';
              npc.target.set(laneX, 0, 0.75); // Entra pela porta da loja em faixa individual
              npc.timer = 0.25;
            } else {
              const rx = -16 + Math.random() * 32;
              npc.target.set(rx, 0, 3.0 + (idx % 2) * 0.55);
              npc.timer = 2 + Math.random() * 3;
            }
          } else if (npc.state === 'entering') {
            // Prefere prateleira que ainda não tenha outra cliente parada nela
            const freeSpots = shelfSpots.filter(
              (s) =>
                !this.npcs.some(
                  (o) =>
                    o !== npc &&
                    o.state === 'browsing' &&
                    Math.hypot(o.target.x - s[0], o.target.z - s[1]) < 0.5
                )
            );
            const poolSpots = freeSpots.length > 0 ? freeSpots : shelfSpots;
            const spot = poolSpots[Math.floor(Math.random() * poolSpots.length)];
            npc.state = 'browsing';
            npc.target.set(spot[0], 0, spot[1]);
            npc.timer = 2.0;
          } else if (npc.state === 'browsing') {
            sendNpcToCheckoutOrExit(npc, idx, laneX);
          } else if (npc.state === 'checkout') {
            if (hasCashier) {
              const itemsToRing =
                npc.chosenItems && npc.chosenItems.length > 0
                  ? npc.chosenItems
                  : npc.chosenProductId
                  ? (() => {
                      const p = state.products.find((pr) => pr.id === npc.chosenProductId);
                      return p
                        ? [
                            {
                              uid: `auto_${Date.now()}`,
                              productId: p.id,
                              name: p.name,
                              sellPrice: p.sellPrice,
                              color: p.color,
                            },
                          ]
                        : [];
                    })()
                  : [];
              for (const item of itemsToRing) {
                const prod = this.getState().products.find((p) => p.id === item.productId);
                if (prod && prod.stock > 0) {
                  this.onSale(prod.id, prod.sellPrice);
                  soundEngine.playCashRegister();
                }
              }
            } else {
              this.onAlert?.('Uma cliente cansou de esperar na fila do caixa e foi embora.');
            }
            npc.chosenProductId = undefined;
            npc.chosenItems = undefined;
            npc.checkoutOrder = undefined;
            npc.state = 'exiting';
            npc.target.set(laneX, 0, 2.85); // Sair pela porta em faixa individual
            npc.timer = 0.3;
          } else if (npc.state === 'exiting') {
            npc.state = 'stroll';
            npc.target.set(-14 + Math.random() * 28, 0, 3.0 + (idx % 2) * 0.55);
            npc.timer = 2 + Math.random() * 3;
          }
        }
      }
    });

    this.world.cashierAlertMesh.visible = anyWaitingAtCashier;
    if (anyWaitingAtCashier) {
      this.world.cashierAlertMesh.position.y = 2.15 + Math.sin(this.elapsed * 4.5) * 0.12;
      this.world.cashierAlertMesh.rotation.y += dt * 2.6;
      if (!this.waitingAlertSent) {
        this.waitingAlertSent = true;
        this.onAlert?.('Cliente aguardando na fila do caixa! Vá ao balcão e aperte [E] para atender.');
      }
    } else {
      this.waitingAlertSent = false;
    }
  }

  private spawnThief() {
    const state = this.getState();
    const totalStock = state.products.reduce((sum, p) => sum + p.stock, 0);
    if (totalStock <= 0) return;

    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -22 : 22;
    const thiefConfigs: ElizeneCustomization[] = [
      {
        skinTone: '#e0a370',
        hairStyle: 'ponytail',
        hairColor: '#1b1b1e',
        eyeStyle: 'cat',
        eyeColor: '#2b2d42',
        outfitType: 'pants',
        topColor: '#2b2d42',
        bottomColor: '#1b1b1e',
        shoeColor: '#111827',
        bagType: 'tote',
        bagColor: '#9d0208',
        accessory: 'none',
      },
      {
        skinTone: '#b57445',
        hairStyle: 'bun',
        hairColor: '#2d1e17',
        eyeStyle: 'cat',
        eyeColor: '#3d2b1f',
        outfitType: 'skirt',
        topColor: '#3a3a44',
        bottomColor: '#1f2421',
        shoeColor: '#111827',
        bagType: 'crossbody',
        bagColor: '#800f2f',
        accessory: 'none',
      },
    ];
    const cfg = thiefConfigs[Math.floor(Math.random() * thiefConfigs.length)];
    const rig = buildCharacter(cfg, { isThief: true });
    rig.root.position.set(startX, 0, 8.4);
    this.scene.add(rig.root);

    this.thieves.push({
      id: `thief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      rig,
      state: 'entering',
      target: new THREE.Vector3(0, 0, 0.75),
      timer: 0.4,
      stolenCount: 0,
      maxSteal: Math.min(5, totalStock),
      lootMoney: 45 + Math.floor(Math.random() * 25),
      stolenProductIds: [],
      hp: 3,
      hitStunTimer: 0,
    });

    soundEngine.playAlert();
    this.onAlert?.('Atenção! Uma ladra apareceu tentando roubar a loja! Aperte [F] perto dela para bater!');
  }

  private updateThieves(dt: number) {
    const state = this.getState();
    const availableProducts = state.products.filter((p) => p.stock > 0);
    const guard = this.employees.find((e) => e.role === 'guard');

    // Chance de 14% de spawnar uma mulher ladra a cada ciclo de visita
    this.thiefSpawnTimer -= dt;
    if (this.thiefSpawnTimer <= 0) {
      this.thiefSpawnTimer = 10;
      if (state.shopOpen && availableProducts.length > 0 && this.thieves.length === 0) {
        if (Math.random() < 0.14) {
          this.spawnThief();
        }
      }
    }

    const shelfSpots: [number, number][] = [
      [-2.5, -3.7],
      [-2.5, -1.35],
      [-0.95, -4.15],
    ];

    for (let i = this.thieves.length - 1; i >= 0; i--) {
      const thief = this.thieves[i];
      const pos = thief.rig.root.position;

      // Remove a ladra assim que alcançar o fim da rua
      if (
        (thief.state === 'fleeing' || thief.state === 'blocked_flee') &&
        Math.abs(pos.x) >= 24.0
      ) {
        this.scene.remove(thief.rig.root);
        this.thieves.splice(i, 1);
        continue;
      }

      // Quando a ladra chegar e roubar (stolenCount >= 1), Valéria vai detê-la
      if (guard && thief.stolenCount >= 1 && thief.state !== 'blocked_flee') {
        const gPos = guard.rig.root.position;
        const gDist = gPos.distanceTo(pos);
        if (gDist < 1.65) {
          guard.actionTimer = 0.65;
          guard.rig.root.rotation.y = Math.atan2(pos.x - gPos.x, pos.z - gPos.z);
          soundEngine.playHit();
          if (thief.stolenProductIds.length > 0) {
            this.onRestoreStolenItems?.([...thief.stolenProductIds]);
            thief.stolenProductIds = [];
          }
          soundEngine.playCashRegister();
          thief.state = 'blocked_flee';
          thief.stuckTime = 0;
          thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
          this.onAlert?.('Valéria (Segurança) deteve a ladra e recuperou os produtos roubados!');
        }
      }

      if (thief.hitStunTimer > 0) {
        thief.hitStunTimer -= dt;
        animateCharacter(thief.rig, 'idle', this.elapsed);
        continue;
      }

      // Se a loja fechou enquanto a ladra ainda não tinha entrado, ela desiste e foge pela rua
      if (!state.shopOpen && thief.state === 'entering' && pos.z >= 2.2) {
        thief.state = 'fleeing';
        thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
      }

      const speed = thief.state === 'blocked_flee' || thief.state === 'fleeing' ? 4.3 : 2.65;
      const dist = pos.distanceTo(thief.target);
      const isDespawnFlee =
        (thief.state === 'fleeing' || thief.state === 'blocked_flee') && pos.z >= 2.45;

      if (dist > 0.42) {
        const yaw = this.moveNpcDirect(
          pos,
          thief.target,
          speed,
          dt,
          isDespawnFlee ? -28 : -24.2,
          isDespawnFlee ? 28 : 24.2,
          thief.rig.root.rotation.y
        );
        thief.rig.root.rotation.y = yaw;
        animateCharacter(thief.rig, speed > 3 ? 'run' : 'walk', this.elapsed);

        const moved = Math.hypot(
          pos.x - (thief.prevX ?? pos.x),
          pos.z - (thief.prevZ ?? pos.z)
        );
        thief.prevX = pos.x;
        thief.prevZ = pos.z;

        if (moved < 0.01) {
          thief.stuckTime = (thief.stuckTime ?? 0) + dt;
        } else {
          thief.stuckTime = 0;
        }

        if ((thief.stuckTime ?? 0) > 1.1) {
          thief.stuckTime = 0;
          if (thief.state === 'entering') {
            if (pos.z < 1.35 && Math.abs(pos.x) < 4.2) {
              const spot = shelfSpots[Math.floor(Math.random() * shelfSpots.length)];
              thief.state = 'stealing';
              thief.target.set(spot[0], 0, spot[1]);
              thief.timer = 1.25;
            } else {
              thief.target.set(0, 0, 2.85);
            }
          } else if (thief.state === 'stealing') {
            if (dist < 1.65) {
              // Já está próxima da prateleira (ex: móvel na frente): realiza o roubo daqui
              thief.target.copy(pos);
            } else {
              const spot = shelfSpots[Math.floor(Math.random() * shelfSpots.length)];
              thief.target.set(spot[0], 0, spot[1]);
            }
          } else if (thief.state === 'fleeing' || thief.state === 'blocked_flee') {
            if (pos.z < 2.45) {
              pos.x = THREE.MathUtils.lerp(pos.x, 0, 0.35);
              thief.target.set(0, 0, 2.85);
            } else {
              thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
            }
          }
        }
      } else {
        thief.stuckTime = 0;
        thief.prevX = pos.x;
        thief.prevZ = pos.z;

        if (thief.state === 'entering') {
          const spot = shelfSpots[Math.floor(Math.random() * shelfSpots.length)];
          thief.state = 'stealing';
          thief.target.set(spot[0], 0, spot[1]);
          thief.timer = 1.25;
        } else if (thief.state === 'stealing') {
          animateCharacter(thief.rig, 'interact', this.elapsed);
          thief.timer -= dt;
          if (thief.timer <= 0) {
            const currentAvail = this.getState().products.filter((p) => p.stock > 0);
            if (thief.stolenCount < 5 && currentAvail.length > 0) {
              const stolenProd = currentAvail[Math.floor(Math.random() * currentAvail.length)];
              thief.stolenCount += 1;
              thief.lootMoney += stolenProd.sellPrice;
              thief.stolenProductIds.push(stolenProd.id);
              this.onTheftItem?.(stolenProd.id, stolenProd.name);
              this.onAlert?.(
                guard
                  ? `A ladra roubou ${stolenProd.name}! Valéria está indo detê-la!`
                  : `A ladra roubou ${stolenProd.name} (${thief.stolenCount}/5)! Bata nela com [F]!`
              );
              if (thief.stolenCount >= 5 || thief.stolenCount >= thief.maxSteal) {
                thief.state = 'fleeing';
                thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
              } else {
                const nextSpot = shelfSpots[Math.floor(Math.random() * shelfSpots.length)];
                thief.target.set(nextSpot[0], 0, nextSpot[1]);
                thief.timer = 1.25;
              }
            } else {
              thief.state = 'fleeing';
              thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
            }
          }
        } else if (thief.state === 'fleeing' || thief.state === 'blocked_flee') {
          if (Math.abs(pos.x) < 24.0) {
            thief.target.set(pos.x >= 0 ? 26 : -26, 0, 8.4);
          } else {
            this.scene.remove(thief.rig.root);
            this.thieves.splice(i, 1);
          }
        }
      }
    }
  }

  private pickValidShopPatrolTarget(): THREE.Vector3 {
    const extraDepth = this.getShopExpandDepth();
    for (let attempt = 0; attempt < 18; attempt++) {
      const tx = -3.0 + Math.random() * 5.4;
      const tz = -4.6 - extraDepth + Math.random() * (5.0 + extraDepth);
      const inCounterZone = tx > 0.9 && tz < -3.0 && tz > -4.5;
      const inQueueStrip = tx > 1.35 && tz >= -3.5 && tz <= 0.75;
      if (!inCounterZone && !inQueueStrip) {
        return new THREE.Vector3(tx, 0, tz);
      }
    }
    return new THREE.Vector3(-1.2, 0, -2.0);
  }

  private updateEmployees(dt: number) {
    // Valéria vai deter a ladra assim que ela roubar pelo menos 1 item
    const activeThief = this.thieves.find(
      (t) => t.stolenCount >= 1 && t.state !== 'blocked_flee'
    );

    this.employees.forEach((emp) => {
      if (emp.role === 'cashier') {
        emp.rig.root.position.set(2.35, 0, -4.85);
        emp.rig.root.rotation.y = 0;
        animateCharacter(emp.rig, 'serve', this.elapsed);
      } else if (emp.role === 'guard') {
        const pos = emp.rig.root.position;
        if (emp.actionTimer > 0) {
          emp.actionTimer -= dt;
          animateCharacter(emp.rig, 'punch', this.elapsed);
          return;
        }
        if (activeThief) {
          const tPos = activeThief.rig.root.position;
          const yaw = this.moveNpcDirect(
            pos,
            tPos,
            5.8,
            dt,
            -24.2,
            24.2,
            emp.rig.root.rotation.y
          );
          emp.rig.root.rotation.y = yaw;
          animateCharacter(emp.rig, 'run', this.elapsed);
        } else {
          const post = new THREE.Vector3(-1.1, 0, 0.45);
          if (pos.distanceTo(post) > 0.38) {
            const yaw = this.moveNpcDirect(
              pos,
              post,
              2.6,
              dt,
              -24.2,
              24.2,
              emp.rig.root.rotation.y
            );
            emp.rig.root.rotation.y = yaw;
            animateCharacter(emp.rig, 'walk', this.elapsed);
          } else {
            emp.stuckTime = 0;
            emp.rig.root.rotation.y = THREE.MathUtils.lerp(emp.rig.root.rotation.y, 0, 0.12);
            animateCharacter(emp.rig, 'idle', this.elapsed);
          }
        }
      } else {
        const pos = emp.rig.root.position;
        if (pos.distanceTo(emp.target) > 0.38) {
          const yaw = this.moveNpcDirect(
            pos,
            emp.target,
            1.85,
            dt,
            -4.0,
            4.0,
            emp.rig.root.rotation.y
          );
          emp.rig.root.rotation.y = yaw;
          animateCharacter(emp.rig, 'walk', this.elapsed);
        } else {
          emp.stuckTime = 0;
          emp.prevX = pos.x;
          emp.prevZ = pos.z;
          animateCharacter(emp.rig, 'interact', this.elapsed);
          emp.timer -= dt;
          if (emp.timer <= 0) {
            emp.timer = 3 + Math.random() * 2;
            emp.target.copy(this.pickValidShopPatrolTarget());
          }
        }
      }
    });
  }

  private updateWeather(dt: number) {
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const sequence: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'cloudy'];
      this.weatherCycleIdx = (this.weatherCycleIdx + 1) % sequence.length;
      this.weather = sequence[this.weatherCycleIdx];
      this.weatherTimer = this.weather === 'rainy' ? 40 : 48;
      this.onWeatherChange?.(this.weather);
    }

    const targetCloud = this.weather === 'rainy' ? 1.0 : this.weather === 'cloudy' ? 0.72 : 0.0;
    const targetRain = this.weather === 'rainy' ? 1.0 : 0.0;
    this.cloudiness = THREE.MathUtils.damp(this.cloudiness, targetCloud, 0.75, dt);
    this.raininess = THREE.MathUtils.damp(this.raininess, targetRain, 0.95, dt);

    // Animação suave das nuvens 3D
    this.world.cloudsGroup.children.forEach((child) => {
      const speed = (child.userData.speed as number) || 0.5;
      const baseScale = (child.userData.baseScale as number) || 1.2;
      child.position.x += speed * (1 + this.raininess * 0.9) * dt;
      if (child.position.x > 56) child.position.x = -56;
      const s = baseScale * (1 + this.cloudiness * 0.35);
      child.scale.setScalar(s);
    });

    // Sistema de partículas de chuva (bloqueado pelos telhados da loja e da casa)
    if (this.raininess > 0.02) {
      this.world.rainPoints.visible = true;
      this.world.rainMat.opacity = this.raininess * 0.78;
      this.world.rainPoints.position.set(this.playerPos.x, 0, this.playerPos.z);

      const extraDepth = this.getShopExpandDepth();

      const posAttr = this.world.rainPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = this.world.rainPositions;
      const fallSpeed = 14 + this.raininess * 4;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += 1.8 * dt;
        arr[i + 1] -= fallSpeed * dt;
        if (arr[i] > 22) arr[i] = -22;

        const wx = this.world.rainPoints.position.x + arr[i];
        const wz = this.world.rainPoints.position.z + arr[i + 2];
        const underShopRoof =
          Math.abs(wx) <= 4.65 &&
          wz >= -6.1 - extraDepth &&
          wz <= 2.65;
        const underHouseRoof =
          wx >= -18.5 && wx <= -9.5 && wz >= -6.0 && wz <= 2.05;

        if (underShopRoof || underHouseRoof) {
          // Para a chuva no nível do telhado: nenhuma gota entra dentro da loja ou da casa
          if (arr[i + 1] <= 3.75) {
            arr[i + 1] = 4.2 + Math.random() * 15.8;
          }
        } else if (arr[i + 1] < 0) {
          arr[i + 1] = 20;
          arr[i] = (Math.random() - 0.5) * 44;
          arr[i + 2] = (Math.random() - 0.5) * 44;
        }
      }
      posAttr.needsUpdate = true;
    } else {
      this.world.rainPoints.visible = false;
    }
  }

  private updateDayNight(dt: number) {
    // 20 segundos reais = 1 hora (60 minutos) no jogo -> ritmo dinâmico e rápido
    const IN_GAME_MINUTES_PER_REAL_SEC = 3.0;
    this.currentTimeMinutes += dt * IN_GAME_MINUTES_PER_REAL_SEC;
    let newDay = false;
    // Às 19:00 (1140 minutos) o expediente termina, o dia acaba e passa para o próximo dia às 08:00
    if (this.currentTimeMinutes >= 1140) {
      this.currentTimeMinutes = 480; // Já amanhece às 08:00 da manhã
      newDay = true;
      this.respawnAllNpcsForNewDay();
    }
    const nextTime = this.currentTimeMinutes;
    this.onTimeTick(nextTime, newDay);

    // Paleta suave com brilho moderado para o céu não estourar
    const morningTop = new THREE.Color('#6ca6d8');
    const morningHorizon = new THREE.Color('#9ec4e4');
    const afternoonTop = new THREE.Color('#5d98cc');
    const afternoonHorizon = new THREE.Color('#94bce0');
    const duskTop = new THREE.Color('#7b679a');
    const duskHorizon = new THREE.Color('#e0946c');
    const nightTop = new THREE.Color('#131f33');
    const nightHorizon = new THREE.Color('#233754');

    const morningSun = new THREE.Color('#fff4dc');
    const afternoonSun = new THREE.Color('#ffdca3');
    const duskSun = new THREE.Color('#ff9494');
    const nightSun = new THREE.Color('#8fadff');

    const topCol = morningTop.clone();
    const horizonCol = morningHorizon.clone();
    const sunColor = morningSun.clone();
    let sunIntensity = 1.18;
    let hemiIntensity = 0.68;

    if (nextTime < 360) {
      topCol.copy(nightTop);
      horizonCol.copy(nightHorizon);
      sunColor.copy(nightSun);
      sunIntensity = 0.42;
      hemiIntensity = 0.42;
    } else if (nextTime < 480) {
      const t = (nextTime - 360) / 120;
      topCol.lerpColors(nightTop, morningTop, t);
      horizonCol.lerpColors(nightHorizon, morningHorizon, t);
      sunColor.lerpColors(nightSun, morningSun, t);
      sunIntensity = 0.42 + t * 0.76;
      hemiIntensity = 0.42 + t * 0.26;
    } else if (nextTime < 720) {
      const t = (nextTime - 480) / 240;
      topCol.lerpColors(morningTop, afternoonTop, t);
      horizonCol.lerpColors(morningHorizon, afternoonHorizon, t);
      sunColor.lerpColors(morningSun, afternoonSun, t);
      sunIntensity = 1.15 + t * 0.1;
      hemiIntensity = 0.68;
    } else if (nextTime < 1020) {
      const t = (nextTime - 720) / 300;
      topCol.lerpColors(afternoonTop, duskTop, t * 0.35);
      horizonCol.lerpColors(afternoonHorizon, duskHorizon, t * 0.38);
      sunColor.copy(afternoonSun);
      sunIntensity = 1.24;
      hemiIntensity = 0.68;
    } else if (nextTime < 1140) {
      const t = (nextTime - 1020) / 120;
      topCol.lerpColors(duskTop, nightTop, t);
      horizonCol.lerpColors(duskHorizon, nightHorizon, t);
      sunColor.lerpColors(duskSun, nightSun, t);
      sunIntensity = 1.15 - t * 0.72;
      hemiIntensity = 0.64 - t * 0.22;
    } else {
      topCol.copy(nightTop);
      horizonCol.copy(nightHorizon);
      sunColor.copy(nightSun);
      sunIntensity = 0.42;
      hemiIntensity = 0.42;
    }

    // Mescla o clima dinâmico (nublado/chuva) mantendo compatibilidade com dia/noite
    const isEveningFactor = nextTime >= 1020 || nextTime < 420 ? 1 : 0;
    const overcastTop = new THREE.Color(isEveningFactor ? '#293545' : '#6f8296');
    const overcastHorizon = new THREE.Color(isEveningFactor ? '#3b4a5e' : '#8fa1b3');
    const rainyTop = new THREE.Color(isEveningFactor ? '#1f2836' : '#536475');
    const rainyHorizon = new THREE.Color(isEveningFactor ? '#2e3a4a' : '#6c7e91');

    if (this.cloudiness > 0.01) {
      topCol.lerp(overcastTop, this.cloudiness * 0.7);
      horizonCol.lerp(overcastHorizon, this.cloudiness * 0.7);
    }
    if (this.raininess > 0.01) {
      topCol.lerp(rainyTop, this.raininess * 0.65);
      horizonCol.lerp(rainyHorizon, this.raininess * 0.65);
    }

    const weatherLightFactor = 1 - this.cloudiness * 0.28 - this.raininess * 0.22;
    sunIntensity *= weatherLightFactor;
    hemiIntensity *= 1 - this.cloudiness * 0.14 - this.raininess * 0.12;

    // Atualiza SkyDome + background + Fog combinados
    this.world.skyDome.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.world.skyUniforms.topColor.value.copy(topCol);
    this.world.skyUniforms.horizonColor.value.copy(horizonCol);
    this.world.skyUniforms.bottomColor.value.set('#73ad88').lerp(horizonCol, 0.35);

    const fogCol = horizonCol.clone().multiplyScalar(this.world.skyUniforms.brightness.value);
    this.scene.background = fogCol;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(fogCol);
      this.scene.fog.near = 46 - this.cloudiness * 10 - this.raininess * 10;
      this.scene.fog.far = 135 - this.cloudiness * 24 - this.raininess * 22;
    }

    // Movimento celestial do Sol (08:00 -> 18:15)
    const sunProgress = THREE.MathUtils.clamp((nextTime - 480) / (1095 - 480), 0, 1);
    const sunTheta = 0.2 + sunProgress * (Math.PI - 0.34);
    const sunX = Math.cos(sunTheta) * 62;
    const sunY = Math.sin(sunTheta) * 48;
    const sunZ = -48;
    this.world.sunGroup.position.set(sunX, sunY, sunZ);
    const sunFade =
      nextTime < 460 || nextTime > 1095
        ? 0
        : nextTime > 1030
        ? 1 - (nextTime - 1030) / 65
        : 1;
    const sunWeatherFade = Math.max(0.15, 1 - this.cloudiness * 0.65 - this.raininess * 0.2);
    this.world.sunGroup.visible = sunFade > 0.02;
    this.world.sunCoreMat.opacity = sunFade * sunWeatherFade;
    this.world.sunGlowMat.opacity = 0.24 * sunFade * sunWeatherFade;

    // Direção do Sol acompanha arco suave sem achatar as sombras
    this.sunLight.position.set(sunX * 0.35, Math.max(12, sunY * 0.52), 14);
    this.sunLight.color.copy(sunColor);
    this.sunLight.intensity = sunIntensity;
    this.hemiLight.intensity = hemiIntensity;

    // Movimento celestial da Lua (sobe visivelmente a partir das 16:50 até as 19:00)
    const moonRise =
      nextTime >= 1010
        ? THREE.MathUtils.clamp((nextTime - 1010) / 115, 0, 1)
        : nextTime < 420
        ? 1
        : 0;
    const moonX = THREE.MathUtils.lerp(42, 16, moonRise);
    const moonY = THREE.MathUtils.lerp(4, 34, moonRise);
    this.world.moonGroup.position.set(moonX, moonY, -50);
    const moonFade =
      nextTime >= 1010
        ? THREE.MathUtils.smoothstep(nextTime, 1010, 1080)
        : nextTime < 360
        ? 1
        : nextTime < 440
        ? 1 - (nextTime - 360) / 80
        : 0;
    const moonWeatherFade = Math.max(0.2, 1 - this.cloudiness * 0.45 - this.raininess * 0.4);
    this.world.moonGroup.visible = moonFade > 0.02;
    this.world.moonCoreMat.opacity = moonFade * moonWeatherFade;
    this.world.moonGlowMat.opacity = 0.2 * moonFade * moonWeatherFade;

    // Estrelas ao entardecer/noite
    const starFade =
      nextTime >= 1040
        ? THREE.MathUtils.smoothstep(nextTime, 1040, 1125)
        : nextTime < 360
        ? 1
        : nextTime < 420
        ? 1 - (nextTime - 360) / 60
        : 0;
    this.world.starsMat.opacity = starFade * Math.max(0.1, 1 - this.cloudiness * 0.75 - this.raininess * 0.2);

    // Tonalidade das nuvens conforme hora do dia + clima
    const cloudDay = new THREE.Color('#f4f7fb');
    const cloudDusk = new THREE.Color('#f0c8be');
    const cloudNight = new THREE.Color('#4d5f78');
    const cloudOvercast = new THREE.Color(isEveningFactor ? '#48566a' : '#b7c2cf');
    const cloudRainy = new THREE.Color(isEveningFactor ? '#364152' : '#7f8fa1');

    const cloudTint = cloudDay.clone();
    if (nextTime >= 1020) {
      const dtT = Math.min(1, (nextTime - 1020) / 120);
      cloudTint.lerpColors(cloudDusk, cloudNight, dtT);
    } else if (nextTime < 420) {
      cloudTint.copy(cloudNight);
    }
    if (this.cloudiness > 0.01) cloudTint.lerp(cloudOvercast, this.cloudiness * 0.8);
    if (this.raininess > 0.01) cloudTint.lerp(cloudRainy, this.raininess * 0.75);
    this.world.cloudMats.forEach((m, idx) => {
      m.color.copy(cloudTint).multiplyScalar(idx === 0 ? 1 : 0.94);
      m.opacity = 0.78 + this.cloudiness * 0.16;
    });

    const isDuskOrNight = nextTime >= 1020 || nextTime < 420;
    const lampFactor =
      nextTime >= 1020
        ? Math.min(1, (nextTime - 1020) / 60)
        : nextTime < 360
        ? 1
        : nextTime < 420
        ? 1 - (nextTime - 360) / 60
        : 0;

    this.world.streetLights.forEach((l) => (l.intensity = lampFactor * 2.0));
    this.world.shopLights.forEach((l) => (l.intensity = 0.4 + lampFactor * 1.4));
    this.world.lampBulbs.forEach((m) => (m.emissiveIntensity = 0.1 + lampFactor * 1.3));
    this.world.windowMats.forEach((m) => (m.emissiveIntensity = isDuskOrNight ? lampFactor * 0.8 : 0));
  }

  private tick = () => {
    if (this.disposed) return;
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;

    this.updatePlayer(dt);
    this.updateNpcs(dt);
    this.updateThieves(dt);
    this.updateEmployees(dt);
    this.updateDeliveryTruck(dt);
    this.updateWeather(dt);
    this.updateDayNight(dt);

    // Animate shop double doors when player, NPCs or thieves are near the doorway
    const doorPos = new THREE.Vector3(0, 0, 1.7);
    const someoneNearDoor =
      this.playerPos.distanceTo(doorPos) < 2.6 ||
      this.npcs.some((n) => n.rig.root.position.distanceTo(doorPos) < 2.6) ||
      this.thieves.some((t) => t.rig.root.position.distanceTo(doorPos) < 2.6);
    const targetOpen = someoneNearDoor ? Math.PI * 0.48 : 0;
    this.world.shopDoorLeft.rotation.y = THREE.MathUtils.lerp(
      this.world.shopDoorLeft.rotation.y,
      -targetOpen,
      0.12
    );
    this.world.shopDoorRight.rotation.y = THREE.MathUtils.lerp(
      this.world.shopDoorRight.rotation.y,
      targetOpen,
      0.12
    );

    // Animate Elizene's house glass double doors when unlocked and player is near
    const state = this.getState();
    const houseDoorPos = new THREE.Vector3(-14.0, 0, 1.6);
    const nearHouseDoor = state.houseUnlocked && this.playerPos.distanceTo(houseDoorPos) < 2.5;
    const houseOpenAngle = nearHouseDoor ? Math.PI * 0.48 : 0;
    this.world.houseDoorLeft.rotation.y = THREE.MathUtils.lerp(
      this.world.houseDoorLeft.rotation.y,
      -houseOpenAngle,
      0.12
    );
    this.world.houseDoorRight.rotation.y = THREE.MathUtils.lerp(
      this.world.houseDoorRight.rotation.y,
      houseOpenAngle,
      0.12
    );

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
