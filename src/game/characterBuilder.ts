import * as THREE from 'three';
import { ElizeneCustomization } from '../types/game';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'wave'
  | 'dance'
  | 'interact'
  | 'serve'
  | 'holdBag'
  | 'sit'
  | 'punch';

export interface BuildCharacterOptions {
  isThief?: boolean;
  isStrong?: boolean;
  weaponLevel?: number;
}

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  bagMesh?: THREE.Group;
}

export function buildCharacter(
  custom: ElizeneCustomization,
  options?: BuildCharacterOptions
): CharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  if (options?.isStrong) {
    root.scale.set(1.12, 1.08, 1.12);
  }

  const skinMat = new THREE.MeshStandardMaterial({
    color: custom.skinTone,
    roughness: 0.65,
    metalness: 0.02,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: custom.topColor,
    roughness: 0.55,
    metalness: 0.05,
  });
  const bottomMat = new THREE.MeshStandardMaterial({
    color: custom.bottomColor,
    roughness: 0.6,
    metalness: 0.05,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: custom.shoeColor,
    roughness: 0.35,
    metalness: 0.1,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: custom.hairColor,
    roughness: 0.5,
    metalness: 0.08,
  });

  // Torso (Roblox-inspired rounded block)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.64, 0.32), topMat);
  torso.position.y = 1.02;
  if (options?.isStrong) {
    torso.scale.set(1.24, 1.04, 1.22);
  }
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  if (options?.isStrong) {
    const badge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 6),
      new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.25, metalness: 0.75 })
    );
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0.16, 1.15, 0.2);
    bodyGroup.add(badge);
  }

  // Outfit variations
  if (custom.outfitType === 'dress') {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.44, 0.44, 16),
      topMat
    );
    skirt.position.y = 0.64;
    skirt.castShadow = true;
    bodyGroup.add(skirt);
  } else if (custom.outfitType === 'skirt') {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.4, 0.36, 16),
      bottomMat
    );
    skirt.position.y = 0.66;
    skirt.castShadow = true;
    bodyGroup.add(skirt);
  }

  // Legs
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.15, 0.7, 0);
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.15, 0.7, 0);

  const legMat = custom.outfitType === 'pants' ? bottomMat : skinMat;
  const createLeg = () => {
    const g = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.54, 0.22), legMat);
    leg.position.y = -0.27;
    leg.castShadow = true;
    g.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.28), shoeMat);
    shoe.position.set(0, -0.62, 0.03);
    shoe.castShadow = true;
    g.add(shoe);
    return g;
  };

  leftLegPivot.add(createLeg());
  rightLegPivot.add(createLeg());
  bodyGroup.add(leftLegPivot, rightLegPivot);

  // Arms
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(options?.isStrong ? -0.47 : -0.4, 1.28, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(options?.isStrong ? 0.47 : 0.4, 1.28, 0);

  const createArm = () => {
    const g = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.22), topMat);
    sleeve.position.y = -0.1;
    sleeve.castShadow = true;
    g.add(sleeve);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.18), skinMat);
    arm.position.y = -0.36;
    arm.castShadow = true;
    g.add(arm);
    if (options?.isStrong) {
      g.scale.set(1.28, 1.04, 1.28);
    }
    return g;
  };

  leftArmPivot.add(createArm());
  rightArmPivot.add(createArm());
  bodyGroup.add(leftArmPivot, rightArmPivot);

  // Bracelet accessory
  if (custom.accessory === 'bracelet') {
    const bracelet = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.25, metalness: 0.7 })
    );
    bracelet.rotation.x = Math.PI / 2;
    bracelet.position.y = -0.45;
    rightArmPivot.add(bracelet);
  }

  // Defense weapon in hand when upgraded
  if (options?.weaponLevel && options.weaponLevel > 0) {
    const weaponGroup = new THREE.Group();
    const bodyColor =
      options.weaponLevel >= 3 ? '#ff758f' : options.weaponLevel === 2 ? '#2b2d42' : '#495057';
    const tipColor =
      options.weaponLevel >= 3 ? '#ffd166' : options.weaponLevel === 2 ? '#38bdf8' : '#2ec4b6';

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.15, 0.08),
      new THREE.MeshStandardMaterial({ color: '#1b1b1e', roughness: 0.55 })
    );
    grip.position.set(0, -0.02, 0);

    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, 0.34),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.55 })
    );
    barrel.position.set(0, 0.06, 0.14);
    barrel.castShadow = true;

    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.07, 10),
      new THREE.MeshStandardMaterial({
        color: tipColor,
        emissive: tipColor,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0.06, 0.33);

    weaponGroup.add(grip, barrel, tip);
    weaponGroup.position.set(0, -0.54, 0.08);
    rightArmPivot.add(weaponGroup);
  }

  // Bag
  let bagMesh: THREE.Group | undefined;
  if (custom.bagType !== 'none') {
    bagMesh = new THREE.Group();
    const bagMat = new THREE.MeshStandardMaterial({
      color: custom.bagColor,
      roughness: 0.45,
      metalness: 0.1,
    });
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.12), bagMat);
    bagBody.castShadow = true;
    bagMesh.add(bagBody);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.018, 8, 12, Math.PI),
      bagMat
    );
    handle.position.y = 0.11;
    bagMesh.add(handle);

    bagMesh.position.set(0, -0.58, 0.06);
    rightArmPivot.add(bagMesh);
  }

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.46, 0.46), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Blush
  const blushMat = new THREE.MeshStandardMaterial({ color: '#ff9ebb', roughness: 0.8 });
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), blushMat);
  blushL.scale.set(1.2, 0.7, 0.4);
  blushL.position.set(-0.14, -0.05, 0.23);
  const blushR = blushL.clone();
  blushR.position.x = 0.14;
  headGroup.add(blushL, blushR);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: custom.eyeColor, roughness: 0.2 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 });
  const eyeRadius = custom.eyeStyle === 'sparkly' ? 0.05 : 0.042;
  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 10, 10), eyeMat);
    eye.scale.set(1, custom.eyeStyle === 'cat' ? 0.85 : 1.15, 0.5);
    eye.position.set(ex, 0.02, 0.23);
    headGroup.add(eye);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), whiteMat);
    glint.position.set(ex + 0.015, 0.04, 0.248);
    headGroup.add(glint);
  });

  // Smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.01, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#d46a7e', roughness: 0.5 })
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.09, 0.232);
  headGroup.add(smile);

  // Hair
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.5), hairMat);
  hairTop.position.set(0, 0.22, 0);
  hairTop.castShadow = true;
  headGroup.add(hairTop);

  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.08), hairMat);
  bangs.position.set(0, 0.14, 0.22);
  headGroup.add(bangs);

  if (custom.hairStyle === 'long') {
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.65, 0.14), hairMat);
    backHair.position.set(0, -0.1, -0.2);
    backHair.castShadow = true;
    headGroup.add(backHair);
  } else if (custom.hairStyle === 'ponytail') {
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.12), hairMat);
    backHair.position.set(0, 0.04, -0.21);
    headGroup.add(backHair);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.48, 10), hairMat);
    tail.position.set(0, -0.05, -0.34);
    tail.rotation.x = 0.25;
    tail.castShadow = true;
    headGroup.add(tail);
  } else if (custom.hairStyle === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), hairMat);
    bun.position.set(0, 0.34, -0.05);
    bun.castShadow = true;
    headGroup.add(bun);
  } else if (custom.hairStyle === 'bob') {
    const bobBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.36, 0.16), hairMat);
    bobBack.position.set(0, 0.02, -0.18);
    headGroup.add(bobBack);
  }

  // Accessories
  if (custom.accessory === 'bow') {
    const bowMat = new THREE.MeshStandardMaterial({ color: '#ff8fab', roughness: 0.4 });
    const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), bowMat);
    bowL.rotation.z = -Math.PI / 2;
    bowL.position.set(-0.08, 0.32, 0.12);
    const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), bowMat);
    bowR.rotation.z = Math.PI / 2;
    bowR.position.set(0.08, 0.32, 0.12);
    headGroup.add(bowL, bowR);
  } else if (custom.accessory === 'necklace') {
    const necklace = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.02, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#fff3d6', roughness: 0.2, metalness: 0.6 })
    );
    necklace.rotation.x = Math.PI / 2;
    necklace.position.set(0, 1.35, 0.04);
    bodyGroup.add(necklace);
  } else if (custom.accessory === 'earrings') {
    const earMat = new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.2, metalness: 0.8 });
    [-0.26, 0.26].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), earMat);
      ear.position.set(x, -0.05, 0);
      headGroup.add(ear);
    });
  }

  if (options?.isThief) {
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.13, 0.48),
      new THREE.MeshStandardMaterial({ color: '#1b1b1e', roughness: 0.55 })
    );
    mask.position.set(0, 0.02, 0.01);
    headGroup.add(mask);

    const alertMarker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: '#e63946' })
    );
    alertMarker.position.set(0, 0.55, 0);
    headGroup.add(alertMarker);
  }

  if (options?.isStrong) {
    const shades = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.1, 0.08),
      new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.15, metalness: 0.7 })
    );
    shades.position.set(0, 0.03, 0.235);
    headGroup.add(shades);
  }

  return {
    root,
    bodyGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    bagMesh,
  };
}

export function animateCharacter(
  rig: CharacterRig,
  state: CharacterAnimState,
  time: number
) {
  const lerp = THREE.MathUtils.lerp;
  const k = 0.22;

  let targetBodyY = 0;
  let targetBodyRotY = 0;
  let targetHeadRotX = 0;
  let targetHeadRotZ = 0;
  let targetLArmX = 0;
  let targetLArmZ = 0.06;
  let targetRArmX = 0;
  let targetRArmZ = -0.06;
  let targetLLegX = 0;
  let targetRLegX = 0;

  if (state === 'idle') {
    targetBodyY = Math.sin(time * 2.2) * 0.02;
    targetLArmZ = 0.06 + Math.sin(time * 2) * 0.025;
    targetRArmZ = -0.06 - Math.sin(time * 2) * 0.025;
    targetHeadRotZ = Math.sin(time * 1.1) * 0.03;
  } else if (state === 'walk' || state === 'run') {
    const speed = state === 'run' ? 12 : 7;
    const amp = state === 'run' ? 0.8 : 0.5;
    const s = Math.sin(time * speed);
    targetLLegX = s * amp;
    targetRLegX = -s * amp;
    targetLArmX = -s * amp * 0.8;
    targetRArmX = s * amp * 0.8;
    targetBodyY = Math.abs(Math.cos(time * speed)) * 0.05;
    targetBodyRotY = s * 0.05;
  } else if (state === 'jump') {
    targetLArmZ = 0.6;
    targetRArmZ = -0.6;
    targetLLegX = 0.35;
    targetRLegX = -0.25;
  } else if (state === 'wave') {
    targetRArmZ = -2.4 + Math.sin(time * 10) * 0.35;
    targetHeadRotZ = Math.sin(time * 5) * 0.08;
  } else if (state === 'dance') {
    targetBodyY = Math.abs(Math.sin(time * 7)) * 0.12;
    targetBodyRotY = Math.sin(time * 3.5) * 0.4;
    targetLArmZ = 0.8 + Math.sin(time * 7) * 0.5;
    targetRArmZ = -0.8 - Math.sin(time * 7) * 0.5;
    targetLLegX = Math.sin(time * 7) * 0.3;
    targetRLegX = -Math.sin(time * 7) * 0.3;
  } else if (state === 'interact' || state === 'serve') {
    targetRArmX = -1.1 + Math.sin(time * 8) * 0.25;
    targetLArmX = -0.4;
    targetHeadRotX = 0.1;
  } else if (state === 'holdBag') {
    targetRArmX = -0.5;
  } else if (state === 'sit') {
    targetBodyY = -0.22;
    targetLLegX = -Math.PI / 2;
    targetRLegX = -Math.PI / 2;
    targetLArmX = -0.35;
    targetRArmX = -0.35;
    targetLArmZ = 0.1;
    targetRArmZ = -0.1;
    targetHeadRotZ = Math.sin(time * 0.9) * 0.03;
  } else if (state === 'punch') {
    targetBodyY = 0.04;
    targetBodyRotY = 0.38;
    targetRArmX = -1.65;
    targetRArmZ = -0.12;
    targetLArmX = -0.65;
    targetLArmZ = 0.25;
    targetLLegX = -0.22;
    targetRLegX = 0.22;
    targetHeadRotX = -0.06;
  }

  rig.bodyGroup.position.y = lerp(rig.bodyGroup.position.y, targetBodyY, k);
  rig.bodyGroup.rotation.y = lerp(rig.bodyGroup.rotation.y, targetBodyRotY, k);
  rig.headGroup.rotation.x = lerp(rig.headGroup.rotation.x, targetHeadRotX, k);
  rig.headGroup.rotation.z = lerp(rig.headGroup.rotation.z, targetHeadRotZ, k);

  rig.leftArmPivot.rotation.x = lerp(rig.leftArmPivot.rotation.x, targetLArmX, k);
  rig.leftArmPivot.rotation.z = lerp(rig.leftArmPivot.rotation.z, targetLArmZ, k);
  rig.rightArmPivot.rotation.x = lerp(rig.rightArmPivot.rotation.x, targetRArmX, k);
  rig.rightArmPivot.rotation.z = lerp(rig.rightArmPivot.rotation.z, targetRArmZ, k);

  rig.leftLegPivot.rotation.x = lerp(rig.leftLegPivot.rotation.x, targetLLegX, k);
  rig.rightLegPivot.rotation.x = lerp(rig.rightLegPivot.rotation.x, targetRLegX, k);
}
