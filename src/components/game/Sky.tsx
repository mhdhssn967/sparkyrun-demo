import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, ShaderMaterial, Vector3 } from 'three';
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
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.56));
    float s = max(dot(normalize(vDir), uSunDir), 0.0);
    col += uSunColor * (pow(s, 350.0) * 1.6 + pow(s, 12.0) * 0.35);
    col = mix(col, uHorizon, step(vDir.y, 0.0));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Gradient sky + low sun. Its horizon colour matches the scene fog so the road melts into it. */
export function Sky() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new Color(COLORS.skyTop) },
          uHorizon: { value: new Color(COLORS.horizon) },
          uSunDir: { value: new Vector3(0.28, 0.17, -1).normalize() },
          uSunColor: { value: new Color(COLORS.sun) },
        },
      }),
    [],
  );

  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));

  return (
    <mesh ref={mesh} scale={500} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1, 24, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
