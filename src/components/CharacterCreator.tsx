import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  AccessoryType,
  BagType,
  ElizeneCustomization,
  EyeStyle,
  HairStyle,
  OutfitType,
  PASTEL_PALETTE,
  SkinTone,
} from '../types/game';
import { animateCharacter, buildCharacter, CharacterRig } from '../game/characterBuilder';
import { Check, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface CharacterCreatorProps {
  customization: ElizeneCustomization;
  onChange: (next: ElizeneCustomization) => void;
  onConfirm: () => void;
}

const SKIN_TONES: SkinTone[] = ['#fde2c4', '#f5c6a5', '#e0a370', '#b57445', '#7a4928'];
const HAIR_COLORS = ['#5c3a21', '#222222', '#c98a4b', '#e6b89c', '#b56576', '#9d79d6'];
const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'long', label: 'Longo' },
  { id: 'ponytail', label: 'Rabo de Cavalo' },
  { id: 'bun', label: 'Coque' },
  { id: 'bob', label: 'Chanel' },
];
const EYE_STYLES: { id: EyeStyle; label: string }[] = [
  { id: 'sweet', label: 'Doce' },
  { id: 'sparkly', label: 'Brilhante' },
  { id: 'cat', label: 'Gatinho' },
];
const OUTFIT_TYPES: { id: OutfitType; label: string }[] = [
  { id: 'dress', label: 'Vestido' },
  { id: 'skirt', label: 'Saia + Blusa' },
  { id: 'pants', label: 'Calça + Blusa' },
];
const BAG_TYPES: { id: BagType; label: string }[] = [
  { id: 'none', label: 'Sem Bolsa' },
  { id: 'tote', label: 'Bolsa Tote' },
  { id: 'crossbody', label: 'Transversal' },
];
const ACCESSORIES: { id: AccessoryType; label: string }[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'bow', label: 'Laço' },
  { id: 'necklace', label: 'Colar' },
  { id: 'earrings', label: 'Brincos' },
  { id: 'bracelet', label: 'Pulseira' },
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  customization,
  onChange,
  onConfirm,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 1.35, 3.4);
    camera.lookAt(0, 1.0, 0);

    const hemi = new THREE.HemisphereLight('#ffffff', '#f9c5d1', 1.1);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight('#fff8e7', 1.2);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.75, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: '#ffc2d1', roughness: 0.5 })
    );
    ped.position.y = -0.05;
    scene.add(ped);

    let frameId = 0;
    let t = 0;
    const loop = () => {
      t += 0.016;
      if (rigRef.current) {
        animateCharacter(rigRef.current, 'idle', t);
        rigRef.current.root.rotation.y = Math.sin(t * 0.6) * 0.35;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (rigRef.current) {
      scene.remove(rigRef.current.root);
    }
    const rig = buildCharacter(customization);
    rigRef.current = rig;
    scene.add(rig.root);
  }, [customization]);

  const update = <K extends keyof ElizeneCustomization>(
    key: K,
    val: ElizeneCustomization[K]
  ) => {
    soundEngine.playClick();
    onChange({ ...customization, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#fff0f3] p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border-2 border-[#ffc2d1] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left: 3D Preview */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#ffe5ec] to-[#f8edeb] flex flex-col items-center justify-between p-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b56576]">
              <Sparkles className="w-3.5 h-3.5" /> Personalização
            </span>
            <h2 className="text-2xl font-extrabold text-[#6d597a]">Elizene</h2>
          </div>

          <div ref={previewRef} className="w-full h-72 sm:h-80" />

          <button
            onClick={() => {
              soundEngine.playPurchase();
              onConfirm();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#ff758f] hover:bg-[#ff5c7c] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-5 h-5" />
            Pronta para Jogar!
          </button>
        </div>

        {/* Right: Options */}
        <div className="md:col-span-7 p-6 max-h-[82vh] overflow-y-auto space-y-5">
          {/* Skin Tone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
              Cor da Pele
            </label>
            <div className="flex gap-2.5">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => update('skinTone', tone)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer ${
                    customization.skinTone === tone
                      ? 'border-[#ff758f] scale-110'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>
          </div>

          {/* Hair Style & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Penteado
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_STYLES.map((hs) => (
                  <button
                    key={hs.id}
                    onClick={() => update('hairStyle', hs.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      customization.hairStyle === hs.id
                        ? 'bg-[#ffe5ec] border-[#ff758f] text-[#b56576]'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {hs.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Cor do Cabelo
              </label>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((hc) => (
                  <button
                    key={hc}
                    onClick={() => update('hairColor', hc)}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                      customization.hairColor === hc
                        ? 'border-[#ff758f] scale-110'
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: hc }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Eyes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
              Formato dos Olhos
            </label>
            <div className="flex gap-2">
              {EYE_STYLES.map((es) => (
                <button
                  key={es.id}
                  onClick={() => update('eyeStyle', es.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    customization.eyeStyle === es.id
                      ? 'bg-[#ffe5ec] border-[#ff758f] text-[#b56576]'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {es.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outfit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Tipo de Roupa
              </label>
              <div className="flex flex-wrap gap-2">
                {OUTFIT_TYPES.map((ot) => (
                  <button
                    key={ot.id}
                    onClick={() => update('outfitType', ot.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      customization.outfitType === ot.id
                        ? 'bg-[#ffe5ec] border-[#ff758f] text-[#b56576]'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {ot.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Cor da Roupa
              </label>
              <div className="flex flex-wrap gap-2">
                {PASTEL_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => update('topColor', c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                      customization.topColor === c.hex
                        ? 'border-[#ff758f] scale-110'
                        : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bag & Accessory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Bolsa
              </label>
              <div className="flex flex-wrap gap-2">
                {BAG_TYPES.map((bt) => (
                  <button
                    key={bt.id}
                    onClick={() => update('bagType', bt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      customization.bagType === bt.id
                        ? 'bg-[#ffe5ec] border-[#ff758f] text-[#b56576]'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d597a] mb-2">
                Acessórios
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map((ac) => (
                  <button
                    key={ac.id}
                    onClick={() => update('accessory', ac.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      customization.accessory === ac.id
                        ? 'bg-[#ffe5ec] border-[#ff758f] text-[#b56576]'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {ac.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
