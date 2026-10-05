// Shared parts for RedoxClear: the table of standard electrode potentials, the sums that follow from
// it (which metal pushes which out, cell voltages, the Nernst equation, Faraday's laws), number
// formatting, chart boards, particles, beakers and layout helpers.
// +x right, +y up, +z towards the viewer.
import { THREE, M, box, clamp, lerp, canvasTexture } from './kit.js';

// ---------------------------------------------------------------- constants
export const FARADAY = 96485.33212;        // C/mol: charge of one mole of electrons (exact since the 2019 SI: e × N_A)
export const RGAS = 8.314462618;           // J/(mol K)
export const T25 = 298.15;                 // K: standard electrode potentials are quoted at 25 °C
export const NERNST = (RGAS * T25 * Math.LN10) / FARADAY;   // 0.05916 V per tenfold change, for one electron
export const VMOLAR = (RGAS * T25) / 101325 * 1000;         // 24.47 L: one mole of gas at 25 °C and 1 atm
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- standard electrode potentials
// E° in volts against the standard hydrogen electrode, at 25 °C, 1 mol/L and 1 atm, written as
// reductions (ion + electrons → metal). Source: P. Vanýsek, "Electrochemical Series", CRC Handbook of
// Chemistry and Physics (the table reproduced on Wikipedia's "Standard electrode potential (data
// page)"). Other tables differ in the second or third decimal: Cu²⁺/Cu is printed as +0.337 or +0.34,
// Fe²⁺/Fe as −0.44, Au³⁺/Au as +1.50 or +1.52. The order never changes.
// M: molar mass, g/mol. rho: density of the metal, g/cm³. tint: colour of the ion in water.
export const COUPLES = [
  { id: 'li', name: 'lithium', sym: 'Li', ion: 'Li⁺', z: 1, E: -3.0401, M: 6.94, rho: 0.534, metal: 0xc9ccd2, tint: null, water: true },
  { id: 'k', name: 'potassium', sym: 'K', ion: 'K⁺', z: 1, E: -2.931, M: 39.098, rho: 0.862, metal: 0xc4c9d0, tint: null, water: true },
  { id: 'ca', name: 'calcium', sym: 'Ca', ion: 'Ca²⁺', z: 2, E: -2.868, M: 40.078, rho: 1.55, metal: 0xcfd0cb, tint: null, water: true },
  { id: 'na', name: 'sodium', sym: 'Na', ion: 'Na⁺', z: 1, E: -2.71, M: 22.99, rho: 0.968, metal: 0xd0d3d8, tint: null, water: true },
  { id: 'mg', name: 'magnesium', sym: 'Mg', ion: 'Mg²⁺', z: 2, E: -2.372, M: 24.305, rho: 1.738, metal: 0xd4d8dc, tint: null, salt: 'magnesium sulphate' },
  { id: 'al', name: 'aluminium', sym: 'Al', ion: 'Al³⁺', z: 3, E: -1.662, M: 26.982, rho: 2.70, metal: 0xcdd3da, tint: null, salt: 'aluminium sulphate' },
  { id: 'zn', name: 'zinc', sym: 'Zn', ion: 'Zn²⁺', z: 2, E: -0.7618, M: 65.38, rho: 7.14, metal: 0xaab4c0, tint: null, salt: 'zinc sulphate' },
  { id: 'cr', name: 'chromium', sym: 'Cr', ion: 'Cr³⁺', z: 3, E: -0.744, M: 51.996, rho: 7.19, metal: 0xc6ccd4, tint: 0x4f7a6a, list: true },
  { id: 'fe', name: 'iron', sym: 'Fe', ion: 'Fe²⁺', z: 2, E: -0.447, M: 55.845, rho: 7.874, metal: 0x7d8187, tint: 0xa9d6a0, salt: 'iron(II) sulphate' },
  { id: 'ni', name: 'nickel', sym: 'Ni', ion: 'Ni²⁺', z: 2, E: -0.257, M: 58.693, rho: 8.908, metal: 0xb5b3a6, tint: 0x4fbf7a, salt: 'nickel sulphate' },
  { id: 'sn', name: 'tin', sym: 'Sn', ion: 'Sn²⁺', z: 2, E: -0.1375, M: 118.71, rho: 7.29, metal: 0xc9cbc8, tint: null, salt: 'tin(II) chloride' },
  { id: 'pb', name: 'lead', sym: 'Pb', ion: 'Pb²⁺', z: 2, E: -0.1262, M: 207.2, rho: 11.34, metal: 0x6f7480, tint: null, salt: 'lead nitrate' },
  { id: 'h', name: 'hydrogen', sym: 'H₂', ion: 'H⁺', z: 2, E: 0, M: 2.016, rho: 0, metal: 0xffffff, tint: null, salt: 'dilute acid', gas: true },
  { id: 'cu', name: 'copper', sym: 'Cu', ion: 'Cu²⁺', z: 2, E: 0.3419, M: 63.546, rho: 8.96, metal: 0xc87533, tint: 0x2f8fe0, salt: 'copper sulphate' },
  { id: 'ag', name: 'silver', sym: 'Ag', ion: 'Ag⁺', z: 1, E: 0.7996, M: 107.868, rho: 10.49, metal: 0xe3e6ea, tint: null, salt: 'silver nitrate' },
  { id: 'au', name: 'gold', sym: 'Au', ion: 'Au³⁺', z: 3, E: 1.498, M: 196.967, rho: 19.3, metal: 0xe6b422, tint: 0xe8d36a, salt: 'gold chloride' },
];
// Other half-reactions used in the box (same source).
export const E_O2_OH = 0.401;      // O₂ + 2 H₂O + 4 e⁻ → 4 OH⁻   (neutral or alkaline water: the cathode of rusting)
export const E_O2_H = 1.229;       // O₂ + 4 H⁺ + 4 e⁻ → 2 H₂O    (the least voltage that can split water)
export const E_CL2 = 1.35827;      // Cl₂ + 2 e⁻ → 2 Cl⁻
export const E_PBO2 = 1.6913;      // PbO₂ + SO₄²⁻ + 4 H⁺ + 2 e⁻ → PbSO₄ + 2 H₂O
export const E_PBSO4 = -0.3588;    // PbSO₄ + 2 e⁻ → Pb + SO₄²⁻
export const couple = (id) => COUPLES.find((c) => c.id === id);
export const STRIPS = ['mg', 'al', 'zn', 'fe', 'ni', 'sn', 'pb', 'cu', 'ag', 'au'];           // metals you can safely dip in water
export const SOLUTIONS = ['mg', 'al', 'zn', 'fe', 'ni', 'pb', 'h', 'cu', 'ag', 'au'];          // salts in the bottle rack
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const n1 = (n) => (n === 1 ? '' : n + ' ');

// A strip of metal `mid` dipped in a solution holding the ions of `sid`.
// It reacts only if the ion's couple sits higher (more positive E°) than the metal's: then the metal
// atoms are oxidised and the ions reduced. n electrons change hands in the balanced equation, and the
// same n are lost and gained. ΔG° = −n F E°.
export function displace(mid, sid) {
  const a = couple(mid), b = couple(sid);
  const E = b.E - a.E, n = (a.z * b.z) / gcd(a.z, b.z), ka = n / a.z, kb = n / b.z;
  const goes = mid !== sid && E > 0;
  const left = b.gas ? `${n1(ka)}${a.sym} + ${n1(kb * 2)}H⁺` : `${n1(ka)}${a.sym} + ${n1(kb)}${b.ion}`;
  const right = b.gas ? `${n1(ka)}${a.ion} + ${n1(kb)}H₂` : `${n1(ka)}${a.ion} + ${n1(kb)}${b.sym}`;
  return { a, b, E, n, ka, kb, goes, same: mid === sid, eq: `${left} → ${right}`, left, right, dG: (-n * FARADAY * E) / 1000,
    ox: `${a.sym} → ${a.ion} + ${a.z} e⁻`, red: b.gas ? '2 H⁺ + 2 e⁻ → H₂' : `${b.ion} + ${b.z} e⁻ → ${b.sym}` };
}
// One half-cell: a metal in a solution of its own ions at `conc` mol/L. Nernst: each tenfold
// dilution lowers the potential by 0.0592 V ÷ z.
export const halfE = (c, conc = 1) => c.E + (NERNST / c.z) * Math.log10(conc);
// Two half-cells joined by a wire and a salt bridge. The lower potential is the anode (oxidation,
// the − terminal): electrons leave it through the wire for the cathode.
export function cell(idL, idR, cL = 1, cR = 1) {
  const L = couple(idL), Rr = couple(idR), eL = halfE(L, cL), eR = halfE(Rr, cR);
  const leftIsAnode = eL < eR || (eL === eR && true);
  const an = leftIsAnode ? L : Rr, ca = leftIsAnode ? Rr : L;
  const n = (an.z * ca.z) / gcd(an.z, ca.z), ka = n / an.z, kc = n / ca.z;
  return { L, R: Rr, eL, eR, an, ca, leftIsAnode, E: Math.abs(eR - eL), E0: ca.E - an.E, n, ka, kc, dead: Math.abs(eR - eL) < 5e-4,
    eq: `${n1(ka)}${an.sym} + ${n1(kc)}${ca.ion} → ${n1(ka)}${an.ion} + ${n1(kc)}${ca.sym}`, dG: (-n * FARADAY * Math.abs(eR - eL)) / 1000 };
}
// Faraday's laws: grams made or dissolved by a charge of q coulombs. M g/mol, z electrons per atom.
export const faradayMass = (q, Mm, z) => (q * Mm) / (z * FARADAY);

// ---------------------------------------------------------------- formatting
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const fmt0 = (v) => Math.round(v).toLocaleString('en-IN');
export function sci(v, d = 2) {
  if (v === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
  if (+m.toFixed(d) >= 10) { m /= 10; e += 1; }
  return `${m.toFixed(d)} × 10${String(e).split('').map((c) => SUP[c]).join('')}`;
}
export const num = (v, sig = 3) => { const a = Math.abs(v); if (a === 0) return '0'; if (a >= 1e6 || a < 1e-3) return sci(v, 2).replace('-', '−'); return (a >= 1000 ? fmt0(v) : String(+v.toPrecision(sig))).replace('-', '−'); };
export const volts = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + ' V';
// A voltage inside a subtraction: negative values go in brackets, as in 0.34 − (−0.76).
export const par = (v, d = 2) => (v < 0 ? `(−${Math.abs(v).toFixed(d)})` : v.toFixed(d));
export const uv = (v, d = 2) => Math.abs(v).toFixed(d) + ' V';
export function mass(g) {
  const a = Math.abs(g);
  if (a >= 1e6) return num(g / 1e6) + ' t';
  if (a >= 1000) return num(g / 1000) + ' kg';
  if (a >= 1) return num(g) + ' g';
  if (a >= 1e-3) return num(g * 1e3) + ' mg';
  return num(g * 1e6) + ' µg';
}
export function dur(s) {
  if (s < 90) return `${+s.toPrecision(2)} s`;
  if (s < 5400) return `${+(s / 60).toPrecision(2)} min`;
  if (s < 86400 * 2) return `${+(s / 3600).toPrecision(2)} h`;
  return `${+(s / 86400).toPrecision(2)} days`;
}
export function amps(i) { return i >= 1000 ? `${num(i / 1000)} kA` : i >= 1 ? `${num(i)} A` : `${num(i * 1000)} mA`; }
export const hexCss = (h) => '#' + h.toString(16).padStart(6, '0');

// ---------------------------------------------------------------- boards (live charts in 3D)
export const COL = { e: '#8ef0ff', ox: '#ff9a6b', red: '#7fb2ff', ok: '#5ce1a9', bad: '#ff6b8a', hot: '#ffb547', volt: '#c49bff', text: '#e8eef8', soft: 'rgba(255,255,255,.62)', dim: 'rgba(255,255,255,.4)' };
export const HEX = { e: 0x8ef0ff, ox: 0xff9a6b, red: 0x7fb2ff, ok: 0x5ce1a9, bad: 0xff6b8a, hot: 0xffb547, volt: 0xc49bff, so4: 0xe6d36a, k: 0xc49bff, oh: 0xb48cff, o2: 0xff5a5a, rust: 0x9c4a1f, water: 0x6fb6e8 };
export function panelBg(g, w, h) { g.fillStyle = '#0b0d13'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
// Boards are 640 px wide and shown small beside the model, so their type is large.
export function title(g, s, sub = '') {
  g.textAlign = 'left'; g.fillStyle = COL.text; g.font = 'bold 30px sans-serif'; g.fillText(s, 20, 40);
  if (sub) { const x = 34 + g.measureText(s).width; g.font = '21px sans-serif'; g.fillStyle = COL.soft; g.fillText(sub, x, 40); }
}
export function text(g, s, x, y, col = COL.text, font = '22px sans-serif', align = 'left') { g.fillStyle = col; g.font = font; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left'; }
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function axes(g, w, h, { x0 = 92, x1 = w - 26, y0 = h - 70, y1 = 96, xMax, yMax, xMin = 0, yMin = 0, xTicks = [], yTicks = [], xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0), Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = COL.soft; g.font = '21px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 28); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 7); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '20px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 56);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function line(g, pts, X, Y, col, wdt = 4, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function bar(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }

// ---------------------------------------------------------------- 3D pieces
// n glowing spheres placed each frame with place(i, x, y, z, s); tint(i, hex) colours one.
export function dots(n, r, color = 0xffffff, seg = 12, lit = false) {
  const mat = lit ? new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 }) : new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(5, seg - 4)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), c = new THREE.Color();
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.hide = (i) => mesh.place(i, 0, -80, 0, 0.0001);
  mesh.tint = (i, hex) => { mesh.setColorAt(i, c.setHex(hex)); };
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  for (let i = 0; i < n; i++) { mesh.hide(i); mesh.tint(i, 0xffffff); }
  return mesh;
}
// Words drawn on a small flat card that always faces the camera (labels are hidden in the video,
// these are not). set(text) redraws it.
export function tag(str, h = 0.34, color = '#e8eef8', bg = 'rgba(7,8,12,.78)') {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false }));
  sp.renderOrder = 20;
  let last = null;
  sp.set = (s, col = color) => {
    if (s === last) return; last = s;
    g.font = 'bold 44px sans-serif'; const w = Math.ceil(g.measureText(s).width) + 40;
    c.width = w; c.height = 64;
    g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, 64, 20); g.fill();
    g.font = 'bold 44px sans-serif'; g.fillStyle = col; g.textBaseline = 'middle'; g.fillText(s, 20, 34);
    tex.dispose(); tex.needsUpdate = true;
    sp.scale.set((h * w) / 64, h, 1);
  };
  sp.set(str);
  return sp;
}
// n small flat signs ('2+', 'e⁻') sharing one texture, each facing the camera: place(i, x, y, z), hide(i).
export function signs(n, txt, size = 0.2, color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 128; c.height = 96;
  const g = c.getContext('2d'); g.fillStyle = color; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false });
  const grp = new THREE.Group();
  const list = Array.from({ length: n }, () => { const s = new THREE.Sprite(mat); s.scale.set(size * 1.33, size, 1); s.renderOrder = 15; s.visible = false; grp.add(s); return s; });
  grp.place = (i, x, y, z) => { const s = list[i]; s.visible = true; s.position.set(x, y, z); };
  grp.hide = (i) => { list[i].visible = false; };
  return grp;
}
// A glass beaker holding a liquid. setTint(hex, opacity) colours the liquid.
export function beaker(r = 1, h = 2, level = 0.8) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), M.clear(0xdcefff, 0.16)); wall.position.y = h / 2; g.add(wall);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 48), M.clear(0xdcefff, 0.3)); base.position.y = 0.025; g.add(base);
  const lm = new THREE.MeshStandardMaterial({ color: 0x8fc7ee, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.97, h * level, 48), lm); liq.position.y = (h * level) / 2 + 0.05; liq.renderOrder = 2; g.add(liq);
  const c = new THREE.Color();
  g.setTint = (hex, op = 0.4) => { lm.color.copy(c.setHex(hex)); lm.opacity = op; };
  g.liquid = liq; g.top = h * level + 0.05;
  return g;
}
// A small screen with text drawn on a canvas (a voltmeter). set(big line, small line).
export function makeDisplay(w = 1.4, h = 0.8, color = '#8ef0ff') {
  const g = new THREE.Group();
  g.add(box(w, h, 0.16, M.plastic(0x1f232b, { roughness: 0.5 })));
  let a = '', b = '';
  const face = canvasTexture(320, 190, (c, W, Hh) => {
    c.fillStyle = '#0b0f14'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = color; c.font = 'bold 64px monospace'; c.fillText(a, (W - c.measureText(a).width) / 2, 100);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '28px sans-serif'; c.fillText(b, (W - c.measureText(b).width) / 2, 156);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.84), new THREE.MeshBasicMaterial({ map: face.tex, toneMapped: false }));
  m.position.z = 0.081; g.add(m);
  let last = '';
  g.set = (x, y = '') => { const k = x + '|' + y; if (k === last) return; last = k; a = x; b = y; face.redraw(); };
  return g;
}
// A thin wire through points, and a sampler that walks along the same points: at(t), t from 0 to 1.
export function wire(points, r, mat) {
  const g = new THREE.Group(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 1; i < points.length; i++) {
    const a = new THREE.Vector3(...points[i - 1]), b = new THREE.Vector3(...points[i]), len = a.distanceTo(b);
    if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize()); g.add(m);
    const j = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); j.position.copy(b); g.add(j);
  }
  return g;
}
export function makePath(pts) {
  const seg = []; let len = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); seg.push(d); len += d; }
  return { len, at(t) {
    let d = clamp(t, 0, 1) * len;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? clamp(d / seg[i], 0, 1) : 0, a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; } d -= seg[i]; }
    return pts[pts.length - 1];
  } };
}

// ---------------------------------------------------------------- layout
export const inReel = () => document.body.classList.contains('gb-reel');
export const isPhone = () => !inReel() && window.innerWidth < 560;
// The readout sits at the upper left of the stage and the stage changes shape with the window: nearly
// square on a laptop, wide on a big monitor, tall on a phone. Every scene is laid out in the same
// box: the model within x −3.2…2.6 and y 0.3…4.4, the board to its right. autoView() frames that box
// for the current stage shape: on a squarish stage it looks higher, which drops the model below the
// readout; on a phone it centres the model and leaves room for the board underneath.
const stageEl = () => document.getElementById('stage');
export const aspect = () => { const e = stageEl(); return e && e.clientHeight ? e.clientWidth / e.clientHeight : 1.3; };
export function autoView({ x = 1.4, d = 9.0, lo = 2.8, hi = 3.4, px = -0.24, py = 3.4, pd = 7.0 } = {}) {
  if (isPhone()) return { pos: [px, py + 0.3, pd], target: [px, py, 0] };
  const cy = lerp(lo, hi, clamp((1.45 - aspect()) / 0.4, 0, 1));
  return { pos: [x, cy + 0.3, d], target: [x, cy, 0] };
}
// On a phone-width stage: hide the minor labels.
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560 && !inReel();
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  if (stage.shift && (stage.shift[0] || stage.shift[1])) stage.setShift(0, 0);
  return narrow;
}
// Boards sit beside the model on a wide screen, above it in the tall video, and under it on a phone
// (where the readout fills the top of the stage). Each placement is [position, rotationY, scale].
export const REEL_VIEW = { pos: [0, 5.3, 7.4], target: [0, 5.0, 0] };
export const WIDE_BOARD = [[4.42, 2.8, 0], -0.25, 1.0];
const PHONE = [[-0.24, -0.52, 0.3], 0, 0.68], REEL = [[0, 8.7, 0], 0, 2];
export function placeBoard(b, wide = WIDE_BOARD, reel = REEL, phone = PHONE) {
  const [p, r = 0, s = 1] = inReel() ? reel : isPhone() ? phone : wide;
  b.mesh.position.set(...p); b.mesh.rotation.set(0, r, 0); b.mesh.scale.setScalar(s);
}
// In the tall video the model is centred, enlarged and lifted to fill the frame under the board.
export function placeModel(G, { rx = 0.3, ry = 0.5, rs = 1.25, wx = 0, wy = 0, ws = 1, px = 0, py = 0.3, ps = 0.8 } = {}) {
  if (inReel()) { G.position.set(rx * rs, ry, 0); G.scale.setScalar(rs); }
  else if (isPhone()) { G.position.set(px, py, 0); G.scale.setScalar(ps); }
  else { G.position.set(wx, wy, 0); G.scale.setScalar(ws); }
}
// The readout must stay short where the stage is small. Rows marked "row x" are dropped on a
// squarish stage; on a phone the small print goes too.
export function fit(html) {
  if (isPhone()) return html.replace(/<div class="row x">[\s\S]*?<\/div>\s*/g, '').replace(/<small>[\s\S]*?<\/small>/g, '');
  const e = stageEl();
  if (e && (e.clientWidth < 900 || e.clientHeight < 620)) return html.replace(/<div class="row x">[\s\S]*?<\/div>\s*/g, '');
  return html;
}
// Show one scene group of a chapter and fly the camera to it (not in the video, which sets its own views).
export function focusSwitch(stage, groups, view = autoView) {
  let cur = '';
  return (id) => {
    if (id === cur) return false;
    cur = id;
    Object.entries(groups).forEach(([k, g]) => { g.visible = k === id; });
    if (!inReel()) { const v = typeof view === 'function' ? view(id) : view[id]; stage.setView(v.pos, v.target, 1.0); }
    return true;
  };
}
// Hide a label together with its group (CSS2D labels do not follow a parent's visibility).
export function showLabels(list, on) { list.forEach((l) => { if (l) l.visible = on; }); }
// Deterministic pseudo-random numbers so every run (and every video frame) looks the same.
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export { clamp, THREE, M, box };
