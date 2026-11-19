import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export interface NightValleyCallbacks {
  onLoaded?: () => void;
  onIntroDone?: () => void;
}

const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _defaultAccent = new THREE.Color('#f5efe2');

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

/**
 * Deterministic pseudo-random helper for organic scattering.
 */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Procedurally paints a crisp luminous 5-petal night flower sprite texture.
 */
function createFlowerTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Soft outer bioluminescent aura
  const aura = ctx.createRadialGradient(cx, cy, 8, cx, cy, 122);
  aura.addColorStop(0, 'rgba(255, 248, 232, 0.52)');
  aura.addColorStop(0.45, 'rgba(255, 242, 215, 0.16)');
  aura.addColorStop(1, 'rgba(255, 240, 210, 0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, size, size);

  // 5 layered luminous petals
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const petalGrad = ctx.createLinearGradient(0, -10, 0, -96);
    petalGrad.addColorStop(0, 'rgba(255, 252, 244, 0.96)');
    petalGrad.addColorStop(0.55, 'rgba(255, 244, 224, 0.82)');
    petalGrad.addColorStop(1, 'rgba(235, 225, 210, 0.18)');

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-30, -28, -34, -84, 0, -102);
    ctx.bezierCurveTo(34, -84, 30, -28, 0, -6);
    ctx.closePath();
    ctx.fillStyle = petalGrad;
    ctx.fill();

    // Delicate inner petal vein
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -76);
    ctx.stroke();

    ctx.restore();
  }

  // Radiant golden stamen center
  const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
  core.addColorStop(0, 'rgba(255, 255, 248, 1)');
  core.addColorStop(0.45, 'rgba(255, 234, 178, 0.92)');
  core.addColorStop(1, 'rgba(255, 212, 130, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedurally paints a delicate nocturnal fern/leaf cluster sprite texture.
 */
function createLeafTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const fronds = 3;
  for (let i = 0; i < fronds; i++) {
    const rot = (i - 1) * 0.58;
    ctx.save();
    ctx.translate(cx, cy + 44);
    ctx.rotate(rot);

    const grad = ctx.createLinearGradient(0, 0, 0, -146);
    grad.addColorStop(0, 'rgba(130, 190, 175, 0.12)');
    grad.addColorStop(0.45, 'rgba(165, 224, 206, 0.72)');
    grad.addColorStop(1, 'rgba(215, 246, 238, 0.28)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-24, -44, -22, -108, 0, -150);
    ctx.bezierCurveTo(22, -108, 24, -44, 0, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Soft glowing radial bokeh dust sprite.
 */
function createDustTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 250, 236, 1)');
  grad.addColorStop(0.35, 'rgba(255, 236, 198, 0.55)');
  grad.addColorStop(1, 'rgba(255, 236, 198, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Volumetric moonbeam light-ray sprite texture.
 */
function createRayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const gradY = ctx.createLinearGradient(0, 0, 0, 512);
  gradY.addColorStop(0, 'rgba(220, 232, 255, 0)');
  gradY.addColorStop(0.32, 'rgba(235, 230, 218, 0.24)');
  gradY.addColorStop(0.75, 'rgba(245, 234, 210, 0.14)');
  gradY.addColorStop(1, 'rgba(245, 234, 210, 0)');

  const gradX = ctx.createLinearGradient(0, 0, 128, 0);
  gradX.addColorStop(0, 'rgba(255,255,255,0)');
  gradX.addColorStop(0.5, 'rgba(255,255,255,1)');
  gradX.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradY;
  ctx.fillRect(0, 0, 128, 512);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = gradX;
  ctx.fillRect(0, 0, 128, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Custom Post-Processing Shader: Split-RGB film grain noise + dynamic speed vignette.
 */
const SplitRgbVignetteShader = {
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

      // Subtle split-RGB chromatic shift that increases smoothly with scroll speed
      float rgbShift = (0.0011 + clamp(uSpeed * 0.012, 0.0, 0.0055) + uDisperse * 0.0012) * dist;
      vec2 offset = centered * rgbShift;

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      vec3 color = vec3(r, g, b);

      // Fine organic film noise
      float grain = (hash12(vUv * 820.0 + fract(uTime * 17.3)) - 0.5) * 0.032;
      color += grain;

      // Dynamic speed vignette (tightens gently when wandering fast)
      float vigStart = mix(0.38, 0.24, clamp(uSpeed * 2.2, 0.0, 1.0));
      float vigEnd = mix(0.98, 0.78, clamp(uSpeed * 2.2, 0.0, 1.0));
      float vignette = 1.0 - smoothstep(vigStart, vigEnd, dist) * (0.62 + clamp(uSpeed * 0.35, 0.0, 0.25));
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const FLOWER_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouseNdc;
  uniform float uMouseActive;
  uniform float uDisperse;
  uniform float uBloomBoost;
  uniform float uBurstProgress;
  uniform vec3 uBurstOrigin;
  uniform float uIsLeaf;

  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute vec3 aDisperseDir;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vGlow;
  varying float vRotation;

  void main() {
    vec3 pos = position;

    // Gentle nocturnal wind sway
    float sway = sin(uTime * 0.95 + aPhase + pos.x * 0.22 + pos.z * 0.18) * 0.16;
    pos.x += sway;
    pos.y += cos(uTime * 0.72 + aPhase) * 0.09;

    // Hover transition: disperse flowers outward into floating glowing stardust
    float d = uDisperse;
    if (d > 0.001) {
      float swirlAngle = d * (1.8 + aPhase * 0.18);
      float c = cos(swirlAngle);
      float s = sin(swirlAngle);
      vec3 dir = aDisperseDir;
      vec3 swirled = vec3(dir.x * c - dir.z * s, dir.y + d * 2.8, dir.x * s + dir.z * c);
      pos += swirled * (d * d * 7.5);
    }

    // Celebration bloom wave rising through the valley
    float burstGlow = 0.0;
    if (uBurstProgress > 0.001 && uBurstProgress < 0.999) {
      float distFromOrigin = length(pos - uBurstOrigin);
      float ringRadius = uBurstProgress * 46.0;
      float ring = exp(-pow((distFromOrigin - ringRadius) * 0.22, 2.0)) * (1.0 - uBurstProgress);
      pos.y += ring * 2.4;
      burstGlow = ring * 1.45;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float camDist = -mvPosition.z;

    // Project to clip/NDC space for screen-space cursor repulsion & bioluminescence
    vec4 clipPos = projectionMatrix * mvPosition;
    float mouseGlow = 0.0;

    if (clipPos.w > 0.05 && uMouseActive > 0.01) {
      vec2 ndc = clipPos.xy / clipPos.w;
      vec2 delta = ndc - uMouseNdc;
      // Aspect-neutral circular push feel
      float distToMouse = length(delta);
      float radius = 0.34;
      if (distToMouse < radius) {
        float strength = pow(1.0 - distToMouse / radius, 2.0) * uMouseActive;
        // Stronger push closer to camera
        float depthWeight = clamp(18.0 / max(camDist, 3.0), 0.35, 1.8);
        vec2 pushDir = normalize(delta + vec2(0.0001, 0.0001));
        clipPos.xy += pushDir * strength * 0.145 * depthWeight * clipPos.w;
        mouseGlow = strength * 1.35;
      }
    }

    gl_Position = clipPos;

    // Proximity blooming: flowers bloom large as they approach camera; leaves appear further back
    float nearFade = smoothstep(1.2, 4.2, camDist);
    float farFade = 1.0 - smoothstep(26.0, 62.0, camDist);
    float bloomGrow = uIsLeaf > 0.5
      ? smoothstep(5.5, 17.0, camDist) * (1.0 - smoothstep(32.0, 58.0, camDist))
      : smoothstep(38.0, 7.5, camDist);

    float scaleFactor = mix(0.32, 1.25, bloomGrow);
    // Shrink slightly into luminous glowing stardust points when dispersed
    scaleFactor = mix(scaleFactor, 0.56, d);

    float size = aScale * scaleFactor * (220.0 / max(camDist, 1.5)) * uPixelRatio;
    size *= (1.0 + mouseGlow * 0.32 + burstGlow * 0.45);
    gl_PointSize = clamp(size, 1.5, 92.0);

    // Shimmer pulse
    float pulse = 0.86 + 0.14 * sin(uTime * 1.6 + aPhase * 3.1);

    vColor = aColor;
    vGlow = (mouseGlow + burstGlow + d * 0.55 + uBloomBoost) * pulse;
    vAlpha = nearFade * farFade * (uIsLeaf > 0.5 ? 0.62 : 0.92);
    vRotation = aPhase + uTime * 0.12 * (mod(aPhase, 2.0) > 1.0 ? 1.0 : -1.0);
  }
`;

const FLOWER_FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform vec3 uAccentTint;
  uniform float uTintMix;
  uniform float uDisperse;
  uniform float uIsLeaf;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vGlow;
  varying float vRotation;

  void main() {
    if (vAlpha < 0.01) discard;

    // Rotate point sprite UV gently
    vec2 uv = gl_PointCoord - 0.5;
    float c = cos(vRotation);
    float s = sin(vRotation);
    vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;

    vec4 tex = texture2D(uTexture, rotUv);

    // During hover dispersion, morph softly from botanical petal toward glowing stardust orb
    float radial = 1.0 - smoothstep(0.0, 0.48, length(uv));
    float stardustAlpha = pow(radial, 1.85);
    float spriteAlpha = mix(tex.a, max(tex.a * 0.4, stardustAlpha), uDisperse * 0.82);

    if (spriteAlpha < 0.02) discard;

    vec3 baseCol = mix(vColor, mix(vColor, uAccentTint, 0.55), uTintMix);
    vec3 glowColor = mix(vec3(1.0, 0.96, 0.86), uAccentTint, 0.35);
    vec3 finalCol = baseCol * tex.rgb + glowColor * vGlow * (uIsLeaf > 0.5 ? 0.32 : 0.72);

    gl_FragColor = vec4(finalCol, spriteAlpha * vAlpha);
  }
`;

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

  private pathCurve: THREE.CatmullRomCurve3;
  private flowerMat: THREE.ShaderMaterial;
  private leafMat: THREE.ShaderMaterial;
  private dustMat: THREE.PointsMaterial;
  private dustMesh: THREE.Points;
  private rayMeshes: THREE.Mesh[] = [];
  private disposables: Array<{ dispose: () => void }> = [];

  private scrollProgress = 0;
  private scrollVelocity = 0;
  private mouseNdc = new THREE.Vector2(0, 0);
  private smoothMouseNdc = new THREE.Vector2(0, 0);
  private mouseActive = 0;
  private targetMouseActive = 0;

  private hoverTarget = 0;
  private disperseValue = 0;
  private introProgress = 0;
  private introReported = false;

  private accentColor = new THREE.Color('#f5efe2');
  private targetAccentColor = new THREE.Color('#f5efe2');
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
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x03050a, 1);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050a);
    this.scene.fog = new THREE.FogExp2(0x03050a, 0.0175);

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 140);

    // Closed winding night-valley flight loop
    this.pathCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.6, 42),
        new THREE.Vector3(16, 3.2, 26),
        new THREE.Vector3(24, 4.1, 4),
        new THREE.Vector3(14, 3.0, -20),
        new THREE.Vector3(-4, 3.8, -36),
        new THREE.Vector3(-22, 3.3, -22),
        new THREE.Vector3(-25, 4.2, 3),
        new THREE.Vector3(-15, 3.1, 27),
      ],
      true,
      'catmullrom',
      0.5
    );

    const flowerTex = createFlowerTexture();
    const leafTex = createLeafTexture();
    const dustTex = createDustTexture();
    const rayTex = createRayTexture();
    this.disposables.push(flowerTex, leafTex, dustTex, rayTex);

    // 1. Subtle nocturnal valley terrain silhouette beneath flowers
    this.buildValleyGround();

    // 2. Luminous flower field + deep botanical leaves
    this.flowerMat = this.createFieldMaterial(flowerTex, false);
    this.leafMat = this.createFieldMaterial(leafTex, true);
    this.buildFloraField(11500, this.flowerMat, false, 1911);
    this.buildFloraField(5200, this.leafMat, true, 2026);

    // 3. Drifting golden pollen / dust embers
    const { dustMesh, dustMat } = this.buildDustParticles(dustTex, 950);
    this.dustMesh = dustMesh;
    this.dustMat = dustMat;

    // 4. Volumetric moonlight ray sprites
    this.buildLightRays(rayTex);

    // 5. Post-Processing pipeline (GPU devices get UnrealBloom + Split-RGB Noise + Dynamic Vignette)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.72, 0.55, 0.24);
      this.composer.addPass(this.bloomPass);

      this.postPass = new ShaderPass(SplitRgbVignetteShader);
      this.composer.addPass(this.postPass);

      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();

    // Notify loaded on next animation frame so loader fades cleanly
    requestAnimationFrame(() => {
      if (!this.isDisposed) {
        this.callbacks.onLoaded?.();
      }
    });

    this.clock.start();
    this.tick();
  }

  private getTerrainHeight(x: number, z: number): number {
    // Compute distance from the valley loop centerline so the camera glides through a natural valley depression
    const r = Math.hypot(x, z);
    const ringDist = Math.abs(r - 28.0);
    const valleySlope = Math.pow(Math.min(ringDist / 16.0, 1.8), 1.65) * 4.4;
    const rollingHills =
      Math.sin(x * 0.085) * Math.cos(z * 0.085) * 2.1 +
      Math.sin(x * 0.19 + z * 0.14) * 0.75 +
      Math.cos(x * 0.05 - z * 0.11) * 1.4;
    return valleySlope + rollingHills - 1.1;
  }

  private buildValleyGround(): void {
    const geom = new THREE.PlaneGeometry(170, 170, 84, 84);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(x, z) - 0.35);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      color: 0x050811,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geom, mat);
    this.scene.add(mesh);
    this.disposables.push(geom, mat);
  }

  private createFieldMaterial(texture: THREE.CanvasTexture, isLeaf: boolean): THREE.ShaderMaterial {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uTexture: { value: texture },
        uMouseNdc: { value: new THREE.Vector2(0, 0) },
        uMouseActive: { value: 0 },
        uDisperse: { value: 0 },
        uBloomBoost: { value: 0 },
        uBurstProgress: { value: 1 },
        uBurstOrigin: { value: new THREE.Vector3() },
        uAccentTint: { value: _defaultAccent.clone() },
        uTintMix: { value: 0 },
        uIsLeaf: { value: isLeaf ? 1.0 : 0.0 },
      },
      vertexShader: FLOWER_VERTEX_SHADER,
      fragmentShader: FLOWER_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: isLeaf ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    this.disposables.push(mat);
    return mat;
  }

  private buildFloraField(
    count: number,
    material: THREE.ShaderMaterial,
    isLeaf: boolean,
    seed: number
  ): void {
    const rand = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const disperseDirs = new Float32Array(count * 3);

    // Curated nocturnal botanical palette (warm cream, moonlight amber, pale gold, soft indigo-blue, emerald mist)
    const flowerPalette = [
      new THREE.Color('#f7efe0'), // warm cream
      new THREE.Color('#f5d491'), // warm amber gold
      new THREE.Color('#d8e6ff'), // starlight blue-white
      new THREE.Color('#e6c9a8'), // champagne petal
      new THREE.Color('#95d5c6'), // moonlit sage
      new THREE.Color('#f0b699'), // soft warm coral glow
    ];

    const leafPalette = [
      new THREE.Color('#1c4445'),
      new THREE.Color('#275b56'),
      new THREE.Color('#193349'),
      new THREE.Color('#306658'),
    ];

    const palette = isLeaf ? leafPalette : flowerPalette;

    for (let i = 0; i < count; i++) {
      // Cluster 75% along the winding valley corridor for lush immersion, 25% across wider rolling hills
      let x = 0;
      let z = 0;
      if (rand() < 0.78) {
        const t = rand();
        const pt = this.pathCurve.getPointAt(t);
        const tangent = this.pathCurve.getTangentAt(t);
        const sideX = -tangent.z;
        const sideZ = tangent.x;
        // Leave a narrow breathing path right under the lens while banks burst with flowers
        const sideSign = rand() > 0.5 ? 1 : -1;
        const lateral = sideSign * (1.2 + Math.pow(rand(), 1.35) * 26.0);
        const jitter = (rand() - 0.5) * 4.0;
        x = pt.x + sideX * lateral + tangent.x * jitter;
        z = pt.z + sideZ * lateral + tangent.z * jitter;
      } else {
        const angle = rand() * Math.PI * 2;
        const dist = 5 + Math.sqrt(rand()) * 66;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
      }

      const groundY = this.getTerrainHeight(x, z);
      const stalkHeight = isLeaf ? 0.1 + rand() * 0.75 : 0.25 + rand() * 1.45;

      positions[i * 3] = x;
      positions[i * 3 + 1] = groundY + stalkHeight;
      positions[i * 3 + 2] = z;

      scales[i] = isLeaf ? 0.85 + rand() * 1.35 : 0.55 + Math.pow(rand(), 1.8) * 1.65;
      phases[i] = rand() * Math.PI * 2;

      const baseCol = palette[Math.floor(rand() * palette.length)];
      const shade = 0.78 + rand() * 0.35;
      colors[i * 3] = Math.min(1, baseCol.r * shade);
      colors[i * 3 + 1] = Math.min(1, baseCol.g * shade);
      colors[i * 3 + 2] = Math.min(1, baseCol.b * shade);

      // Outward/upward curl vector for hover dispersion
      const theta = rand() * Math.PI * 2;
      const up = 0.25 + rand() * 1.15;
      const spread = 0.4 + rand() * 1.35;
      disperseDirs[i * 3] = Math.cos(theta) * spread;
      disperseDirs[i * 3 + 1] = up;
      disperseDirs[i * 3 + 2] = Math.sin(theta) * spread;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aDisperseDir', new THREE.BufferAttribute(disperseDirs, 3));

    const points = new THREE.Points(geom, material);
    points.frustumCulled = false;
    this.scene.add(points);
    this.disposables.push(geom);
  }

  private buildDustParticles(
    dustTex: THREE.CanvasTexture,
    count: number
  ): { dustMesh: THREE.Points; dustMat: THREE.PointsMaterial } {
    const rand = seededRandom(7711);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 8 + rand() * 44;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.5 + rand() * 16.0;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      map: dustTex,
      color: 0xf7e7c4,
      size: 0.34,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geom, mat);
    this.scene.add(mesh);
    this.disposables.push(geom, mat);
    return { dustMesh: mesh, dustMat: mat };
  }

  private buildLightRays(rayTex: THREE.CanvasTexture): void {
    const rayCount = 14;
    const geom = new THREE.PlaneGeometry(7.5, 28);
    const mat = new THREE.MeshBasicMaterial({
      map: rayTex,
      color: 0xe6dec8,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.disposables.push(geom, mat);

    for (let i = 0; i < rayCount; i++) {
      const t = i / rayCount;
      const pt = this.pathCurve.getPointAt(t);
      const side = i % 2 === 0 ? 1 : -1;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pt.x + side * (8 + (i % 3) * 4), pt.y + 8.5, pt.z - side * 5);
      mesh.rotation.z = side * 0.14;
      mesh.rotation.y = (i / rayCount) * Math.PI * 2;
      this.scene.add(mesh);
      this.rayMeshes.push(mesh);
    }
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
    this.leafMat.uniforms.uPixelRatio.value = pixelRatio;

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
    this.scrollVelocity += e.deltaY * 0.000018;
    this.scrollVelocity = THREE.MathUtils.clamp(this.scrollVelocity, -0.028, 0.028);
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
    // 20x touch multiplier as in the Fernhollow valley spec
    this.scrollVelocity += delta * 0.000018 * 20;
    this.scrollVelocity = THREE.MathUtils.clamp(this.scrollVelocity, -0.032, 0.032);
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
    this.burstOrigin.copy(this.camera.position);
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

    // Smooth intro glide (0.9s before revealing HUD, echoing Fernhollow's onIntroDone)
    if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + dt * 1.25);
      if (this.introProgress >= 0.85 && !this.introReported) {
        this.introReported = true;
        this.callbacks.onIntroDone?.();
      }
    }

    // Damp disperse state (hover transition)
    this.disperseValue = THREE.MathUtils.damp(this.disperseValue, this.hoverTarget, 2.8, dt);

    // Gentle idle auto-drift along the valley (eases to a stop when dispersed)
    const driftSpeed = this.reducedMotion ? 0.0012 : 0.0075;
    const activeDrift = driftSpeed * (1 - this.disperseValue * 0.92);

    this.scrollProgress = (this.scrollProgress + activeDrift * dt + this.scrollVelocity * dt * 60) % 1;
    if (this.scrollProgress < 0) this.scrollProgress += 1;

    // Friction on virtual scroll velocity
    this.scrollVelocity = THREE.MathUtils.damp(this.scrollVelocity, 0, 4.2, dt);
    const absSpeed = Math.abs(this.scrollVelocity) * 60;

    // Smooth cursor tracking
    this.smoothMouseNdc.x = THREE.MathUtils.damp(this.smoothMouseNdc.x, this.mouseNdc.x, 6.5, dt);
    this.smoothMouseNdc.y = THREE.MathUtils.damp(this.smoothMouseNdc.y, this.mouseNdc.y, 6.5, dt);
    this.mouseActive = THREE.MathUtils.damp(this.mouseActive, this.targetMouseActive, 4.0, dt);

    // Camera along spline path with subtle intro dip + cursor tilt
    this.pathCurve.getPointAt(this.scrollProgress, _camPos);
    const lookT = (this.scrollProgress + 0.032) % 1;
    this.pathCurve.getPointAt(lookT, _lookTarget);

    const introElevation = (1 - Math.pow(this.introProgress, 2)) * 4.2;
    this.camera.position.set(
      _camPos.x + this.smoothMouseNdc.x * 0.75,
      _camPos.y + introElevation + this.smoothMouseNdc.y * 0.45,
      _camPos.z
    );

    _lookTarget.x += this.smoothMouseNdc.x * 2.2;
    _lookTarget.y += this.smoothMouseNdc.y * 1.25 - 0.5;
    this.camera.lookAt(_lookTarget);

    // Subtle FOV breathing on fast scroll
    const targetFov = 52 + Math.min(absSpeed * 5.2, 6.5) + this.disperseValue * 3.0;
    if (Math.abs(this.camera.fov - targetFov) > 0.02) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
      this.camera.updateProjectionMatrix();
    }

    // Accent tint smoothing
    this.accentColor.lerp(this.targetAccentColor, 1 - Math.exp(-3.2 * dt));
    this.accentMix = THREE.MathUtils.damp(this.accentMix, this.targetAccentMix, 3.0, dt);

    // Celebration burst advancement
    if (this.burstProgress < 1) {
      this.burstProgress = Math.min(1, this.burstProgress + dt * 0.55);
    }

    // Update shader uniforms
    const updateMat = (mat: THREE.ShaderMaterial) => {
      mat.uniforms.uTime.value = this.elapsed;
      mat.uniforms.uMouseNdc.value.copy(this.smoothMouseNdc);
      mat.uniforms.uMouseActive.value = this.mouseActive;
      mat.uniforms.uDisperse.value = this.disperseValue;
      mat.uniforms.uBurstProgress.value = this.burstProgress;
      mat.uniforms.uBurstOrigin.value.copy(this.burstOrigin);
      mat.uniforms.uAccentTint.value.copy(this.accentColor);
      mat.uniforms.uTintMix.value = this.accentMix;
    };
    updateMat(this.flowerMat);
    updateMat(this.leafMat);

    // Gentle upward float on dust embers
    this.dustMesh.rotation.y = this.elapsed * 0.015;
    this.dustMesh.position.y = Math.sin(this.elapsed * 0.35) * 0.45;
    this.dustMat.opacity = 0.52 + this.disperseValue * 0.35;

    // Gentle sway on volumetric light rays
    for (let i = 0; i < this.rayMeshes.length; i++) {
      const ray = this.rayMeshes[i];
      ray.rotation.y = this.elapsed * 0.06 + i * 0.7;
    }

    // Post-processing uniforms
    if (this.postPass) {
      this.postPass.uniforms.uTime.value = this.elapsed;
      this.postPass.uniforms.uSpeed.value = absSpeed;
      this.postPass.uniforms.uDisperse.value = this.disperseValue;
    }
    if (this.bloomPass) {
      this.bloomPass.strength = 0.72 + this.disperseValue * 0.38 + (1 - this.burstProgress) * 0.35;
    }

    // Render frame
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
