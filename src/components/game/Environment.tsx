import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  SphereGeometry,
  TextureLoader,
} from 'three';
import type { BufferGeometry, Material, Texture } from 'three';
import {
  BANNER_CAPACITY,
  BANNER_KINDS,
  BANNER_TEXTURES,
  CHUNK_CAPACITY,
  CHUNK_COUNT,
  CHUNK_LENGTH,
} from '../../game/constants';
import { generateChunk } from '../../game/chunkGenerator';
import { runtime } from '../../game/state';
import type { BannerKind, InstanceKind } from '../../types';
import {
  createBannerMaterial,
  createBuildingMaterial,
  createEmissiveMaterial,
  createPropMaterial,
} from '../../utils/bendMaterial';
import { positiveMod } from '../../utils/math';

const KINDS: readonly InstanceKind[] = ['box', 'cylinder', 'cone', 'sphere', 'lamp'];

interface Slot {
  group: Group;
  meshes: Record<InstanceKind, InstancedMesh>;
  bannerMeshes: Record<BannerKind, InstancedMesh>;
  worldIndex: number;
}

function createResources() {
  const geometry: Record<InstanceKind, BufferGeometry> = {
    box: new BoxGeometry(1, 1, 1),
    cylinder: new CylinderGeometry(0.5, 0.5, 1, 14, 1),
    cone: new ConeGeometry(0.5, 1, 12),
    sphere: new SphereGeometry(0.5, 14, 9),
    lamp: new BoxGeometry(1, 1, 1),
  };
  const props = createPropMaterial();
  const material: Record<InstanceKind, Material> = {
    box: createBuildingMaterial(false),
    cylinder: createBuildingMaterial(true),
    cone: props,
    sphere: props,
    lamp: createEmissiveMaterial(),
  };

  const loader = new TextureLoader();
  const texA = loader.load(BANNER_TEXTURES.bannerA);
  texA.colorSpace = SRGBColorSpace;
  const texB = loader.load(BANNER_TEXTURES.bannerB);
  texB.colorSpace = SRGBColorSpace;
  const texFlag = loader.load(BANNER_TEXTURES.flagQatar);
  texFlag.colorSpace = SRGBColorSpace;

  const bannerGeometry = new PlaneGeometry(1, 1);
  const bannerMaterials: Record<BannerKind, Material> = {
    bannerA: createBannerMaterial(texA, 'bend-banner-a'),
    bannerB: createBannerMaterial(texB, 'bend-banner-b'),
    flagQatar: createBannerMaterial(texFlag, 'bend-flag-qatar'),
  };

  return {
    geometry,
    material,
    bannerGeometry,
    bannerMaterials,
    bannerTextures: [texA, texB, texFlag] as Texture[],
  };
}

function createSlot(res: ReturnType<typeof createResources>): Slot {
  const group = new Group();
  const meshes = {} as Record<InstanceKind, InstancedMesh>;
  for (const kind of KINDS) {
    const cap = CHUNK_CAPACITY[kind];
    const mesh = new InstancedMesh(res.geometry[kind], res.material[kind], cap);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(cap * 3), 3); // allocated up-front so the shader variant never changes
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    meshes[kind] = mesh;
  }

  const bannerMeshes = {} as Record<BannerKind, InstancedMesh>;
  for (const kind of BANNER_KINDS) {
    const cap = BANNER_CAPACITY[kind];
    const mesh = new InstancedMesh(res.bannerGeometry, res.bannerMaterials[kind], cap);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
    bannerMeshes[kind] = mesh;
  }

  return { group, meshes, bannerMeshes, worldIndex: Number.NaN };
}

const tmp = new Object3D();
const tmpBanner = new Object3D();
const tmpColor = new Color();

/** (Re)writes a pooled slot with the scenery for `worldIndex` – no allocation of GPU objects. */
function fillSlot(slot: Slot, worldIndex: number) {
  const counts: Record<InstanceKind, number> = { box: 0, cylinder: 0, cone: 0, sphere: 0, lamp: 0 };
  const { instances, banners } = generateChunk(worldIndex);

  for (const inst of instances) {
    const mesh = slot.meshes[inst.kind];
    const i = counts[inst.kind];
    if (i >= CHUNK_CAPACITY[inst.kind]) continue;
    if (inst.rotation) {
      tmp.rotation.set(...inst.rotation);
    } else {
      tmp.rotation.set(0, 0, 0);
    }
    tmp.position.set(...inst.position);
    tmp.scale.set(...inst.scale);
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
    mesh.setColorAt(i, tmpColor.setHex(inst.color));
    counts[inst.kind] = i + 1;
  }
  for (const kind of KINDS) {
    const mesh = slot.meshes[kind];
    mesh.count = counts[kind];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  const bannerCounts: Record<BannerKind, number> = { bannerA: 0, bannerB: 0, flagQatar: 0 };
  for (const b of banners) {
    const mesh = slot.bannerMeshes[b.kind];
    const i = bannerCounts[b.kind];
    if (i >= BANNER_CAPACITY[b.kind]) continue;
    tmpBanner.position.set(...b.position);
    tmpBanner.rotation.set(...b.rotation);
    tmpBanner.scale.set(...b.scale);
    tmpBanner.updateMatrix();
    mesh.setMatrixAt(i, tmpBanner.matrix);
    bannerCounts[b.kind] = i + 1;
  }
  for (const kind of BANNER_KINDS) {
    const mesh = slot.bannerMeshes[kind];
    mesh.count = bannerCounts[kind];
    mesh.instanceMatrix.needsUpdate = true;
  }

  slot.worldIndex = worldIndex;
}

/**
 * Pool of CHUNK_COUNT scenery chunks. As the player advances, the chunk that fell behind the
 * camera is re-seeded with the scenery of a chunk far ahead – nothing is created or destroyed.
 */
export function Environment() {
  const { root, slots, res } = useMemo(() => {
    const res = createResources();
    const root = new Group();
    const slots = Array.from({ length: CHUNK_COUNT }, () => {
      const slot = createSlot(res);
      root.add(slot.group);
      return slot;
    });
    return { root, slots, res };
  }, []);

  useEffect(
    () => () => {
      Object.values(res.geometry).forEach((g) => g.dispose());
      new Set(Object.values(res.material)).forEach((m) => m.dispose());
      res.bannerGeometry.dispose();
      Object.values(res.bannerMaterials).forEach((m) => m.dispose());
      res.bannerTextures.forEach((t) => t.dispose());
      slots.forEach((s) => {
        KINDS.forEach((k) => s.meshes[k].dispose());
        BANNER_KINDS.forEach((k) => s.bannerMeshes[k].dispose());
      });
    },
    [res, slots],
  );

  useFrame(() => {
    const base = Math.floor(runtime.distance / CHUNK_LENGTH) - 1;
    for (let k = 0; k < CHUNK_COUNT; k++) {
      const w = base + k;
      const slot = slots[positiveMod(w, CHUNK_COUNT)];
      if (slot.worldIndex !== w) fillSlot(slot, w);
      slot.group.position.z = -(w * CHUNK_LENGTH - runtime.distance);
    }
  });

  return <primitive object={root} />;
}

