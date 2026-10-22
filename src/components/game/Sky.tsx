import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BackSide,
  ClampToEdgeWrapping,
  Color,
  LinearFilter,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import type { Mesh } from 'three';
import { COLORS } from '../../game/constants';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uSkyMap;
  uniform vec3 uHorizon;
  uniform vec3 uTop;
  uniform float uHFOV;
  uniform float uVFOV;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    
    // Azimuth angle (phi): 0 along forward view (-Z), negative to left, positive to right
    float phi = atan(dir.x, -dir.z);
    
    // Elevation angle (theta): 0 at horizon, positive upwards
    float theta = asin(clamp(dir.y, -1.0, 1.0));
    
    // Map horizontal azimuth to texture U [0, 1]
    float u = phi / uHFOV + 0.5;
    
    // Map vertical elevation to texture V [0, 1]
    float v = (theta + 0.05) / uVFOV;
    
    vec4 skyTex = texture2D(uSkyMap, vec2(clamp(u, 0.0, 1.0), clamp(v, 0.0, 1.0)));
    vec3 col = skyTex.rgb;
    
    // Smoothly blend into deep sky blue above texture top
    if (v > 0.90) {
      float tTop = smoothstep(0.90, 1.15, v);
      col = mix(col, uTop, tTop);
    }
    
    // Smoothly blend at wide peripheral edges
    if (u < 0.08 || u > 0.92) {
      float edgeDist = min(u, 1.0 - u);
      float tEdge = smoothstep(0.08, 0.0, edgeDist);
      vec3 fallbackSky = mix(uHorizon, uTop, pow(clamp(dir.y, 0.0, 1.0), 0.52));
      col = mix(col, fallbackSky, tEdge);
    }
    
    // Smoothly melt into scene horizon fog at and below the horizon line
    float horizonBlend = smoothstep(0.05, -0.04, dir.y);
    col = mix(col, uHorizon, horizonBlend);
    
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Panoramic sky dome mapped with the reference sky artwork. Follows the camera at infinity. */
export function Sky() {
  const mesh = useRef<Mesh>(null);

  const texture = useMemo(() => {
    const loader = new TextureLoader();
    const tex = loader.load('/image copy.png');
    tex.colorSpace = SRGBColorSpace;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uSkyMap: { value: texture },
          uTop: { value: new Color(COLORS.skyTop) },
          uHorizon: { value: new Color(COLORS.horizon) },
          uHFOV: { value: 2.05 },
          uVFOV: { value: 1.15 },
        },
      }),
    [texture],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));

  return (
    <mesh ref={mesh} scale={500} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 20]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
