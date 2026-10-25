import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three';
import { LANE_WIDTH } from '../../game/constants';
import { runtime } from '../../game/state';
import { applyBend } from '../../utils/bendMaterial';
import { popularApi } from '../../services/popularApi';

/**
 * Creates the high-contrast procedural PET LuLu 100 QAR Red Coupon Texture.
 */
function createCouponTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;

  // 1. Red Gradient Base
  const grad = ctx.createLinearGradient(0, 0, 512, 280);
  grad.addColorStop(0, '#ED1C24');
  grad.addColorStop(0.5, '#D01018');
  grad.addColorStop(1, '#990000');
  ctx.fillStyle = grad;
  ctx.roundRect(8, 8, 496, 264, 20);
  ctx.fill();

  // 2. Gold Border
  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 6;
  ctx.roundRect(14, 14, 484, 252, 16);
  ctx.stroke();

  // 3. Dashed Cutline on Left Notch
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(130, 20);
  ctx.lineTo(130, 260);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. PET Logo & Badge on Left
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PET', 75, 120);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('GIFT', 75, 150);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText('SPECIAL', 75, 175);

  // 5. Right Main Area - LuLu 100 QAR
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText('WEEKLY SPECIAL SURPRISE', 150, 65);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px Inter, sans-serif';
  ctx.fillText('LuLu 100 QAR', 150, 130);

  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText('SHOPPING VOUCHER', 150, 175);

  // 6. Bottom Banner Bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.roundRect(150, 205, 335, 42, 8);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('★ OFFICIAL POPULAR REWARD ★', 185, 232);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Procedural Starburst / Light Rays Texture for rotation effect.
 */
function createSunburstTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const rays = 16;
  const step = (Math.PI * 2) / rays;

  ctx.clearRect(0, 0, 512, 512);

  for (let i = 0; i < rays; i++) {
    const angle = i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 250, angle - step * 0.25, angle + step * 0.25);
    ctx.closePath();

    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
    radGrad.addColorStop(0, 'rgba(255, 230, 100, 0.95)');
    radGrad.addColorStop(0.5, 'rgba(237, 28, 36, 0.6)');
    radGrad.addColorStop(1, 'rgba(237, 28, 36, 0)');
    ctx.fillStyle = radGrad;
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function LuluGiftPickup() {
  const groupRef = useRef<Group | null>(null);
  const couponMeshRef = useRef<Mesh | null>(null);
  const raysMeshRef = useRef<Mesh | null>(null);
  const auraRingRef = useRef<Mesh | null>(null);

  const couponTexture = useMemo(() => createCouponTexture(), []);
  const sunburstTexture = useMemo(() => createSunburstTexture(), []);

  // Prepare Materials
  const { couponMat, raysMat, ringMat } = useMemo(() => {
    const cMat = new MeshStandardMaterial({
      map: couponTexture,
      roughness: 0.15,
      metalness: 0.25,
      side: DoubleSide,
    });
    applyBend(cMat);

    const rMat = new MeshBasicMaterial({
      map: sunburstTexture,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
    applyBend(rMat);

    const ringM = new MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.75,
      blending: AdditiveBlending,
      side: DoubleSide,
      depthWrite: false,
    });
    applyBend(ringM);

    return { couponMat: cMat, raysMat: rMat, ringMat: ringM };
  }, [couponTexture, sunburstTexture]);

  useFrame((_, delta) => {
    if (!runtime.luluGifts || runtime.luluGifts.length === 0) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    const gift = runtime.luluGifts[0];
    if (!groupRef.current) return;

    // Check collision with runner
    if (!gift.collected) {
      const relZ = gift.d - runtime.distance;
      const targetX = gift.lane * LANE_WIDTH;
      const dx = Math.abs(runtime.x - targetX);
      const dy = Math.abs(runtime.y + 0.95 - gift.y);
      const dz = Math.abs(relZ);

      // Trigger collection when player touches the coupon
      if (dx < 1.45 && dy < 1.6 && dz < 1.5) {
        gift.collected = true;
        gift.collectAnim = 1.0;

        // Claim in background, trigger HUD toast, and save to user's vouchers
        popularApi.claimLuluGift(gift.voucherToken).then((v) => {
          if (v) {
            import('../../game/state').then(({ setGameState }) => {
              setGameState({ luluToast: v.voucherCode });
              setTimeout(() => {
                setGameState({ luluToast: null });
              }, 6000);
            });
            import('../../game/audio').then(({ playTurboPickupSound }) => {
              playTurboPickupSound();
            });
            console.log('🎉 LuLu 100 QAR In-Game Special Voucher Collected!', v);
          }
        });
      }
    }

    // Collection disappearance animation
    if (gift.collected) {
      gift.collectAnim -= delta * 3.5;
      if (gift.collectAnim <= 0) {
        groupRef.current.visible = false;
        return;
      }
      groupRef.current.scale.setScalar(gift.collectAnim * 1.5);
    } else {
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(1.0);
    }

    // Position along runner track
    const relZ = gift.d - runtime.distance;
    const posX = gift.lane * LANE_WIDTH;

    // Shake + float motion
    const t = performance.now() * 0.003;
    const shakeY = Math.sin(t * 8) * 0.04; // Noticeable energetic tremor
    const shakeX = Math.cos(t * 6) * 0.02;
    const floatY = Math.sin(t * 2) * 0.12;

    groupRef.current.position.set(posX + shakeX, gift.y + floatY + shakeY, -relZ);

    // Dynamic Y-axis rotation (spin) for the coupon
    if (couponMeshRef.current) {
      couponMeshRef.current.rotation.y = t * 1.8;
      // Gentle subtle 3D tilt
      couponMeshRef.current.rotation.x = Math.sin(t * 2.5) * 0.1;
      couponMeshRef.current.rotation.z = Math.cos(t * 2.5) * 0.08;
    }

    // Shiny light rays rotating in opposite direction
    if (raysMeshRef.current) {
      raysMeshRef.current.rotation.z = -t * 2.2;
      const pulse = 1.0 + Math.sin(t * 4) * 0.18;
      raysMeshRef.current.scale.set(pulse, pulse, 1);
    }

    // Pulsing aura ring expanding on ground
    if (auraRingRef.current) {
      auraRingRef.current.rotation.x = -Math.PI / 2;
      const ringPulse = 1.0 + Math.sin(t * 3) * 0.15;
      auraRingRef.current.scale.set(ringPulse, ringPulse, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.25, -28]}>
      {/* 1. Shiny Light Rays Rotating in Background */}
      <mesh ref={raysMeshRef} position={[0, 0, 0]} material={raysMat}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>

      {/* 2. Beautiful Red PET LuLu 100 QAR Coupon (Spinning in Y-axis) */}
      <mesh ref={couponMeshRef} material={couponMat} castShadow>
        <planeGeometry args={[1.7, 0.95]} />
      </mesh>

      {/* 3. Golden Energy Ring on Ground */}
      <mesh ref={auraRingRef} position={[0, -1.15, 0]} material={ringMat}>
        <ringGeometry args={[0.9, 1.35, 32]} />
      </mesh>
    </group>
  );
}
