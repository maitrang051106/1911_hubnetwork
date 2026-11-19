export interface MeadowSceneCallbacks {
  onLoaded?: () => void;
  onIntroDone?: () => void;
}

interface SakuraPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  flipPhase: number;
  flipSpeed: number;
  swayPhase: number;
  swayAmp: number;
  depth: number;
  color: string;
  highlight: string;
  opacity: number;
  isBurst?: boolean;
}

interface ForegroundFlowerElement {
  xFrac: number;     // 0..1 across image width
  yFrac: number;     // 0.86..1.03 near bottom meadow edge
  stemLen: number;   // relative to cover height
  scale: number;
  spriteIdx: number; // 0 = pink cosmos, 1 = starburst pink, 2 = white daisy
  phase: number;
  swaySpeed: number;
  swayAmp: number;
  lean: number;
  alpha: number;
}

interface SunMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  opacity: number;
}

const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uTime;
uniform float uHover;
uniform vec3 uAccentTint;
uniform float uTintMix;

in vec2 vUv;
out vec4 fragColor;

vec2 computeCoverUv(vec2 screenUv, vec2 res, vec2 imgSize, vec2 parallax, float zoom) {
  float screenAspect = res.x / max(res.y, 1.0);
  float imgAspect = imgSize.x / max(imgSize.y, 1.0);

  vec2 scale = vec2(1.0);
  if (screenAspect > imgAspect) {
    scale.y = imgAspect / screenAspect;
  } else {
    scale.x = screenAspect / imgAspect;
  }

  vec2 centered = vec2(screenUv.x, 1.0 - screenUv.y) - 0.5;
  return centered * (scale / zoom) + 0.5 + parallax;
}

// Subtle edge-preserving sharpening so every armor engraving and petal stays crisp on Retina displays
vec3 sampleCrisp(sampler2D tex, vec2 uv, vec2 texel) {
  vec3 c = texture(tex, uv).rgb;
  vec3 n = texture(tex, uv + vec2(0.0, -texel.y)).rgb;
  vec3 s = texture(tex, uv + vec2(0.0,  texel.y)).rgb;
  vec3 e = texture(tex, uv + vec2( texel.x, 0.0)).rgb;
  vec3 w = texture(tex, uv + vec2(-texel.x, 0.0)).rgb;

  vec3 minC = min(c, min(min(n, s), min(e, w)));
  vec3 maxC = max(c, max(max(n, s), max(e, w)));
  vec3 avg = (n + s + e + w) * 0.25;

  vec3 sharpened = c + (c - avg) * 0.26;
  return clamp(sharpened, minC - 0.018, maxC + 0.018);
}

void main() {
  float breath = sin(uTime * 0.35) * 0.0055;
  float zoom = 1.045 + breath + uHover * 0.016;
  vec2 parallax = (uMouse - 0.5) * vec2(0.013, 0.008) * uMouseActive;

  vec2 baseUv = computeCoverUv(vUv, uResolution, uImageSize, parallax, zoom);
  vec2 clampedBase = clamp(baseUv, 0.0015, 0.9985);

  // HD Mask: R = meadow grass & wildflowers; Warrior, Sword & Mossy Tree Trunk = 0.0 (100% still & sharp)
  float grassMask = texture(uMask, clampedBase).r;
  vec2 disp = vec2(0.0);

  if (grassMask > 0.004) {
    float depthFactor = smoothstep(0.50, 0.98, clampedBase.y);
    float gust = 0.72 + 0.28 * sin(uTime * 0.52 + clampedBase.x * 2.1);

    float wave1 = sin(uTime * 1.48 + clampedBase.x * 11.5 - clampedBase.y * 5.2);
    float wave2 = cos(uTime * 2.42 + clampedBase.x * 23.5 + clampedBase.y * 12.5) * 0.40;
    float wave3 = sin(uTime * 0.92 + clampedBase.x * 5.4) * 0.32;

    float swayX = (wave1 + wave2 + wave3) * gust * (0.0026 + depthFactor * 0.0044);
    float swayY = cos(uTime * 1.68 + clampedBase.x * 13.0) * (0.0007 + depthFactor * 0.0013);

    vec2 toCursor = clampedBase - uMouse;
    float dist = length(toCursor * vec2(1.77, 1.0));
    float cursorInfluence = exp(-dist * dist * 24.0) * uMouseActive;
    vec2 cursorPush = normalize(toCursor + vec2(0.0001)) * cursorInfluence * 0.0075;

    disp = (vec2(swayX, swayY) + cursorPush) * grassMask;
  }

  // Prevent grass displacement from ever pulling pixels from the locked Warrior, Sword, or Tree Trunk
  vec2 finalUv = clamp(clampedBase - disp, 0.0015, 0.9985);
  float targetGrass = texture(uMask, finalUv).r;
  finalUv = mix(clampedBase, finalUv, clamp(targetGrass * 1.35, 0.0, 1.0));

  vec2 texel = 1.0 / max(uImageSize, vec2(1.0));
  vec3 color = sampleCrisp(uImage, finalUv, texel);

  // Warm breathing sunset glow across the upper-left sky & clouds
  float skyGlow = smoothstep(0.56, 0.04, clampedBase.y) * smoothstep(0.68, 0.05, clampedBase.x);
  float sunsetPulse = 0.5 + 0.5 * sin(uTime * 0.45 + clampedBase.x * 1.8);
  color += vec3(0.032, 0.016, 0.010) * skyGlow * sunsetPulse;

  // Subtle sunlit highlight across swaying wind crests in the meadow
  float windShimmer = smoothstep(0.35, 1.0, sin(uTime * 1.48 + clampedBase.x * 11.5 - clampedBase.y * 5.2)) * grassMask;
  color += vec3(0.028, 0.018, 0.014) * windShimmer;

  // Ultra-subtle HUB Network member accent mood tint when hovering portrait cards
  color = mix(color, mix(color, uAccentTint, 0.15), uTintMix * 0.52);

  // Delicate romantic vignette
  vec2 vig = vUv - 0.5;
  float vigAmt = 1.0 - smoothstep(0.47, 0.99, length(vig)) * 0.22;
  color *= vigAmt;

  fragColor = vec4(color, 1.0);
}
`;

const PETAL_PALETTE: Array<{ color: string; highlight: string }> = [
  { color: '#d87d95', highlight: '#f6c7d2' },
  { color: '#c15d78', highlight: '#ea9ab0' },
  { color: '#e6a0b0', highlight: '#fce0e4' },
  { color: '#9e4660', highlight: '#cf748c' },
  { color: '#823850', highlight: '#b56178' },
  { color: '#f0bcc0', highlight: '#fff0eb' },
];

export class MeadowSceneEngine {
  private container: HTMLElement;
  private callbacks: MeadowSceneCallbacks;

  private glCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private baseTex: WebGLTexture | null = null;
  private maskTex: WebGLTexture | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private baseImg: HTMLImageElement | null = null;
  private canopyLeftImg: HTMLImageElement | null = null;
  private canopyRightImg: HTMLImageElement | null = null;
  private flowerSprites: Array<HTMLImageElement | null> = [null, null, null];

  private imgWidth = 1376;
  private imgHeight = 768;

  private petals: SakuraPetal[] = [];
  private fgFlowers: ForegroundFlowerElement[] = [];
  private motes: SunMote[] = [];

  private mouseTarget = { x: 0.5, y: 0.5 };
  private mouseSmooth = { x: 0.5, y: 0.5 };
  private mouseActive = 0;
  private mouseActiveTarget = 0;

  private hoverVal = 0;
  private hoverTarget = 0;

  private accentColor = [0.95, 0.72, 0.79];
  private targetAccentColor = [0.95, 0.72, 0.79];
  private tintMix = 0;
  private targetTintMix = 0;

  private reducedMotion = false;
  private isDisposed = false;
  private assetsReady = false;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private introReported = false;

  constructor(container: HTMLElement, callbacks: MeadowSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. WebGL2 HD Base Layer (Locked Warrior + Sword + Mossy Tree Trunk, gently swaying meadow)
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.position = 'absolute';
    this.glCanvas.style.inset = '0';
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.glCanvas.style.display = 'block';
    container.appendChild(this.glCanvas);

    // 2. Crisp DPR-scaled Animated Cutout Elements Layer (Swaying Sakura Canopies, Cutout Foreground Flowers, Falling Petals & Warm Motes)
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.inset = '0';
    this.overlayCanvas.style.width = '100%';
    this.overlayCanvas.style.height = '100%';
    this.overlayCanvas.style.display = 'block';
    this.overlayCanvas.style.pointerEvents = 'none';
    container.appendChild(this.overlayCanvas);

    this.ctx2d = this.overlayCanvas.getContext('2d');
    this.initWebGL();
    this.initPetals(this.reducedMotion ? 16 : 44);
    this.initForegroundFlowers();
    this.initMotes(this.reducedMotion ? 8 : 22);
    this.handleResize();
    this.bindEvents();
    this.loadAssets();
  }

  private initWebGL(): void {
    const gl = this.glCanvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;
    this.gl = gl;

    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return;
    }

    this.program = prog;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.vao = vao;

    const uniformNames = [
      'uImage',
      'uMask',
      'uResolution',
      'uImageSize',
      'uMouse',
      'uMouseActive',
      'uTime',
      'uHover',
      'uAccentTint',
      'uTintMix',
    ];
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(prog, name);
    }
  }

  private uploadTexture(img: HTMLImageElement, unit: number): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return tex;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private async loadAssets(): Promise<void> {
    try {
      const [baseImg, maskImg, canopyL, canopyR, flPink, flStar, flWhite] = await Promise.all([
        this.loadImage('/assets/layers/base-hd-clean.jpg'),
        this.loadImage('/assets/layers/meadow-sway-mask-hd.png'),
        this.loadImage('/assets/layers/sakura-canopy-left.png').catch(() => null),
        this.loadImage('/assets/layers/sakura-canopy-right.png').catch(() => null),
        this.loadImage('/assets/layers/blossom-pink.png').catch(() => null),
        this.loadImage('/assets/layers/blossom-pink-star.png').catch(() => null),
        this.loadImage('/assets/layers/blossom-white.png').catch(() => null),
      ]);
      if (this.isDisposed) return;

      this.baseImg = baseImg;
      this.canopyLeftImg = canopyL;
      this.canopyRightImg = canopyR;
      this.flowerSprites = [flPink, flStar, flWhite];
      this.imgWidth = baseImg.naturalWidth || 1376;
      this.imgHeight = baseImg.naturalHeight || 768;

      if (this.gl && this.program) {
        this.baseTex = this.uploadTexture(baseImg, 0);
        this.maskTex = this.uploadTexture(maskImg, 1);
      }

      this.assetsReady = true;
      this.callbacks.onLoaded?.();
      this.lastTime = performance.now();
      this.tick(this.lastTime);
    } catch {
      if (!this.isDisposed) {
        this.callbacks.onLoaded?.();
        this.callbacks.onIntroDone?.();
      }
    }
  }

  /**
   * Independent cut-out foreground wildflower stems gently nodding along the very bottom meadow edge
   * for subtle layered depth parallax without touching the resting knight or tree trunk.
   */
  private initForegroundFlowers(): void {
    this.fgFlowers = [
      { xFrac: 0.05, yFrac: 0.99, stemLen: 0.085, scale: 0.92, spriteIdx: 0, phase: 0.4, swaySpeed: 1.45, swayAmp: 0.14, lean: -0.06, alpha: 0.88 },
      { xFrac: 0.11, yFrac: 1.01, stemLen: 0.095, scale: 0.78, spriteIdx: 1, phase: 1.5, swaySpeed: 1.62, swayAmp: 0.16, lean: 0.05, alpha: 0.84 },
      { xFrac: 0.17, yFrac: 1.00, stemLen: 0.075, scale: 0.72, spriteIdx: 2, phase: 2.3, swaySpeed: 1.38, swayAmp: 0.12, lean: -0.04, alpha: 0.80 },
      { xFrac: 0.25, yFrac: 1.02, stemLen: 0.092, scale: 0.86, spriteIdx: 0, phase: 3.1, swaySpeed: 1.55, swayAmp: 0.15, lean: 0.07, alpha: 0.82 },
      { xFrac: 0.34, yFrac: 1.01, stemLen: 0.072, scale: 0.68, spriteIdx: 1, phase: 4.0, swaySpeed: 1.72, swayAmp: 0.13, lean: -0.05, alpha: 0.76 },
      { xFrac: 0.43, yFrac: 1.02, stemLen: 0.082, scale: 0.84, spriteIdx: 2, phase: 0.9, swaySpeed: 1.42, swayAmp: 0.14, lean: 0.04, alpha: 0.78 },
      { xFrac: 0.86, yFrac: 1.01, stemLen: 0.088, scale: 0.88, spriteIdx: 0, phase: 2.1, swaySpeed: 1.50, swayAmp: 0.15, lean: -0.08, alpha: 0.84 },
      { xFrac: 0.92, yFrac: 1.00, stemLen: 0.098, scale: 0.78, spriteIdx: 2, phase: 3.6, swaySpeed: 1.65, swayAmp: 0.16, lean: 0.06, alpha: 0.82 },
      { xFrac: 0.97, yFrac: 0.99, stemLen: 0.085, scale: 0.90, spriteIdx: 1, phase: 5.0, swaySpeed: 1.40, swayAmp: 0.14, lean: -0.05, alpha: 0.86 },
    ];
  }

  private initMotes(count: number): void {
    this.motes = [];
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: Math.random(),
        y: 0.12 + Math.random() * 0.76,
        vx: -0.005 - Math.random() * 0.008,
        vy: -0.003 + (Math.random() - 0.5) * 0.006,
        radius: 1.1 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.18 + Math.random() * 0.32,
      });
    }
  }

  private createPetal(randomY = false, isBurst = false): SakuraPetal {
    const tone = PETAL_PALETTE[Math.floor(Math.random() * PETAL_PALETTE.length)];
    // Spawn primarily from the swaying overhanging sakura canopy on top-left/top-center
    const fromLeftCanopy = Math.random() < 0.82;
    const x = fromLeftCanopy ? 0.12 + Math.random() * 0.51 : 0.86 + Math.random() * 0.16;
    const y = randomY ? Math.random() * 0.96 : fromLeftCanopy ? 0.01 + Math.random() * 0.11 : 0.01 + Math.random() * 0.05;
    const depth = Math.random() < 0.16 ? 1.12 + Math.random() * 0.32 : 0.42 + Math.random() * 0.58;

    return {
      x,
      y,
      vx: (-0.015 - Math.random() * 0.025) * (isBurst ? 1.45 : 1.0) * (0.7 + depth * 0.45),
      vy: (0.030 + Math.random() * 0.042) * (isBurst ? 1.25 : 1.0) * (0.65 + depth * 0.5),
      size: (5.0 + Math.random() * 5.6) * depth,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 1.85,
      flipPhase: Math.random() * Math.PI * 2,
      flipSpeed: 1.35 + Math.random() * 2.0,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 0.014 + Math.random() * 0.021,
      depth,
      color: tone.color,
      highlight: tone.highlight,
      opacity: depth > 1.08 ? 0.54 + Math.random() * 0.24 : 0.72 + Math.random() * 0.26,
      isBurst,
    };
  }

  private initPetals(count: number): void {
    this.petals = [];
    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal(true, false));
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', this.handlePointerLeave);
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.glCanvas.width = Math.max(1, Math.round(width * dpr));
    this.glCanvas.height = Math.max(1, Math.round(height * dpr));
    this.overlayCanvas.width = Math.max(1, Math.round(width * dpr));
    this.overlayCanvas.height = Math.max(1, Math.round(height * dpr));

    if (this.gl) {
      this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    this.mouseTarget.x = e.clientX / Math.max(window.innerWidth, 1);
    this.mouseTarget.y = e.clientY / Math.max(window.innerHeight, 1);
    this.mouseActiveTarget = 1;
  };

  private handlePointerLeave = (): void => {
    this.mouseActiveTarget = 0;
  };

  public startHoverTransition(): void {
    this.hoverTarget = 1;
  }

  public stopHoverTransition(): void {
    this.hoverTarget = 0;
  }

  public setScrollLocked(_locked: boolean): void {
    // Living-artwork view stays calmly framed
  }

  public setAccentTint(hex: string | null): void {
    if (!hex) {
      this.targetTintMix = 0;
      return;
    }
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      const n = parseInt(clean, 16);
      this.targetAccentColor = [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255,
      ];
      this.targetTintMix = 1;
    }
  }

  public triggerCelebrationBurst(hex?: string): void {
    if (hex) this.setAccentTint(hex);
    if (this.reducedMotion) return;
    for (let i = 0; i < 18; i++) {
      this.petals.push(this.createPetal(false, true));
    }
  }

  /**
   * Exact sub-pixel matching cover rectangle synchronized with WebGL computeCoverUv().
   */
  private getCoverRect(w: number, h: number) {
    const breath = this.reducedMotion ? 0 : Math.sin(this.elapsed * 0.35) * 0.0055;
    const zoom = 1.045 + breath + this.hoverVal * 0.016;
    const screenAspect = w / Math.max(h, 1);
    const imgAspect = this.imgWidth / Math.max(this.imgHeight, 1);

    const scaleX = screenAspect > imgAspect ? 1 : screenAspect / imgAspect;
    const scaleY = screenAspect > imgAspect ? imgAspect / screenAspect : 1;

    const drawW = (w * zoom) / scaleX;
    const drawH = (h * zoom) / scaleY;
    const parallaxX = (this.mouseSmooth.x - 0.5) * 0.013 * this.mouseActive;
    const parallaxY = (this.mouseSmooth.y - 0.5) * 0.008 * this.mouseActive;

    return {
      x: (w - drawW) * 0.5 - parallaxX * drawW,
      y: (h - drawH) * 0.5 - parallaxY * drawH,
      w: drawW,
      h: drawH,
    };
  }

  private renderWebGL(): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.vao || !this.baseTex || !this.maskTex) {
      return;
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.baseTex);
    gl.uniform1i(this.uniforms.uImage, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.uniform1i(this.uniforms.uMask, 1);

    gl.uniform2f(this.uniforms.uResolution, this.glCanvas.width, this.glCanvas.height);
    gl.uniform2f(this.uniforms.uImageSize, this.imgWidth, this.imgHeight);
    gl.uniform2f(this.uniforms.uMouse, this.mouseSmooth.x, this.mouseSmooth.y);
    gl.uniform1f(this.uniforms.uMouseActive, this.mouseActive);
    gl.uniform1f(this.uniforms.uTime, this.reducedMotion ? 0 : this.elapsed);
    gl.uniform1f(this.uniforms.uHover, this.hoverVal);
    gl.uniform3f(
      this.uniforms.uAccentTint,
      this.accentColor[0],
      this.accentColor[1],
      this.accentColor[2]
    );
    gl.uniform1f(this.uniforms.uTintMix, this.tintMix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  private renderOverlay(dt: number): void {
    const ctx = this.ctx2d;
    if (!ctx) return;

    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cover = this.getCoverRect(w, h);
    const sx = cover.w / this.imgWidth;
    const sy = cover.h / this.imgHeight;

    ctx.clearRect(0, 0, w, h);

    if (!this.gl && this.baseImg) {
      ctx.drawImage(this.baseImg, cover.x, cover.y, cover.w, cover.h);
    }

    // 1. Cutout Animated Element: Overhanging Left Sakura Canopy (anchored at tree-trunk side)
    if (this.canopyLeftImg) {
      const cx = cover.x + 155 * sx;
      const cy = cover.y;
      const cw = this.canopyLeftImg.naturalWidth * sx;
      const ch = this.canopyLeftImg.naturalHeight * sy;

      const rot = this.reducedMotion
        ? 0
        : Math.sin(this.elapsed * 0.85) * 0.015 + Math.cos(this.elapsed * 1.65) * 0.006;
      const shear = this.reducedMotion ? 0 : Math.sin(this.elapsed * 1.25 + 0.6) * 0.018;
      const breezeY = this.reducedMotion ? 0 : Math.sin(this.elapsed * 1.1) * 2.0 * dpr;

      ctx.save();
      // Pivot cleanly at top-right edge near the mossy tree trunk
      ctx.translate(cx + cw, cy + breezeY);
      ctx.rotate(rot);
      ctx.transform(1, 0, shear, 1, 0, 0);
      ctx.drawImage(this.canopyLeftImg, -cw, -2 * sy, cw, ch + 2 * sy);
      ctx.restore();
    }

    // 2. Cutout Animated Element: Top-Right Sakura Sprig (anchored at tree-trunk side)
    if (this.canopyRightImg) {
      const rx = cover.x + 1212 * sx;
      const ry = cover.y;
      const rw = this.canopyRightImg.naturalWidth * sx;
      const rh = this.canopyRightImg.naturalHeight * sy;

      const rotR = this.reducedMotion ? 0 : Math.sin(this.elapsed * 0.95 + 1.2) * 0.022;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rotR);
      ctx.drawImage(this.canopyRightImg, 0, -2 * sy, rw, rh + 2 * sy);
      ctx.restore();
    }

    // 3. Soft Golden Sunset Pollen Motes drifting gently through the warm evening light
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      if (!this.reducedMotion) {
        m.x += (m.vx + Math.sin(this.elapsed * 0.7 + m.phase) * 0.003) * dt;
        m.y += (m.vy + Math.cos(this.elapsed * 0.9 + m.phase) * 0.003) * dt;
        if (m.x < -0.04) m.x = 1.04;
        if (m.y < 0.08) m.y = 0.85;
        if (m.y > 0.92) m.y = 0.14;
      }
      const pulse = 0.55 + 0.45 * Math.sin(this.elapsed * 1.8 + m.phase);
      const mx = m.x * w;
      const my = m.y * h;
      const mr = m.radius * dpr;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3.2);
      grad.addColorStop(0, `rgba(255, 232, 198, ${(m.opacity * pulse).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(255, 210, 170, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Cutout Animated Elements: Swaying Foreground Wildflowers on Slender Grass Stems
    const extraParallaxX = -(this.mouseSmooth.x - 0.5) * w * 0.012 * this.mouseActive;
    for (let i = 0; i < this.fgFlowers.length; i++) {
      const f = this.fgFlowers[i];
      const sprite = this.flowerSprites[f.spriteIdx];
      if (!sprite) continue;

      const rootX = cover.x + f.xFrac * cover.w + extraParallaxX;
      const rootY = cover.y + f.yFrac * cover.h;
      const stemH = f.stemLen * cover.h;

      const windAngle = this.reducedMotion
        ? f.lean
        : f.lean +
          Math.sin(this.elapsed * f.swaySpeed + f.phase) * f.swayAmp +
          Math.cos(this.elapsed * (f.swaySpeed * 1.55) + f.phase) * (f.swayAmp * 0.35);

      const mouseDx = rootX / Math.max(w, 1) - this.mouseSmooth.x;
      const mouseDist = Math.abs(mouseDx);
      const cursorTilt =
        mouseDist < 0.22 ? Math.sign(mouseDx || 1) * (1 - mouseDist / 0.22) * 0.18 * this.mouseActive : 0;

      const totalAngle = windAngle + cursorTilt;
      const tipX = rootX + Math.sin(totalAngle) * stemH;
      const tipY = rootY - Math.cos(totalAngle) * stemH;

      ctx.save();
      ctx.globalAlpha = f.alpha;

      // Slender organic dark-olive stem matching the meadow grass
      ctx.strokeStyle = 'rgba(54, 58, 36, 0.85)';
      ctx.lineWidth = Math.max(1.2, 1.8 * sx);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(
        rootX + Math.sin(totalAngle * 0.45) * stemH * 0.5,
        rootY - stemH * 0.55,
        tipX,
        tipY
      );
      ctx.stroke();

      // Cut-out wildflower blossom perched on the swaying stem
      const fw = sprite.naturalWidth * sx * f.scale * 0.92;
      const fh = sprite.naturalHeight * sy * f.scale * 0.92;
      ctx.translate(tipX, tipY);
      ctx.rotate(totalAngle * 0.85);
      ctx.drawImage(sprite, -fw * 0.5, -fh * 0.62, fw, fh);
      ctx.restore();
    }

    // 5. Delicate Falling Sakura Petals drifting from the swaying overhanging canopy
    const speedScale = this.reducedMotion ? 0.25 : 1 - this.hoverVal * 0.32;
    const mouseWindX = (this.mouseSmooth.x - 0.5) * 0.016 * this.mouseActive;

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      const sway = Math.sin(this.elapsed * 1.32 + p.swayPhase) * p.swayAmp;

      p.x += (p.vx + sway + mouseWindX) * dt * speedScale;
      p.y += p.vy * dt * speedScale;
      p.rotation += p.vRot * dt * speedScale;
      p.flipPhase += p.flipSpeed * dt * speedScale;

      if (p.y > 1.07 || p.x < -0.1 || p.x > 1.14) {
        if (p.isBurst) {
          this.petals.splice(i, 1);
          continue;
        }
        Object.assign(p, this.createPetal(false, false));
      }

      const px = p.x * w;
      const py = p.y * h;
      const r = p.size * dpr;
      const flipScale = 0.28 + 0.72 * Math.abs(Math.cos(p.flipPhase));

      const edgeFade =
        Math.min(1, Math.max(0, (p.y + 0.02) * 5.2)) *
        Math.min(1, Math.max(0, (1.05 - p.y) * 5.5));

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rotation);
      ctx.scale(1, flipScale);
      ctx.globalAlpha = p.opacity * edgeFade;

      if (p.depth > 1.1) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4.5 * dpr;
      }

      const grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, p.highlight);
      grad.addColorStop(1, p.color);
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, r * 0.92);
      ctx.bezierCurveTo(-r * 0.82, r * 0.42, -r * 0.76, -r * 0.58, -r * 0.24, -r * 0.88);
      ctx.lineTo(0, -r * 0.56);
      ctx.lineTo(r * 0.24, -r * 0.88);
      ctx.bezierCurveTo(r * 0.76, -r * 0.58, r * 0.82, r * 0.42, 0, r * 0.92);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private tick = (now: number): void => {
    if (this.isDisposed) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += dt;

    if (!this.introReported && this.elapsed > 0.2) {
      this.introReported = true;
      this.callbacks.onIntroDone?.();
    }

    const damp = (cur: number, target: number, lambda: number) =>
      cur + (target - cur) * (1 - Math.exp(-lambda * dt));

    this.mouseSmooth.x = damp(this.mouseSmooth.x, this.mouseTarget.x, 3.6);
    this.mouseSmooth.y = damp(this.mouseSmooth.y, this.mouseTarget.y, 3.6);
    this.mouseActive = damp(this.mouseActive, this.mouseActiveTarget, 3.2);
    this.hoverVal = damp(this.hoverVal, this.hoverTarget, 2.8);
    this.tintMix = damp(this.tintMix, this.targetTintMix, 3.0);

    for (let i = 0; i < 3; i++) {
      this.accentColor[i] = damp(this.accentColor[i], this.targetAccentColor[i], 3.2);
    }

    if (this.assetsReady) {
      this.renderWebGL();
      this.renderOverlay(dt);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.rafId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerleave', this.handlePointerLeave);

    if (this.gl) {
      if (this.baseTex) this.gl.deleteTexture(this.baseTex);
      if (this.maskTex) this.gl.deleteTexture(this.maskTex);
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.vao) this.gl.deleteVertexArray(this.vao);
    }

    if (this.glCanvas.parentNode === this.container) {
      this.container.removeChild(this.glCanvas);
    }
    if (this.overlayCanvas.parentNode === this.container) {
      this.container.removeChild(this.overlayCanvas);
    }
  }
}
