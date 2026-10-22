import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  LinearFilter,
  PMREMGenerator,
  SRGBColorSpace,
} from 'three';

/**
 * Creates a zero-network procedural HDR Environment Map (PMREM)
 * tailored to our sunny Doha sky, brilliant golden sun, and highway horizon.
 * When attached to scene.environment, all PBR metallic materials (gold coins,
 * robot armor, signs) catch brilliant specular reflections and mirror glints.
 */
export function GameEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Sky & Ground Gradient
    // Top: Deep azure blue -> soft sky blue -> warm golden horizon glow
    // Bottom: Ground/asphalt neutral bounce
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0.0, '#1c74d9'); // zenith sky blue
    skyGrad.addColorStop(0.32, '#489bf7'); // mid sky
    skyGrad.addColorStop(0.46, '#ffd57a'); // warm golden horizon glow
    skyGrad.addColorStop(0.50, '#fff4db'); // brilliant sunlit horizon haze
    skyGrad.addColorStop(0.54, '#9c8e80'); // warm ground bounce
    skyGrad.addColorStop(1.0, '#2e2622'); // asphalt/desert ground
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 256);

    // 2. High-intensity Radiant Golden Sun Spot
    // Placed at upper-left azimuth (160, 55) matching the directional sunlight
    const sunGrad = ctx.createRadialGradient(160, 55, 0, 160, 55, 95);
    sunGrad.addColorStop(0.0, '#ffffff'); // blinding specular center
    sunGrad.addColorStop(0.12, '#ffffff');
    sunGrad.addColorStop(0.28, '#fff3b0');
    sunGrad.addColorStop(0.50, 'rgba(255, 215, 90, 0.95)');
    sunGrad.addColorStop(0.75, 'rgba(255, 175, 40, 0.4)');
    sunGrad.addColorStop(1.0, 'rgba(255, 140, 20, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(160, 55, 95, 0, Math.PI * 2);
    ctx.fill();

    // 3. Secondary Sky Bounce Highlight on opposite side (380, 75)
    const skyBounce = ctx.createRadialGradient(380, 75, 0, 380, 75, 75);
    skyBounce.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
    skyBounce.addColorStop(0.35, 'rgba(180, 225, 255, 0.5)');
    skyBounce.addColorStop(1.0, 'rgba(70, 150, 255, 0.0)');
    ctx.fillStyle = skyBounce;
    ctx.beginPath();
    ctx.arc(380, 75, 75, 0, Math.PI * 2);
    ctx.fill();

    // 4. Subtle skyline blocks along horizon to add geometric metallic reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let x = 0; x < 512; x += 28) {
      const h = 6 + (Math.sin(x * 0.15) * 0.5 + 0.5) * 14;
      ctx.fillRect(x, 128 - h, 18, h);
    }

    const texture = new CanvasTexture(canvas);
    texture.mapping = EquirectangularReflectionMapping;
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    const pmrem = new PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;

    return () => {
      scene.environment = null;
      envMap.dispose();
      texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}
