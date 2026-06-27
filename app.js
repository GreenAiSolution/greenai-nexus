import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ═══════════════════════════════════════════
   NEXUS — 3D Scene
   Central gold hub node · agent orbs orbit ·
   connector nodes outer ring · data streams ·
   scroll-driven camera
═══════════════════════════════════════════ */

const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 0, 28);

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2, 0.5, 0.55
);
composer.addPass(bloom);

// ── COLORS ──────────────────────────────────
const GOLD    = new THREE.Color(0xC9A84C);
const GOLD_LT = new THREE.Color(0xF0D88A);
const CYAN    = new THREE.Color(0x00C8FF);
const WHITE   = new THREE.Color(0xFFFFFF);
const DIM     = new THREE.Color(0x1A1A2E);

// ── CENTRAL NEXUS HUB ───────────────────────
const hubGeo = new THREE.IcosahedronGeometry(2.2, 4);

// Displace vertices for organic feel
const hubPos = hubGeo.attributes.position;
for (let i = 0; i < hubPos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(hubPos, i);
  v.normalize().multiplyScalar(2.2 + (Math.random() - 0.5) * 0.18);
  hubPos.setXYZ(i, v.x, v.y, v.z);
}
hubPos.needsUpdate = true;
hubGeo.computeVertexNormals();

const hubMat = new THREE.MeshStandardMaterial({
  color: GOLD,
  emissive: GOLD,
  emissiveIntensity: 0.35,
  metalness: 0.9,
  roughness: 0.2,
  wireframe: false,
});
const hub = new THREE.Mesh(hubGeo, hubMat);
scene.add(hub);

// Hub wireframe overlay
const hubWireMat = new THREE.MeshBasicMaterial({
  color: GOLD_LT,
  wireframe: true,
  transparent: true,
  opacity: 0.07,
});
const hubWire = new THREE.Mesh(hubGeo.clone(), hubWireMat);
hubWire.scale.setScalar(1.02);
scene.add(hubWire);

// Hub glow sphere
const glowGeo = new THREE.SphereGeometry(3.5, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
  color: GOLD,
  transparent: true,
  opacity: 0.04,
  side: THREE.BackSide,
});
const glow = new THREE.Mesh(glowGeo, glowMat);
scene.add(glow);

// ── AGENT ORBIT NODES ───────────────────────
const AGENT_NAMES = [
  'CFO', 'SDR', 'SUPPORT', 'OPS',
  'MARKETING', 'HR', 'EXEC ASST', 'DATA'
];
const AGENT_COLORS = [
  0xC9A84C, 0x00C8FF, 0xC9A84C, 0x00C8FF,
  0xC9A84C, 0x00C8FF, 0xC9A84C, 0x00C8FF,
];

const agentGroup = new THREE.Group();
scene.add(agentGroup);
const agentNodes = [];

AGENT_NAMES.forEach((name, i) => {
  const angle = (i / AGENT_NAMES.length) * Math.PI * 2;
  const radius = 8.5;
  const x = Math.cos(angle) * radius;
  const y = (Math.random() - 0.5) * 4;
  const z = Math.sin(angle) * radius;

  const color = new THREE.Color(AGENT_COLORS[i]);

  // Node sphere
  const geo = new THREE.OctahedronGeometry(0.45, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.15,
  });
  const node = new THREE.Mesh(geo, mat);
  node.position.set(x, y, z);
  agentGroup.add(node);

  // Node ring
  const ringGeo = new THREE.TorusGeometry(0.75, 0.015, 8, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(node.position);
  ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
  agentGroup.add(ring);

  agentNodes.push({ node, ring, angle, radius, baseY: y, speed: 0.08 + Math.random() * 0.04 });
});

// ── CONNECTOR ORBIT (outer ring) ────────────
const CONNECTORS = [
  'QB', 'SF', 'SLACK', 'HS', 'STRIPE',
  'ZD', 'NOTION', 'ASANA', 'GMAIL', 'SHOPIFY', 'GUSTO', 'SHEETS'
];

const connGroup = new THREE.Group();
scene.add(connGroup);
const connNodes = [];

CONNECTORS.forEach((name, i) => {
  const angle = (i / CONNECTORS.length) * Math.PI * 2;
  const radius = 14;
  const x = Math.cos(angle) * radius;
  const y = (Math.random() - 0.5) * 3;
  const z = Math.sin(angle) * radius;

  const geo = new THREE.SphereGeometry(0.28, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x334466,
    transparent: true,
    opacity: 0.8,
  });
  const node = new THREE.Mesh(geo, mat);
  node.position.set(x, y, z);
  connGroup.add(node);
  connNodes.push({ node, angle, radius, baseY: y });
});

// ── DATA STREAM LINES ────────────────────────
const streamGroup = new THREE.Group();
scene.add(streamGroup);

function makeStream(from, to, color, opacity = 0.15) {
  const points = [from.clone(), to.clone()];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
  });
  return new THREE.Line(geo, mat);
}

// Hub to agent streams
agentNodes.forEach(({ node }) => {
  const stream = makeStream(new THREE.Vector3(0, 0, 0), node.position, GOLD, 0.12);
  streamGroup.add(stream);
});

// Agent to connector streams (random pairings)
agentNodes.forEach(({ node }, i) => {
  const ci = i % connNodes.length;
  const stream = makeStream(node.position, connNodes[ci].node.position, CYAN, 0.06);
  streamGroup.add(stream);
});

// ── PARTICLE FIELD ───────────────────────────
const PARTICLE_COUNT = 1800;
const pPositions = new Float32Array(PARTICLE_COUNT * 3);
const pSizes = new Float32Array(PARTICLE_COUNT);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const r = 10 + Math.random() * 25;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  pPositions[i * 3 + 2] = r * Math.cos(phi);
  pSizes[i] = Math.random() * 1.5 + 0.3;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
const pMat = new THREE.PointsMaterial({
  color: 0x3A3A5A,
  size: 0.06,
  transparent: true,
  opacity: 0.7,
  sizeAttenuation: true,
});
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ── TORUS RINGS (decorative) ─────────────────
[5.5, 11.5, 17].forEach((r, i) => {
  const geo = new THREE.TorusGeometry(r, 0.015, 4, 128);
  const mat = new THREE.MeshBasicMaterial({
    color: i === 0 ? GOLD : 0x1A2244,
    transparent: true,
    opacity: i === 0 ? 0.3 : 0.12,
  });
  const torus = new THREE.Mesh(geo, mat);
  torus.rotation.x = Math.PI / 2 + (i * 0.15);
  scene.add(torus);
});

// ── LIGHTING ─────────────────────────────────
const ambLight = new THREE.AmbientLight(0x0A0A1A, 2);
scene.add(ambLight);

const goldLight = new THREE.PointLight(GOLD, 8, 30);
goldLight.position.set(0, 0, 0);
scene.add(goldLight);

const cyanLight = new THREE.PointLight(CYAN, 3, 40);
cyanLight.position.set(12, 6, -8);
scene.add(cyanLight);

const rimLight = new THREE.PointLight(0xFFFFFF, 1.5, 35);
rimLight.position.set(-10, 8, 12);
scene.add(rimLight);

// ── SCROLL CAMERA KEYFRAMES ──────────────────
const keyframes = [
  { pos: new THREE.Vector3(0, 0, 28),  target: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(14, 3, 18), target: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(-8, 6, 22), target: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(0, 10, 24), target: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(0, 2, 30),  target: new THREE.Vector3(0, 0, 0) },
];

let currentKF = 0;
let targetPos = keyframes[0].pos.clone();
let targetLook = keyframes[0].target.clone();

const cameraTarget = new THREE.Vector3();
cameraTarget.copy(keyframes[0].target);

// ── MOUSE PARALLAX ───────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
document.addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ── SCROLL ───────────────────────────────────
let scrollProgress = 0;
const totalSections = 5;

window.addEventListener('scroll', () => {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  const kfFloat = scrollProgress * (keyframes.length - 1);
  const kfIdx = Math.floor(kfFloat);
  const kfT = kfFloat - kfIdx;
  const a = keyframes[Math.min(kfIdx, keyframes.length - 1)];
  const b = keyframes[Math.min(kfIdx + 1, keyframes.length - 1)];

  targetPos.lerpVectors(a.pos, b.pos, kfT);
  targetLook.lerpVectors(a.target, b.target, kfT);

  // Nav scroll class
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

// ── INTERSECTION OBSERVER ────────────────────
const revealEls = document.querySelectorAll('.reveal, .agent-card, .connector-cat, .cap-card, .plan-card');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => io.observe(el));

// ── STAT COUNTERS ────────────────────────────
const statNums = document.querySelectorAll('.stat-num');
const statIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = +e.target.dataset.target;
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        e.target.textContent = Math.round(current);
        if (current >= target) clearInterval(timer);
      }, 16);
      statIO.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => statIO.observe(el));

// ── RESIZE ───────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ── CLOCK ────────────────────────────────────
const clock = new THREE.Clock();

// ── ANIMATE ──────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = clock.getDelta ? 0.016 : 0.016;

  // Mouse lerp
  mouse.x += (mouse.tx - mouse.x) * 0.04;
  mouse.y += (mouse.ty - mouse.y) * 0.04;

  // Hub pulse
  const hubScale = 1 + Math.sin(t * 1.2) * 0.025;
  hub.scale.setScalar(hubScale);
  hubWire.scale.setScalar(hubScale * 1.02);
  glow.scale.setScalar(hubScale * 1.1);
  goldLight.intensity = 6 + Math.sin(t * 0.8) * 2;

  // Hub slow rotation
  hub.rotation.y = t * 0.08;
  hub.rotation.x = t * 0.04;
  hubWire.rotation.y = -t * 0.06;

  // Agent orbit rotation
  agentGroup.rotation.y = t * 0.04;
  agentNodes.forEach(({ node, ring, angle, radius, baseY }, i) => {
    node.rotation.y = t * 1.2 + i;
    ring.rotation.z = t * 0.6 + i * 0.8;
    node.position.y = baseY + Math.sin(t * 0.5 + i * 0.8) * 0.4;
    ring.position.y = node.position.y;
  });

  // Connector orbit (opposite direction, slower)
  connGroup.rotation.y = -t * 0.02;
  connNodes.forEach(({ node, baseY }, i) => {
    node.position.y = baseY + Math.sin(t * 0.3 + i * 0.5) * 0.3;
  });

  // Particle drift
  particles.rotation.y = t * 0.005;
  particles.rotation.x = t * 0.003;

  // Camera interpolation
  camera.position.lerp(targetPos, 0.03);
  cameraTarget.lerp(targetLook, 0.03);

  // Mouse parallax offset (subtle)
  camera.position.x += mouse.x * 0.8;
  camera.position.y -= mouse.y * 0.5;
  camera.lookAt(cameraTarget);

  // Bloom pulse
  bloom.strength = 1.1 + Math.sin(t * 0.4) * 0.15;

  composer.render();
}
animate();

// ── LOADER HIDE ──────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2400);
});

// ── STRIPE PAYMENT LINKS ─────────────────────
// Paste your Stripe Payment Link URLs here after creating them at dashboard.stripe.com
const STRIPE_LINKS = {
  starter:    'https://buy.stripe.com/REPLACE_WITH_STARTER_LINK',
  growth:     'https://buy.stripe.com/REPLACE_WITH_GROWTH_LINK',
};

// Plan details
const PLANS = {
  starter: {
    name:       'STARTER',
    build:      '$4,997',
    monthly:    '$2,497/mo',
    agents:     '1 Elite AI Agent',
    stripe:     STRIPE_LINKS.starter,
  },
  growth: {
    name:       'GROWTH',
    build:      '$9,997',
    monthly:    '$5,997/mo',
    agents:     '3 Elite AI Agents',
    stripe:     STRIPE_LINKS.growth,
  },
};

let activePlan = 'growth';

// ── MODAL ────────────────────────────────────
window.openModal = function(plan) {
  activePlan = plan || 'growth';

  // Reset to step 1
  document.querySelectorAll('.modal-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('modal-step-1').classList.remove('hidden');

  // Show plan badge at top of step 1
  const p = PLANS[activePlan];
  document.getElementById('modal-plan-summary').innerHTML =
    `<div class="plan-badge-modal">${p.name} — ${p.build} setup + ${p.monthly}</div>`;

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
};

window.nextStep = function(step) {
  document.querySelectorAll('.modal-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('modal-step-' + step).classList.remove('hidden');

  // When reaching payment step, build the summary + set Stripe link
  if (step === 3) buildCheckoutSummary();
};

window.validateStep1 = function() {
  const company = document.getElementById('f-company').value.trim();
  const name    = document.getElementById('f-name').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  if (!company || !name || !email) {
    showFieldError('Please fill in Company Name, Your Name, and Email.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('Please enter a valid email address.');
    return;
  }
  nextStep(2);
};

function showFieldError(msg) {
  let err = document.getElementById('field-error');
  if (!err) {
    err = document.createElement('div');
    err.id = 'field-error';
    err.className = 'field-error';
    document.querySelector('#modal-step-1 .modal-form').prepend(err);
  }
  err.textContent = msg;
  err.style.display = 'block';
  setTimeout(() => { err.style.display = 'none'; }, 3500);
}

function buildCheckoutSummary() {
  const p       = PLANS[activePlan];
  const company = document.getElementById('f-company').value.trim();
  const name    = document.getElementById('f-name').value.trim();
  const email   = document.getElementById('f-email').value.trim();

  // Collect selected agents
  const agents = [...document.querySelectorAll('.agent-sel-item.selected')]
    .map(el => el.textContent.trim()).join(', ') || 'To be confirmed on strategy call';

  // Collect selected connectors
  const conns = [...document.querySelectorAll('.conn-item.selected')]
    .map(el => el.textContent.trim()).join(', ') || 'To be confirmed on strategy call';

  document.getElementById('checkout-summary').innerHTML = `
    <div class="checkout-row"><span>Plan</span><strong>${p.name}</strong></div>
    <div class="checkout-row"><span>Setup Fee (one-time)</span><strong>${p.build}</strong></div>
    <div class="checkout-row"><span>Monthly Retainer</span><strong>${p.monthly}</strong></div>
    <div class="checkout-row"><span>Agents</span><strong>${p.agents}</strong></div>
    <div class="checkout-row checkout-row-sm"><span>Selected agents</span><span>${agents}</span></div>
    <div class="checkout-row checkout-row-sm"><span>Selected tools</span><span>${conns}</span></div>
    <div class="checkout-row checkout-row-sm"><span>Contact</span><span>${name} · ${email}</span></div>
    <div class="checkout-row checkout-row-sm"><span>Company</span><span>${company}</span></div>
  `;

  // Build Stripe URL with pre-filled email for smoother checkout
  let stripeUrl = p.stripe;
  if (email) stripeUrl += `?prefilled_email=${encodeURIComponent(email)}`;
  document.getElementById('stripe-pay-btn').href = stripeUrl;
}

window.toggleAgent = function(el) { el.classList.toggle('selected'); };
window.toggleConn  = function(el) { el.classList.toggle('selected'); };
