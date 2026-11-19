import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createRestingWarriorTableau, type WarriorSceneRig } from './WarriorSculpture';

export interface NightValleyCallbacks {
  onLoaded?: () => void;
  onIntroDone?: () => void;
}

const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _defaultAccent = new THREE.Color('#f6bfd0');
const _dummy = new THREE.Object3D();

/**
 * Detect software WebGL renderers (SwiftShader, llvmpipe, etc.) from GPU string
 * so rendering cost adapts cleanly while keeping identical scene content & layout.
 */
function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * High-resolution 6-petal daisy/cosmos wildflower sprite matching the pink/cream/gold meadow paintings.
 */
function createWildflowerTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Soft sunlit petal glow halo
  const halo = ctx.createRadialGradient(cx, cy, 8, cx, cy, 118);
  halo.addColorStop(0, 'rgba(255, 245, 240, 0.35)');
  halo.addColorStop(0.55, 'rgba(255, 224, 228, 0.10)');
  halo.addColorStop(1, 'rgba(255, 220, 225, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const petals = 7;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const petalGrad = ctx.createLinearGradient(0, -8, 0, -96);
    petalGrad.addColorStop(0, 'rgba(255, 250, 246, 0.98)');
    petalGrad.addColorStop(0.65, 'rgba(255, 244, 242, 0.92)');
    petalGrad.addColorStop(1, 'rgba(248, 228, 232, 0.35)');

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-24, -26, -28, -82, 0, -98);
    ctx.bezierCurveTo(28, -82, 24, -26, 0, -6);
    ctx.closePath();
    ctx.fillStyle = petalGrad;
    ctx.fill();
    ctx.restore();
  }

  // Warm sunlit golden stamen center
  const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24);
  core.addColorStop(0, '#fff7cc');
  core.addColorStop(0.55, '#f2bd52');
  core.addColorStop(1, 'rgba(235, 168, 52, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Single soft sakura petal texture for 3D floating petals drifting from the tree.
 */
function createPetalTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createLinearGradient(32, 6, 32, 58);
  grad.addColorStop(0, '#ffe6ee');
  grad.addColorStop(0.55, '#f4a6be');
  grad.addColorStop(1, '#d87696');

  ctx.beginPath();
  ctx.moveTo(32, 58);
  ctx.bezierCurveTo(10, 44, 8, 18, 24, 10);
  ctx.lineTo(32, 17);
  ctx.lineTo(40, 10);
  ctx.bezierCurveTo(56, 18, 54, 44, 32, 58);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Painterly Sunset / Twilight Sky Dome Shader with warm peach-gold horizon,
 * soft rose-lavender dusk gradient, golden sun halo, and drifting wispy clouds.
 */
const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uAccentTint;
  uniform float uTintMix;
  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y, -0.15, 1.0);

    // Rich sunset-twilight gradient matching the golden-peach & rose-slate paintings
    vec3 colHorizon = vec3(0.95, 0.72, 0.62); // warm peach-gold horizon
    vec3 colMidLow  = vec3(0.75, 0.54, 0.60); // soft dusty rose
    vec3 colMidHigh = vec3(0.32, 0.34, 0.46); // twilight mauve-slate
    vec3 colZenith  = vec3(0.11, 0.14, 0.23); // serene dusk indigo

    vec3 sky = mix(colHorizon, colMidLow, smoothstep(-0.02, 0.18, h));
    sky = mix(sky, colMidHigh, smoothstep(0.16, 0.48, h));
    sky = mix(sky, colZenith, smoothstep(0.45, 0.92, h));

    // Warm sunset glow near horizon sun direction
    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
    sky += vec3(1.0, 0.78, 0.54) * pow(sunAmt, 7.0) * 0.55;
    sky += vec3(1.0, 0.92, 0.78) * pow(sunAmt, 42.0) * 0.62;

    // Painterly sunset clouds sweeping slowly across the upper horizon
    if (dir.y > 0.02) {
      vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.15;
      cloudUv.x += uTime * 0.012;
      cloudUv.y -= uTime * 0.005;
      float c1 = fbm(cloudUv * 1.4);
      float c2 = fbm(cloudUv * 2.8 + vec2(3.1, 1.7));
      float cloudMask = smoothstep(0.44, 0.78, c1 * 0.7 + c2 * 0.3) * smoothstep(0.02, 0.22, dir.y) * (1.0 - smoothstep(0.55, 0.95, dir.y));

      vec3 cloudShadow = vec3(0.30, 0.26, 0.36);
      vec3 cloudLit = mix(vec3(0.99, 0.80, 0.72), vec3(1.0, 0.90, 0.76), pow(sunAmt, 2.0));
      vec3 cloudCol = mix(cloudShadow, cloudLit, smoothstep(0.35, 0.75, c2 + sunAmt * 0.45));
      sky = mix(sky, cloudCol, cloudMask * 0.65);
    }

    // Subtle member accent wash when hovering a HUB Network portrait
    sky = mix(sky, mix(sky, uAccentTint * 0.75, 0.25), uTintMix * 0.45);

    gl_FragColor = vec4(sky, 1.0);
  }
`;

/**
 * Custom Post-Processing: warm sunset film grain + gentle split-RGB + dynamic speed vignette.
 */
const SunsetPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uDisperse: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uDisperse;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      float rgbShift = (0.0008 + clamp(uSpeed * 0.008, 0.0, 0.004) + uDisperse * 0.001) * dist;
      vec2 offset = centered * rgbShift;

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      vec3 color = vec3(r, g, b);

      // Soft cinematic film grain
      float grain = (hash12(vUv * 760.0 + fract(uTime * 15.1)) - 0.5) * 0.024;
      color += grain;

      // Soft painterly edge vignette
      float vigStart = mix(0.42, 0.28, clamp(uSpeed * 1.8, 0.0, 1.0));
      float vignette = 1.0 - smoothstep(vigStart, 1.05, dist) * (0.44 + clamp(uSpeed * 0.2, 0.0, 0.18));
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const MEADOW_FLOWER_VERTEX = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouseNdc;
  uniform float uMouseActive;
  uniform float uDisperse;
  uniform float uBurstProgress;
  uniform vec3 uBurstOrigin;

  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute vec3 aDisperseDir;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vGlow;
  varying float vRotation;
  varying float vFogFactor;

  void main() {
    vec3 pos = position;

    // Gentle wind wave rolling across the wildflower meadow
    float wind = sin(uTime * 1.25 + pos.x * 0.28 + pos.z * 0.22 + aPhase) * 0.15;
    pos.x += wind;
    pos.z += cos(uTime * 0.95 + pos.x * 0.2 + aPhase) * 0.08;

    // Hover transition: petals lift softly into swirling sunset stardust
    float d = uDisperse;
    if (d > 0.001) {
      float swirl = d * (1.7 + aPhase * 0.2);
      float c = cos(swirl);
      float s = sin(swirl);
      vec3 dir = aDisperseDir;
      vec3 swirled = vec3(dir.x * c - dir.z * s, dir.y + d * 2.4, dir.x * s + dir.z * c);
      pos += swirled * (d * d * 4.5);
    }

    // Celebration bloom wave
    float burstGlow = 0.0;
    if (uBurstProgress > 0.001 && uBurstProgress < 0.999) {
      float distFromOrigin = length(pos - uBurstOrigin);
      float ringRadius = uBurstProgress * 36.0;
      float ring = exp(-pow((distFromOrigin - ringRadius) * 0.25, 2.0)) * (1.0 - uBurstProgress);
      pos.y += ring * 1.45;
      burstGlow = ring * 1.35;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float camDist = -mvPosition.z;
    vec4 clipPos = projectionMatrix * mvPosition;

    // Cursor parts flowers gently in screen space and catches warm sunset shimmer
    float mouseGlow = 0.0;
    if (clipPos.w > 0.05 && uMouseActive > 0.01) {
      vec2 ndc = clipPos.xy / clipPos.w;
      vec2 delta = ndc - uMouseNdc;
      float distToMouse = length(delta);
      float radius = 0.30;
      if (distToMouse < radius) {
        float strength = pow(1.0 - distToMouse / radius, 2.0) * uMouseActive;
        float depthWeight = clamp(12.0 / max(camDist, 2.2), 0.3, 1.5);
        vec2 pushDir = normalize(delta + vec2(0.0001, 0.0001));
        clipPos.xy += pushDir * strength * 0.11 * depthWeight * clipPos.w;
        mouseGlow = strength * 0.9;
      }
    }

    gl_Position = clipPos;

    float nearFade = smoothstep(0.9, 2.6, camDist);
    float farFade = 1.0 - smoothstep(34.0, 74.0, camDist);
    float size = aScale * (185.0 / max(camDist, 1.2)) * uPixelRatio;
    size *= (1.0 + mouseGlow * 0.28 + burstGlow * 0.38);
    gl_PointSize = clamp(size, 2.0, 68.0);

    vColor = aColor;
    vGlow = mouseGlow + burstGlow + d * 0.42;
    vAlpha = nearFade * farFade * 0.96;
    vRotation = aPhase + wind * 1.6;
    vFogFactor = smoothstep(22.0, 72.0, camDist);
  }
`;

const MEADOW_FLOWER_FRAGMENT = `
  uniform sampler2D uTexture;
  uniform vec3 uAccentTint;
  uniform float uTintMix;
  uniform vec3 uFogColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vGlow;
  varying float vRotation;
  varying float vFogFactor;

  void main() {
    if (vAlpha < 0.01) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vRotation);
    float s = sin(vRotation);
    vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;

    vec4 tex = texture2D(uTexture, rotUv);
    if (tex.a < 0.08) discard;

    vec3 baseCol = mix(vColor, mix(vColor, uAccentTint, 0.42), uTintMix);
    vec3 sunlit = baseCol * tex.rgb + vec3(1.0, 0.90, 0.78) * vGlow * 0.58;
    vec3 finalCol = mix(sunlit, uFogColor, vFogFactor * 0.78);

    gl_FragColor = vec4(finalCol, tex.a * vAlpha);
  }
`;

interface PetalState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  scale: number;
}

export class NightValleyEngine {
  private container: HTMLElement;
  private callbacks: NightValleyCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private postPass: ShaderPass | null = null;

  private skyMat: THREE.ShaderMaterial;
  private flowerMat: THREE.ShaderMaterial;
  private grassMesh: THREE.InstancedMesh | null = null;
  private petalMesh: THREE.InstancedMesh;
  private petals: PetalState[] = [];
  private warriorRig: WarriorSceneRig;
  private disposables: Array<{ dispose: () => void }> = [];

  // Orbital camera state revolving gracefully around the resting warrior & blossom tree
  private orbitAngle = -0.38; // Scenic starting angle: warrior & tree on right-center, sunset flower valley stretching left
  private orbitVelocity = 0;
  private mouseNdc = new THREE.Vector2(0, 0);
  private smoothMouseNdc = new THREE.Vector2(0, 0);
  private mouseActive = 0;
  private targetMouseActive = 0;

  private hoverTarget = 0;
  private disperseValue = 0;
  private introProgress = 0;
  private introReported = false;

  private accentColor = new THREE.Color('#f6bfd0');
  private targetAccentColor = new THREE.Color('#f6bfd0');
  private accentMix = 0;
  private targetAccentMix = 0;

  private burstProgress = 1;
  private burstOrigin = new THREE.Vector3();

  private clock = new THREE.Clock();
  private elapsed = 0;
  private frameId = 0;
  private isDisposed = false;
  private reducedMotion = false;
  private scrollLocked = false;
  private lastTouchY: number | null = null;

  private readonly fogColor = new THREE.Color('#6f5b6a');

  constructor(container: HTMLElement, callbacks: NightValleyCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = this.fogColor.clone();
    this.scene.fog = new THREE.FogExp2(this.fogColor.getHex(), 0.0115);

    // Mandatory Studio/Environment Reflection map for realistic dark-steel armor & greatsword gleam
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = envRT.texture;
    this.disposables.push(envRT);
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 260);

    // 1. Sunset-Twilight Sky Dome
    this.skyMat = this.buildSkyDome();

    // 2. Golden-Hour 3-Point Lighting Rig
    this.buildLighting();

    // 3. Rolling Meadow Terrain + Layered Distant Mountain Ridges
    this.buildMeadowTerrain();
    this.buildDistantMountains();

    // 4. Resting Armored Warrior + Greatsword + Ancient Blossom Tree at the heart of the meadow
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.warriorRig = createRestingWarriorTableau(maxAniso, !this.isSoftwareGl);
    const centerGroundY = this.getTerrainHeight(0, 0);
    this.warriorRig.group.position.set(0, centerGroundY, 0);
    this.scene.add(this.warriorRig.group);
    this.disposables.push(...this.warriorRig.disposables);

    // 5. Swaying Meadow Grass Blades (InstancedMesh)
    this.grassMesh = this.buildMeadowGrass(6800);

    // 6. Lush Pink/Cream/Golden Wildflower Meadow (13,500 custom GLSL flower sprites)
    const flowerTex = createWildflowerTexture();
    flowerTex.anisotropy = maxAniso;
    this.disposables.push(flowerTex);
    this.flowerMat = this.buildWildflowerField(13500, flowerTex);

    // 7. 3D Falling Sakura Petals drifting from the overhanging blossom tree
    const petalTex = createPetalTexture();
    this.disposables.push(petalTex);
    this.petalMesh = this.buildFallingPetals(420, petalTex);

    // 8. Post-Processing pipeline (GPU devices get soft sunset Bloom + Film Grain + Vignette)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.55, 0.62);
      this.composer.addPass(this.bloomPass);

      this.postPass = new ShaderPass(SunsetPostShader);
      this.composer.addPass(this.postPass);

      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();

    requestAnimationFrame(() => {
      if (!this.isDisposed) {
        this.callbacks.onLoaded?.();
      }
    });

    this.clock.start();
    this.tick();
  }

  private getTerrainHeight(x: number, z: number): number {
    const r = Math.hypot(x, z);
    // Keep a gentle flat knoll right under the warrior & tree (radius < 4.5), then softly roll outward
    const knollBlend = THREE.MathUtils.smoothstep(r, 3.2, 14.0);
    const rolling =
      Math.sin(x * 0.065) * Math.cos(z * 0.065) * 1.45 +
      Math.sin(x * 0.14 + z * 0.11) * 0.42 +
      Math.cos(r * 0.08) * 0.65;
    // Slight bowl rise on distant perimeter so meadow stretches toward mountain foothills
    const rimRise = Math.pow(Math.max(0, r - 30) / 36, 1.7) * 5.2;
    return rolling * knollBlend + rimRise;
  }

  private buildSkyDome(): THREE.ShaderMaterial {
    const geom = new THREE.SphereGeometry(210, 40, 24);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDir: { value: new THREE.Vector3(-0.78, 0.19, -0.58).normalize() },
        uAccentTint: { value: _defaultAccent.clone() },
        uTintMix: { value: 0 },
      },
      vertexShader: SKY_VERTEX_SHADER,
      fragmentShader: SKY_FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const dome = new THREE.Mesh(geom, mat);
    this.scene.add(dome);
    this.disposables.push(geom, mat);
    return mat;
  }

  private buildLighting(): void {
    // Cool dusk sky / warm olive-meadow ground hemisphere fill
    const hemi = new THREE.HemisphereLight(0xe0b5c4, 0x2b3322, 1.05);
    this.scene.add(hemi);

    // Warm golden-peach sunset key light catching the warrior's armor & blossom canopy
    const sunKey = new THREE.DirectionalLight(0xffc394, 2.55);
    sunKey.position.set(-22, 12, -16);
    if (!this.isSoftwareGl) {
      sunKey.castShadow = true;
      sunKey.shadow.mapSize.set(2048, 2048);
      sunKey.shadow.camera.near = 2;
      sunKey.shadow.camera.far = 55;
      sunKey.shadow.camera.left = -10;
      sunKey.shadow.camera.right = 10;
      sunKey.shadow.camera.top = 10;
      sunKey.shadow.camera.bottom = -10;
      sunKey.shadow.bias = -0.0005;
      sunKey.shadow.normalBias = 0.025;
    }
    this.scene.add(sunKey);

    // Subtle cool lavender-blue rim light separating the dark armor silhouette from the tree
    const rimLight = new THREE.DirectionalLight(0x9fb8e6, 0.95);
    rimLight.position.set(16, 10, 18);
    this.scene.add(rimLight);
  }

  private buildMeadowTerrain(): void {
    const geom = new THREE.PlaneGeometry(175, 175, 110, 110);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const colNear = new THREE.Color('#28331f'); // lush mossy meadow olive-green
    const colMid = new THREE.Color('#343c27');
    const colPinkTint = new THREE.Color('#4d3c3f'); // soft wildflower blanket hint in distance
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);

      const r = Math.hypot(x, z);
      const patch = 0.5 + 0.5 * Math.sin(x * 0.17) * Math.cos(z * 0.19);
      c.copy(colNear).lerp(colMid, patch * 0.65);
      if (r > 12) {
        c.lerp(colPinkTint, THREE.MathUtils.smoothstep(r, 12, 52) * 0.52);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(mesh);
    this.disposables.push(geom, mat);
  }

  /**
   * Layered atmospheric distant mountain ridges encircling the meadow horizon.
   */
  private buildDistantMountains(): void {
    const rings = [
      { radius: 78, height: 14, color: '#4c4657', seed: 1.2 },
      { radius: 112, height: 26, color: '#615669', seed: 3.7 },
      { radius: 148, height: 38, color: '#786778', seed: 6.4 },
    ];

    rings.forEach((ring) => {
      const segs = 128;
      const geom = new THREE.CylinderGeometry(ring.radius, ring.radius * 1.06, ring.height, segs, 4, true);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        // Sculpt peaks along the top vertices only
        if (y > 0) {
          const peak =
            Math.sin(angle * 5 + ring.seed) * 0.45 +
            Math.sin(angle * 11 - ring.seed * 1.4) * 0.25 +
            Math.cos(angle * 19 + ring.seed * 2.1) * 0.14;
          pos.setY(i, y * (0.55 + peak * 0.72));
        } else {
          pos.setY(i, -6);
        }
      }
      geom.computeVertexNormals();
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ring.color),
        side: THREE.BackSide,
        fog: true,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = ring.height * 0.22;
      this.scene.add(mesh);
      this.disposables.push(geom, mat);
    });
  }

  /**
   * Instanced swaying grass blades framing the foreground and surrounding the resting warrior.
   */
  private buildMeadowGrass(count: number): THREE.InstancedMesh {
    const rand = seededRandom(4409);

    // Tapered curved grass blade geometry pivoted at bottom-center
    const bladeGeo = new THREE.PlaneGeometry(0.085, 0.72, 1, 3);
    bladeGeo.translate(0, 0.36, 0);
    const bPos = bladeGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const y = bPos.getY(i);
      const t = y / 0.72;
      bPos.setX(i, bPos.getX(i) * (1.0 - t * 0.88)); // sharp tip taper
      bPos.setZ(i, t * t * 0.16); // natural graceful bend
    }
    bladeGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5a6b3e'),
      roughness: 0.86,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(bladeGeo, grassMat, count);
    const colorChoices = [
      new THREE.Color('#3b4a27'),
      new THREE.Color('#4c5c32'),
      new THREE.Color('#66723a'),
      new THREE.Color('#7a6e3e'), // warm golden-olive dry tips catching sunset
    ];

    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 1.1 + Math.pow(rand(), 0.75) * 34;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Avoid planting tall grass directly inside the solid tree trunk footprint
      if (Math.hypot(x - 1.55, z + 0.95) < 1.25) {
        _dummy.scale.setScalar(0.001);
        _dummy.position.set(0, -10, 0);
      } else {
        const y = this.getTerrainHeight(x, z);
        _dummy.position.set(x, y - 0.04, z);
        _dummy.rotation.set(
          (rand() - 0.5) * 0.28,
          rand() * Math.PI * 2,
          (rand() - 0.5) * 0.25
        );
        const s = 0.65 + rand() * 0.95;
        _dummy.scale.set(s, s * (0.75 + rand() * 0.65), s);
      }
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      mesh.setColorAt(i, colorChoices[Math.floor(rand() * colorChoices.length)]);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;

    this.scene.add(mesh);
    this.disposables.push(bladeGeo, grassMat);
    return mesh;
  }

  /**
   * Lush pink, rose-blush, cream-white daisies & golden wildflowers blanketing the entire meadow.
   */
  private buildWildflowerField(count: number, texture: THREE.CanvasTexture): THREE.ShaderMaterial {
    const rand = seededRandom(19112026);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const disperseDirs = new Float32Array(count * 3);

    // Palette inspired directly by the 3 reference paintings: sakura pink, blush rose, daisy white, sunset gold
    const palette = [
      new THREE.Color('#f4a6be'), // soft sakura pink
      new THREE.Color('#f8c7d5'), // pale blush pink
      new THREE.Color('#e47ea0'), // rich wild rose
      new THREE.Color('#fbf4eb'), // cream white daisy
      new THREE.Color('#f2d594'), // warm sunset goldenrod
      new THREE.Color('#e8997c'), // peach sunset bloom
      new THREE.Color('#fff9f2'), // bright white daisy
    ];

    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      // Rich density close around the resting warrior, tapering smoothly across the vast hills
      const dist = 0.9 + Math.pow(rand(), 0.72) * 58;
      let x = Math.cos(angle) * dist;
      let z = Math.sin(angle) * dist;

      // Push flowers just outside the solid tree trunk core so they hug the mossy roots naturally
      const dxTree = x - 1.55;
      const dzTree = z + 0.95;
      const dTree = Math.hypot(dxTree, dzTree);
      if (dTree < 1.35) {
        const push = (1.35 + rand() * 0.6) / Math.max(dTree, 0.01);
        x = 1.55 + dxTree * push;
        z = -0.95 + dzTree * push;
      }

      const groundY = this.getTerrainHeight(x, z);
      const bloomHeight = 0.22 + rand() * 0.58;

      positions[i * 3] = x;
      positions[i * 3 + 1] = groundY + bloomHeight;
      positions[i * 3 + 2] = z;

      scales[i] = 0.58 + Math.pow(rand(), 1.5) * 1.15;
      phases[i] = rand() * Math.PI * 2;

      // Slight spatial color clustering so fields look organically painted like the reference art
      const clusterWave = Math.sin(x * 0.12) * Math.cos(z * 0.12);
      let baseCol: THREE.Color;
      if (clusterWave > 0.35 && rand() < 0.65) {
        baseCol = palette[rand() < 0.5 ? 0 : 1]; // lush pink cosmos drifts
      } else if (clusterWave < -0.35 && rand() < 0.55) {
        baseCol = palette[rand() < 0.5 ? 3 : 4]; // white daisy & golden wildflower drifts
      } else {
        baseCol = palette[Math.floor(rand() * palette.length)];
      }

      const shade = 0.84 + rand() * 0.24;
      colors[i * 3] = Math.min(1, baseCol.r * shade);
      colors[i * 3 + 1] = Math.min(1, baseCol.g * shade);
      colors[i * 3 + 2] = Math.min(1, baseCol.b * shade);

      const theta = rand() * Math.PI * 2;
      disperseDirs[i * 3] = Math.cos(theta) * (0.5 + rand() * 1.1);
      disperseDirs[i * 3 + 1] = 0.4 + rand() * 1.3;
      disperseDirs[i * 3 + 2] = Math.sin(theta) * (0.5 + rand() * 1.1);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aDisperseDir', new THREE.BufferAttribute(disperseDirs, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTexture: { value: texture },
        uMouseNdc: { value: new THREE.Vector2(0, 0) },
        uMouseActive: { value: 0 },
        uDisperse: { value: 0 },
        uBurstProgress: { value: 1 },
        uBurstOrigin: { value: new THREE.Vector3() },
        uAccentTint: { value: _defaultAccent.clone() },
        uTintMix: { value: 0 },
        uFogColor: { value: this.fogColor.clone() },
      },
      vertexShader: MEADOW_FLOWER_VERTEX,
      fragmentShader: MEADOW_FLOWER_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geom, mat);
    points.frustumCulled = false;
    this.scene.add(points);
    this.disposables.push(geom, mat);
    return mat;
  }

  /**
   * 3D falling & drifting sakura blossom petals cascading gently from the overhanging tree.
   */
  private buildFallingPetals(count: number, texture: THREE.CanvasTexture): THREE.InstancedMesh {
    const rand = seededRandom(8812);
    const geom = new THREE.PlaneGeometry(0.22, 0.22);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color: new THREE.Color('#ffdce8'),
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(geom, mat, count);
    this.petals = [];

    for (let i = 0; i < count; i++) {
      this.petals.push({
        x: (rand() - 0.5) * 28,
        y: 0.4 + rand() * 11,
        z: (rand() - 0.5) * 28,
        vx: -0.45 - rand() * 0.55,
        vy: -0.35 - rand() * 0.45,
        vz: (rand() - 0.5) * 0.35,
        rx: rand() * Math.PI * 2,
        ry: rand() * Math.PI * 2,
        rz: rand() * Math.PI * 2,
        vrx: (rand() - 0.5) * 2.2,
        vry: (rand() - 0.5) * 2.4,
        scale: 0.65 + rand() * 0.95,
      });
    }

    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.disposables.push(geom, mat);
    return mesh;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('wheel', this.handleWheel, { passive: true });
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
  }

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
  };

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const pixelRatio = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.flowerMat.uniforms.uPixelRatio.value = pixelRatio;

    if (this.composer) {
      this.composer.setSize(width, height);
    }
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    this.mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetMouseActive = 1;
  };

  private handlePointerLeave = (): void => {
    this.targetMouseActive = 0;
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.scrollLocked) return;
    this.orbitVelocity += e.deltaY * 0.00055;
    this.orbitVelocity = THREE.MathUtils.clamp(this.orbitVelocity, -0.055, 0.055);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (this.scrollLocked || e.touches.length === 0) return;
    this.lastTouchY = e.touches[0].clientY;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (this.scrollLocked || this.lastTouchY === null || e.touches.length === 0) return;
    const y = e.touches[0].clientY;
    const delta = this.lastTouchY - y;
    this.lastTouchY = y;
    this.orbitVelocity += delta * 0.0028;
    this.orbitVelocity = THREE.MathUtils.clamp(this.orbitVelocity, -0.06, 0.06);
  };

  private handleTouchEnd = (): void => {
    this.lastTouchY = null;
  };

  public startHoverTransition(): void {
    this.hoverTarget = 1;
  }

  public stopHoverTransition(): void {
    this.hoverTarget = 0;
  }

  public setScrollLocked(locked: boolean): void {
    this.scrollLocked = locked;
  }

  public setAccentTint(hex: string | null): void {
    if (hex) {
      _targetColor.set(hex);
      this.targetAccentColor.copy(_targetColor);
      this.targetAccentMix = 1;
    } else {
      this.targetAccentColor.copy(_defaultAccent);
      this.targetAccentMix = 0;
    }
  }

  public triggerCelebrationBurst(hex?: string): void {
    if (hex) {
      this.setAccentTint(hex);
    }
    this.burstOrigin.set(0, 1.2, 0);
    this.burstProgress = 0.002;
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.isDisposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;

    if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + dt * 1.15);
      if (this.introProgress >= 0.8 && !this.introReported) {
        this.introReported = true;
        this.callbacks.onIntroDone?.();
      }
    }

    this.disperseValue = THREE.MathUtils.damp(this.disperseValue, this.hoverTarget, 2.8, dt);

    // Smooth cinematic orbit around the resting warrior, greatsword, and flower meadow
    const autoOrbitSpeed = this.reducedMotion ? 0.015 : 0.068;
    const activeOrbit = autoOrbitSpeed * (1 - this.disperseValue * 0.85);
    this.orbitAngle += activeOrbit * dt + this.orbitVelocity * dt * 22;
    this.orbitVelocity = THREE.MathUtils.damp(this.orbitVelocity, 0, 4.0, dt);
    const absSpeed = Math.abs(this.orbitVelocity) * 18;

    // Smooth mouse meadow glide & parallax
    this.smoothMouseNdc.x = THREE.MathUtils.damp(this.smoothMouseNdc.x, this.mouseNdc.x, 5.2, dt);
    this.smoothMouseNdc.y = THREE.MathUtils.damp(this.smoothMouseNdc.y, this.mouseNdc.y, 5.2, dt);
    this.mouseActive = THREE.MathUtils.damp(this.mouseActive, this.targetMouseActive, 4.0, dt);

    // Combine base orbit + mouse meadow exploration offset so moving cursor sweeps through the flowers around the warrior
    const viewAngle = this.orbitAngle + this.smoothMouseNdc.x * 0.42;
    const introPullback = (1 - Math.pow(this.introProgress, 2)) * 4.5;
    const radius = 8.4 + introPullback - this.smoothMouseNdc.y * 0.9 + Math.sin(this.elapsed * 0.25) * 0.35;
    const camY = 2.05 + this.smoothMouseNdc.y * 0.95 + introPullback * 0.32;

    _camPos.set(Math.sin(viewAngle) * radius, camY, Math.cos(viewAngle) * radius);
    const groundUnderCam = this.getTerrainHeight(_camPos.x, _camPos.z);
    _camPos.y = Math.max(_camPos.y, groundUnderCam + 1.05);

    this.camera.position.copy(_camPos);

    // Gaze gently across the resting warrior & blossom tree with subtle mouse parallax shift
    _lookTarget.set(
      0.15 + this.smoothMouseNdc.x * 0.75,
      1.75 + this.smoothMouseNdc.y * 0.38,
      -0.25
    );
    this.camera.lookAt(_lookTarget);

    // Subtle FOV breathing on hover/orbit speed
    const targetFov = 46 + Math.min(absSpeed * 3.0, 5.0) + this.disperseValue * 2.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.02) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
      this.camera.updateProjectionMatrix();
    }

    // Subtle peaceful breathing & canopy breeze on the resting warrior tableau
    const breath = Math.sin(this.elapsed * 1.15);
    this.warriorRig.warriorUpperBody.rotation.z = -0.34 + breath * 0.014;
    this.warriorRig.warriorHead.rotation.z = 0.24 + Math.sin(this.elapsed * 0.75) * 0.02;
    this.warriorRig.blossomCanopy.rotation.z = Math.sin(this.elapsed * 0.85) * 0.018;
    this.warriorRig.blossomCanopy.rotation.x = Math.cos(this.elapsed * 0.65) * 0.012;

    // Gentle wind sway on instanced grass meadow
    if (this.grassMesh) {
      this.grassMesh.rotation.y = Math.sin(this.elapsed * 0.22) * 0.004;
    }

    // Update falling sakura blossom petals
    const liftForce = this.disperseValue * 2.6;
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.x += (p.vx + Math.sin(this.elapsed * 0.9 + i) * 0.32) * dt;
      p.y += (p.vy + liftForce) * dt;
      p.z += (p.vz + Math.cos(this.elapsed * 0.7 + i) * 0.25) * dt;
      p.rx += p.vrx * dt;
      p.ry += p.vry * dt;

      if (p.y < 0.1 || p.y > 14 || Math.hypot(p.x, p.z) > 19) {
        p.x = -2.5 + ((i * 1.73) % 10) - 2.5;
        p.y = 4.8 + (i % 7) * 0.65;
        p.z = -3.0 + ((i * 2.41) % 9) - 2.5;
      }

      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.rx, p.ry, p.rz);
      _dummy.scale.setScalar(p.scale * (1 + this.disperseValue * 0.25));
      _dummy.updateMatrix();
      this.petalMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.petalMesh.instanceMatrix.needsUpdate = true;

    // Accent tint & burst uniforms
    this.accentColor.lerp(this.targetAccentColor, 1 - Math.exp(-3.2 * dt));
    this.accentMix = THREE.MathUtils.damp(this.accentMix, this.targetAccentMix, 3.0, dt);

    if (this.burstProgress < 1) {
      this.burstProgress = Math.min(1, this.burstProgress + dt * 0.55);
    }

    this.skyMat.uniforms.uTime.value = this.elapsed;
    this.skyMat.uniforms.uAccentTint.value.copy(this.accentColor);
    this.skyMat.uniforms.uTintMix.value = this.accentMix;

    this.flowerMat.uniforms.uTime.value = this.elapsed;
    this.flowerMat.uniforms.uMouseNdc.value.copy(this.smoothMouseNdc);
    this.flowerMat.uniforms.uMouseActive.value = this.mouseActive;
    this.flowerMat.uniforms.uDisperse.value = this.disperseValue;
    this.flowerMat.uniforms.uBurstProgress.value = this.burstProgress;
    this.flowerMat.uniforms.uBurstOrigin.value.copy(this.burstOrigin);
    this.flowerMat.uniforms.uAccentTint.value.copy(this.accentColor);
    this.flowerMat.uniforms.uTintMix.value = this.accentMix;

    if (this.postPass) {
      this.postPass.uniforms.uTime.value = this.elapsed;
      this.postPass.uniforms.uSpeed.value = absSpeed;
      this.postPass.uniforms.uDisperse.value = this.disperseValue;
    }
    if (this.bloomPass) {
      this.bloomPass.strength = 0.42 + this.disperseValue * 0.25 + (1 - this.burstProgress) * 0.25;
    }

    if (this.composer && !this.isSoftwareGl) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);

    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
