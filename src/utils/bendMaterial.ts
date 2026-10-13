import { DoubleSide, MeshBasicMaterial, MeshLambertMaterial, Vector2 } from 'three';
import type { Material, Texture, WebGLProgramParametersWithUniforms } from 'three';
import { BEND_START } from '../game/constants';

/**
 * "Curved world" trick (as in Subway Surfers / Temple Run): the simulation runs on a
 * perfectly straight road, and the vertex shader bends everything further than BEND_START
 * from the camera sideways (x) and downwards (y) with a quadratic falloff.
 * Updating this single uniform changes the bend of every patched material at once.
 */
export const bendUniform = { value: new Vector2(0, 0) };

export const BEND_VERTEX_GLSL = /* glsl */ `
  {
    float bendDist = max(-mvPosition.z - ${BEND_START.toFixed(1)}, 0.0);
    mvPosition.xy += uBend * bendDist * bendDist;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const UNIFORM_DECL = 'uniform vec2 uBend;';

function patchBendVertex(shader: WebGLProgramParametersWithUniforms, extraDecl = '') {
  shader.uniforms.uBend = bendUniform;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${UNIFORM_DECL}\n${extraDecl}`)
    .replace('#include <project_vertex>', `#include <project_vertex>\n${BEND_VERTEX_GLSL}`);
}

/** Adds the world bend to any built-in material (Lambert / Basic / Standard ...). */
export function applyBend<T extends Material>(material: T, customKey = 'bend-v1'): T {
  material.onBeforeCompile = (shader) => patchBendVertex(shader);
  material.customProgramCacheKey = () => customKey;
  return material;
}

export const createPropMaterial = () => applyBend(new MeshLambertMaterial({ color: 0xffffff }));
export const createEmissiveMaterial = () => applyBend(new MeshBasicMaterial({ color: 0xffffff }));

export function createBannerMaterial(texture: Texture, cacheKey: string) {
  const material = new MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    side: DoubleSide,
  });
  return applyBend(material, cacheKey);
}

/**
 * Lambert material with a procedural window grid on tall faces — gives skyscrapers
 * detail without any textures or extra geometry. Works on unit boxes and unit cylinders.
 */
export function createBuildingMaterial(cylindrical: boolean) {
  const material = new MeshLambertMaterial({ color: 0xffffff });
  material.onBeforeCompile = (shader) => {
    patchBendVertex(shader, 'varying vec3 vLP;\nvarying vec3 vON;\nvarying float vH;');
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `#include <begin_vertex>
        vec3 isc = vec3(1.0);
        #ifdef USE_INSTANCING
          isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        #endif
        vLP = position * isc;
        vON = normal;
        vH = isc.y;`,
    );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;\nvarying vec3 vON;\nvarying float vH;')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        if (vH > 8.0 && abs(vON.y) < 0.5) {
          float u = ${cylindrical ? 'atan(vLP.z, vLP.x) * 3.0' : '(abs(vON.x) > 0.5 ? vLP.z : vLP.x)'};
          float v = vLP.y + 0.5 * vH;
          vec2 cell = vec2(u / 2.2, v / 3.0);
          vec2 id = floor(cell);
          vec2 f = fract(cell);
          float win = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.78);
          float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
          vec3 glass = diffuseColor.rgb * 0.36 + vec3(0.02, 0.05, 0.09);
          diffuseColor.rgb = mix(diffuseColor.rgb, glass, win);
          totalEmissiveRadiance += win * step(0.88, rnd) * vec3(1.0, 0.76, 0.42) * 0.5;
        }`,
      );
  };
  material.customProgramCacheKey = () => (cylindrical ? 'building-cyl-v1' : 'building-box-v1');
  return material;
}
