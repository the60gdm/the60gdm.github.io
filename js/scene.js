/* ============================================================
   60GDM — WebGL hero
   A 3D chrome "60GDM" logo that reacts to the pointer and is
   re-posed on scroll (rotate / move / scale), Bee-style.
   Falls back gracefully if WebGL fails.
   ============================================================ */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 860px)").matches;
const FONT_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json";

const canvas = document.getElementById("webgl");
const wrap = document.getElementById("hero-canvas");

function init() {
  if (!canvas || !wrap) return;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.6 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Environment for chrome reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Chrome / iridescent material (validated look)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc7cbd6,
    metalness: 1.0,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.18,
    iridescence: 0.9,
    iridescenceIOR: 1.4,
    iridescenceThicknessRange: [140, 540],
    envMapIntensity: 0.85,
  });

  // Lights (env does most of the work)
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db4ff, 1.3);
  rim.position.set(-6, -2, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x404050, 0.6));

  // Logo group (filled once the font loads)
  const logoGroup = new THREE.Group();
  scene.add(logoGroup);
  let logoReady = false;

  new FontLoader().load(FONT_URL, (font) => {
    const geo = new TextGeometry("60GDM", {
      font, size: 1, height: 0.35, curveSegments: 10,
      bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 4,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const w = bb.max.x - bb.min.x;
    const h = bb.max.y - bb.min.y;
    const d = bb.max.z - bb.min.z;
    // center the geometry on origin
    geo.translate(-(bb.min.x + w / 2), -(bb.min.y + h / 2), -(bb.min.z + d / 2));
    const mesh = new THREE.Mesh(geo, material);
    logoGroup.add(mesh);
    // scale to fit the viewport width
    const target = isMobile ? 3.0 : 4.2;
    const s = target / w;
    logoGroup.scale.setScalar(s);
    logoGroup.userData.baseS = s;
    logoReady = true;
    reveal();
  }, undefined, (err) => { console.warn("[60GDM] font load failed", err); reveal(); });

  // Floating particles
  const pCount = isMobile ? 180 : 420;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = 4 + Math.pow(Math.random(), 0.5) * 7;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph) - 3;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0xbfc4d6, size: 0.02, transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false })
  );
  scene.add(particles);

  // Post-processing (bloom) — desktop only
  let composer = null;
  if (!isMobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.4, 0.92));
    composer.addPass(new OutputPass());
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
  }

  // Pose driven by scroll (composited with mouse + idle each frame)
  const pose = { ry: 0, rx: 0, px: 0, py: 0, s: 1 };
  buildScrollTimeline(pose, wrap);

  // Pointer
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Resize
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // Pause when tab hidden
  let hidden = false;
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });

  // Loop
  const clock = new THREE.Clock();
  let idle = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (hidden) return;
    const dt = clock.getDelta();
    idle += dt;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    // Composite: scroll pose + mouse tilt + gentle idle
    const mouseInf = REDUCED ? 0 : 1;
    logoGroup.rotation.y = pose.ry + pointer.x * 0.35 * mouseInf + (REDUCED ? 0 : Math.sin(idle * 0.3) * 0.05);
    logoGroup.rotation.x = pose.rx + -pointer.y * 0.22 * mouseInf;
    logoGroup.position.x = pose.px;
    logoGroup.position.y = pose.py + (REDUCED ? 0 : Math.sin(idle * 0.6) * 0.04);
    if (logoGroup.userData.baseS) {
      logoGroup.scale.setScalar(logoGroup.userData.baseS * pose.s);
    }
    particles.rotation.y += dt * 0.02;
    camera.position.x += (pointer.x * 0.25 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.18 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  tick();

  function reveal() {
    wrap.style.opacity = "0";
    wrap.style.transition = "opacity 1.4s ease";
    requestAnimationFrame(() => requestAnimationFrame(() => (wrap.style.opacity = "1")));
  }
}

// Scroll-driven re-posing of the logo (needs gsap + ScrollTrigger)
function buildScrollTimeline(pose, wrap) {
  const g = window.gsap;
  if (!g || !window.ScrollTrigger || REDUCED) return;
  g.registerPlugin(window.ScrollTrigger);
  const tl = g.timeline({
    scrollTrigger: {
      trigger: "#top",
      start: "top top",
      end: () => "+=" + (window.innerHeight * 2.6),
      scrub: 1,
    },
  });
  // Hero -> section 2 -> section 3 : rotate, drift, resize
  tl.to(pose, { ry: Math.PI * 1.15, px: -1.6, py: 0.2, s: 0.8, ease: "none" }, 0)
    .to(pose, { ry: Math.PI * 2.2, rx: 0.25, px: 1.6, py: -0.2, s: 0.7, ease: "none" }, 1)
    .to(pose, { ry: Math.PI * 3.0, rx: 0, px: 0, py: 0.1, s: 0.62, ease: "none" }, 2);

  // fade the fixed canvas as dense content arrives
  g.to(wrap, {
    opacity: 0.16, ease: "none",
    scrollTrigger: { trigger: "#services", start: "top 80%", end: "top 30%", scrub: true },
  });
}

try {
  const test = document.createElement("canvas");
  const gl = test.getContext("webgl2") || test.getContext("webgl");
  if (gl) init();
  else if (wrap) wrap.classList.add("no-webgl");
} catch (err) {
  console.warn("[60GDM] WebGL init failed — using fallback.", err);
  if (wrap) { wrap.classList.add("no-webgl"); wrap.style.opacity = "1"; }
}
