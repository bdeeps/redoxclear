// Chapter 5: redox driven backwards, redox without metals, where the simple picture bends, and myths.
// "electro": electrolysis. A power supply forces electrons the way they would not go by themselves.
//   Faraday's laws (1833–34): mass = Q × M ÷ (z × F), with Q = I × t and F = 96,485 C/mol.
//   Copper plating: Cu → Cu²⁺ + 2 e⁻ at the copper anode, Cu²⁺ + 2 e⁻ → Cu on the object (cathode):
//     the anode loses exactly what the object gains. Thickness for an object of 20 cm² surface (a key
//     or a small spoon bowl; an assumed area), copper 8.96 g/cm³.
//   Water: cathode 4 H₂O + 4 e⁻ → 2 H₂ + 4 OH⁻, anode 2 H₂O → O₂ + 4 H⁺ + 4 e⁻. Two volumes of hydrogen
//     to one of oxygen, 24.47 L per mole at 25 °C and 1 atm. Least voltage 1.229 V (E° of O₂/H₂O);
//     heat-neutral 1.48 V; working cells run at about 1.8 to 2.0 V, which is 50 to 55 kWh per kg of
//     hydrogen (energy per kg = V × 2F ÷ M: 39.4 kWh at 1.48 V, 53 kWh at 2.0 V).
//   Aluminium (Hall–Héroult, 1886): Al³⁺ + 3 e⁻ → Al in molten cryolite at about 960 °C, on carbon
//     anodes that burn away: 2 Al₂O₃ + 3 C → 4 Al + 3 CO₂ (1.22 kg CO₂ per kg Al from the anodes alone).
//     Pots carry 100 to 300 kA at under 5 V. Here: 4.5 V and 94% current efficiency (assumed, typical),
//     which gives 14.3 kWh per kg; real smelters use about 13 to 15.5.
//   The drawing uses the same two-plate tank for all three; a real smelting pot has its anodes above
//   and the aluminium pooling on the floor.
// "ledger": oxidation numbers, the bookkeeping that extends redox to reactions where no electron
//   moves all the way: burning, breathing, rusting, bleaching, a browning apple, and sodium with
//   chlorine (no oxygen at all). In each, (atoms × rise in oxidation number) on one side equals
//   (atoms × fall) on the other. Apple browning: the enzyme polyphenol oxidase lets oxygen turn
//   phenols (drawn as a catechol) into quinones, which join into brown pigments.
// Limits stated in the text: E° gives direction, not speed (aluminium, E° −1.66 V, is sealed by an
// oxide skin a few nanometres thick); real electrolysis needs more than the table voltage; oxidation
// numbers are bookkeeping, not real charges, in covalent molecules.
import { THREE, M, box, clamp, lerp, smooth } from '../kit.js';
import { FARADAY, VMOLAR, E_O2_H, faradayMass, COL, HEX, board, panelBg, title, text, dots, signs, tag, wire, makePath, num, mass, dur, amps,
  focusSwitch, showLabels, fitNarrow, placeBoard, placeModel, autoView, fit, inReel, rng, REEL_VIEW } from '../redox.js';

const AREA = 20, RHO_CU = 8.96, V_WATER = 2.0, V_AL = 4.5, CE_AL = 0.94;
const kWhPerKgH2 = (V) => (V * 2 * FARADAY) / 2.016 / 3600;
const KWH_AL = (V_AL * 3 * FARADAY) / 26.982 / 3600 / CE_AL;
export function electro(s) {
  const Q = s.amps * s.secs, molE = Q / FARADAY;
  const cu = faradayMass(Q, 63.546, 2), um = (cu / RHO_CU / AREA) * 1e4;
  const h2 = molE / 2, o2 = molE / 4, al = faradayMass(Q, 26.982, 3) * CE_AL;
  return { Q, molE, cu, um, h2, o2, vH2: h2 * VMOLAR, vO2: o2 * VMOLAR, mH2: h2 * 2.016, al, co2: (al * 3 * 44.01) / (4 * 26.982), eWater: (Q * V_WATER) / 3.6e6, eAl: (Q * V_AL) / 3.6e6 };
}
const JOBS = {
  plate: { name: 'Copper plating', cat: 'Cu²⁺ + 2 e⁻ → Cu', an: 'Cu → Cu²⁺ + 2 e⁻', liquid: 0x2f8fe0, op: 0.5, cathode: 0x9aa3ad, anode: 0xc87533, lc: 'object to plate (−)', la: 'copper bar (+)' },
  water: { name: 'Splitting water', cat: '4 H₂O + 4 e⁻ → 2 H₂ + 4 OH⁻', an: '2 H₂O → O₂ + 4 H⁺ + 4 e⁻', liquid: 0xa9cfe8, op: 0.25, cathode: 0x8a9099, anode: 0x8a9099, lc: 'cathode (−): hydrogen', la: 'anode (+): oxygen' },
  al: { name: 'Smelting aluminium', cat: 'Al³⁺ + 3 e⁻ → Al', an: 'C + 2 O²⁻ → CO₂ + 4 e⁻', liquid: 0xff8a3a, op: 0.55, cathode: 0x4a4d52, anode: 0x1e1f22, lc: 'cathode (−): aluminium', la: 'carbon anode (+): burns to CO₂' },
};
const RX = {
  burn: { name: 'Burning gas', eq: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O', lo: ['C', -4, 4, 1, 'in methane'], ga: ['O', 0, -2, 4, 'in oxygen gas'], cl: 0x3a3d44, cg: 0xff5a5a, note: 'Every flame is a redox reaction: the fuel is oxidised, the oxygen is reduced. See CombustionClear.' },
  breathe: { name: 'Breathing', eq: 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O', lo: ['C', 0, 4, 6, 'in glucose'], ga: ['O', 0, -2, 12, 'in oxygen gas'], cl: 0x3a3d44, cg: 0xff5a5a, note: 'Your cells do in small, cool steps what a flame does at once: glucose is oxidised by the oxygen you breathe in. See RespirationClear.' },
  salt: { name: 'Sodium + chlorine', eq: '2 Na + Cl₂ → 2 NaCl', lo: ['Na', 0, 1, 2, 'sodium metal'], ga: ['Cl', 0, -1, 2, 'in chlorine gas'], cl: 0xd0d3d8, cg: 0x9be36a, note: 'No oxygen anywhere, and still an oxidation: sodium loses electrons to chlorine. The product is table salt.' },
  rust: { name: 'Rusting', eq: '4 Fe + 3 O₂ → 2 Fe₂O₃', lo: ['Fe', 0, 3, 4, 'iron metal'], ga: ['O', 0, -2, 6, 'in oxygen gas'], cl: 0x7d8187, cg: 0xff5a5a, note: 'The overall result of the slow cell in chapter 4, written without the water.' },
  bleach: { name: 'Bleach on a stain', eq: 'OCl⁻ + H₂O + 2 e⁻ → Cl⁻ + 2 OH⁻', lo: ['dye', 0, 2, 1, 'the coloured molecule (its net change)'], ga: ['Cl', 1, -1, 1, 'in hypochlorite, OCl⁻'], cl: 0xb04a8a, cg: 0x9be36a, note: 'Bleach is an oxidising agent: it pulls electrons out of coloured molecules, and the broken molecules no longer absorb light. Never mix bleach with acids or other cleaners.' },
  apple: { name: 'A cut apple', eq: '2 phenol(OH)₂ + O₂ → 2 quinone + 2 H₂O', lo: ['C', 1, 2, 4, 'ring carbons of two phenols'], ga: ['O', 0, -2, 2, 'in oxygen gas'], cl: 0xd9c58a, cg: 0xff5a5a, note: 'Cutting lets an enzyme and air reach the apple’s phenols. They are oxidised to quinones, which link into brown pigments. Lemon juice slows it: vitamin C is oxidised first.' },
};
const on = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');
const eCount = (r) => Math.abs(r.lo[2] - r.lo[1]) * r.lo[3];

export default {
  id: 'limits',
  short: 'Backwards, and beyond',
  title: 'Backwards, beyond, and myths',
  subtitle: 'Electrolysis forces redox uphill. Flames, breath and bleach are redox too.',
  get view() { return autoView(); },
  learn: `<p><b>Driven backwards.</b> A cell lets electrons fall down the ladder and gives out energy. Push them back up with a power supply and you get <b>electrolysis</b>: the reaction runs in reverse and soaks up energy. That is how a key is <b>electroplated</b> with copper or chrome, how <b>aluminium</b> is won from its ore, and how water is split into <b>hydrogen</b> and oxygen. Charging a battery is the same idea.</p>
    <p>Michael Faraday found the rule in 1833: the amount of substance made depends only on the <b>charge</b> that passes. Each copper ion needs two electrons, each aluminium ion three. Count the electrons and you know the grams: <b>mass = charge × molar mass ÷ (electrons per ion × F)</b>.</p>
    <p><b>Beyond metals.</b> A flame, your breathing, a browning apple and bleach are all redox. Here electrons are not handed over completely. They are shared unequally in bonds. Chemists keep count with <b>oxidation numbers</b>: pretend every shared electron belongs to the atom that pulls harder. When methane burns, carbon goes from −4 to +4 and four oxygen atoms go from 0 to −2. Eight lost, eight gained. This is bookkeeping, not real charge: the carbon in CO₂ does not carry a charge of +4.</p>
    <p><b>Where the ladder misleads.</b> E° tells you <b>which way</b> a reaction goes, never <b>how fast</b>. Aluminium is far above iron, so it should corrode faster. It does not, because a skin of aluminium oxide a few millionths of a millimetre thick seals it within moments. And real electrolysis always costs more than the table says: water needs at least 1.23 V on paper, but working cells run at about 2 V.</p>
    <p><b>Myth 1: oxidation needs oxygen.</b> The name comes from oxygen, but sodium burning in chlorine is an oxidation with no oxygen in sight. <b>Myth 2: a lemon battery runs on the lemon.</b> The energy comes from the zinc nail dissolving. The juice is the electrolyte: its acid takes the electrons at the copper and its ions carry the current. <b>Myth 3: stainless steel cannot rust.</b> Salt can break its skin and pit it.</p>
    <p class="tip"><b>Try it:</b> in <b>Electrolysis</b>, double the current and watch the mass double. Then open <b>The ledger</b> and check that the electrons lost and gained match for a burning flame and for a slice of apple.</p>`,
  terms: [
    { t: 'Electrolysis', d: 'Using an electric current to force a redox reaction that would not happen by itself.' },
    { t: 'Faraday constant (F)', d: '96,485 coulombs: the charge of one mole of electrons.' },
    { t: 'Electroplating', d: 'Coating an object with metal by making it the cathode in a solution of that metal’s ions.' },
    { t: 'Oxidation number', d: 'The charge an atom would have if every shared electron belonged to the atom that attracts it more. It rises in oxidation and falls in reduction.' },
    { t: 'Overvoltage', d: 'The extra voltage, above the table value, that a real electrolysis needs to run at a useful speed.' },
    { t: 'Bleach', d: 'An oxidising agent, often sodium hypochlorite, that removes colour by taking electrons from dye molecules.' },
  ],
  defaults: { focus: 'electro', job: 'plate', amps: 0.5, secs: 1200, rx: 'burn' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'electro', label: 'Electrolysis' }, { v: 'ledger', label: 'The ledger' }] },
    { key: 'job', type: 'seg', label: 'Electrolysis: job', options: Object.entries(JOBS).map(([v, j]) => ({ v, label: j.name })) },
    { key: 'amps', type: 'log', label: 'Electrolysis: current', min: 0.1, max: 300000, ends: ['0.1 A', '300,000 A'], fmt: (v) => amps(v) },
    { key: 'secs', type: 'log', label: 'Electrolysis: time', min: 60, max: 86400, ends: ['1 minute', '24 hours'], fmt: (v) => dur(v) },
    { key: 'pre', type: 'buttons', label: 'Real examples', items: [
      { label: 'Plate a key: 0.5 A, 20 min', act: (s) => Object.assign(s, { focus: 'electro', job: 'plate', amps: 0.5, secs: 1200 }) },
      { label: 'School water cell: 0.5 A, 10 min', act: (s) => Object.assign(s, { focus: 'electro', job: 'water', amps: 0.5, secs: 600 }) },
      { label: 'Smelter pot: 300 kA, a day', act: (s) => Object.assign(s, { focus: 'electro', job: 'al', amps: 300000, secs: 86400 }) },
      { label: 'Double the current', act: (s) => Object.assign(s, { focus: 'electro', amps: clamp(s.amps * 2, 0.1, 300000) }) },
    ] },
    { key: 'rx', type: 'seg', label: 'Ledger: reaction', options: Object.entries(RX).map(([v, r]) => ({ v, label: r.name })) },
  ],
  onChange(s, key) {
    if (['job', 'amps', 'secs'].includes(key)) s.focus = 'electro';
    if (key === 'rx') s.focus = 'ledger';
  },
  quiz: [
    { q: 'A plating bath runs at 1 A for 10 minutes and lays down 0.2 g of copper. What happens at 2 A for 10 minutes?', options: ['0.1 g', '0.2 g', '0.4 g', '0.8 g'], answer: 2, why: 'Faraday’s law: the mass depends only on the charge, current × time. Twice the current in the same time is twice the electrons, so twice the copper.' },
    { q: 'Sodium metal reacts with chlorine gas to make salt. Is the sodium oxidised?', options: ['No, there is no oxygen', 'Yes: each sodium atom loses an electron', 'Only if water is present', 'It is reduced'], answer: 1, why: 'Oxidation means losing electrons, whatever takes them. Sodium goes from 0 to +1 and chlorine from 0 to −1.' },
    { q: 'Aluminium is higher in the reactivity series than iron, yet an aluminium window frame outlasts a steel one. Why?', options: ['The series is wrong', 'Aluminium is heavier', 'A thin, tight oxide skin seals aluminium from air and water', 'Aluminium contains chromium'], answer: 2, why: 'The series says which way a reaction goes, not how fast. Aluminium oxidises at once, but the oxide layer is only nanometres thick and airtight, so the metal underneath is protected.' },
  ],
  reel: [
    { ms: 5200, caption: 'Push the electrons backwards with a power supply and copper plates onto a key. Double the charge, double the copper.', set: { focus: 'electro', job: 'plate', amps: 0.5 }, anim: { secs: [60, 7200, true] }, view: REEL_VIEW, spin: 0 },
    { ms: 4800, caption: 'A flame is redox too: carbon loses eight electrons and oxygen gains eight. No metal needed.', set: { focus: 'ledger', rx: 'burn' }, view: REEL_VIEW, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(53);
    // ================================================================ electrolysis
    const El = new THREE.Group(); root.add(El);
    const XC = -1.35, XA = 0.75, TY = 0.7;
    const tank = box(3.9, 2.1, 1.6, M.clear(0xdcefff, 0.14)); tank.position.set(-0.3, TY + 1.05, 0); tank.castShadow = false; El.add(tank);
    const liqMat = new THREE.MeshStandardMaterial({ color: 0x2f8fe0, transparent: true, opacity: 0.5, roughness: 0.15, depthWrite: false });
    const liq = box(3.8, 1.7, 1.5, liqMat); liq.position.set(-0.3, TY + 0.87, 0); liq.castShadow = false; liq.renderOrder = 2; El.add(liq);
    const catMat = M.metal(0x9aa3ad, { roughness: 0.4 }), anMat = M.metal(0xc87533, { roughness: 0.45 });
    const cat = box(0.5, 2.3, 0.9, catMat); cat.position.set(XC, TY + 1.45, 0); El.add(cat);
    const an = box(0.5, 2.3, 0.9, anMat); an.position.set(XA, TY + 1.45, 0); El.add(an);
    const depMat = new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.6, metalness: 0.6 });
    const dep = box(0.54, 1.45, 0.94, depMat); dep.position.set(XC, TY + 0.95, 0); dep.castShadow = false; El.add(dep);
    const pool = box(3.7, 0.2, 1.4, new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.25, metalness: 0.9 })); pool.position.set(-0.3, TY + 0.15, 0); pool.castShadow = false; El.add(pool);
    const tubes = [XC - 0.62, XA + 0.62].map((x) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.5, 24, 1, true), M.clear(0xffffff, 0.3)); t.position.set(x, TY + 2.25, 0.3); El.add(t); const gmat = M.ghost(0xffffff, 0.5); const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 1, 24), gmat); El.add(gas); return { t, gas, x }; });
    const supply = box(1.5, 0.75, 0.6, M.plastic(0x23272f)); supply.position.set(-0.3, 3.95, 0); El.add(supply);
    const WC = [[-0.9, 3.95, 0], [XC, 3.95, 0], [XC, TY + 2.6, 0]], WA = [[XA, TY + 2.6, 0], [XA, 3.95, 0], [0.3, 3.95, 0]];
    El.add(wire(WC, 0.03, M.metal(0xd08a4a)), wire(WA, 0.03, M.metal(0xd08a4a)));
    const pC = makePath(WC), pA = makePath(WA);
    const NE = 10, el = dots(NE, 0.075, HEX.e, 10), sE = signs(NE, 'e⁻', 0.22, COL.e), io = dots(10, 0.085, 0x2f8fe0, 10, true), bub = dots(36, 0.06, 0xffffff, 8); El.add(el, sE, io, bub);
    bub.material.transparent = true; bub.material.opacity = 0.8;
    const BB = Array.from({ length: 36 }, (_, i) => ({ side: i % 3 === 2 ? 1 : 0, ph: rnd(), dx: (rnd() - 0.5) * 0.5, dz: 0.5 + rnd() * 0.15, v: 0.6 + rnd() * 0.5 }));
    const tSup = tag('power supply', 0.26, '#cfd6e4'), tMinus = tag('−', 0.34, COL.e), tPlus = tag('+', 0.34, '#ff9a6b'), tC = tag('', 0.26, COL.red), tA = tag('', 0.26, COL.ox), tJob = tag('', 0.32, '#ffe08a'); El.add(tSup, tMinus, tPlus, tC, tA, tJob);
    tSup.position.set(-0.3, 3.95, 0.35); tMinus.position.set(-1.3, 4.28, 0.2); tPlus.position.set(0.7, 4.28, 0.2); tC.position.set(XC - 0.6, TY - 0.3, 0.9); tA.position.set(XA + 0.8, TY - 0.3, 0.9); tJob.position.set(-0.3, 4.75, 0); tJob.visible = false;
    const lIon = stage.label('', [-0.3, TY + 1.0, 0.9], El), lGas = stage.label('2 volumes of hydrogen to 1 of oxygen', [-0.3, TY + 2.45, 1.0], El);
    const elLabels = [lIon, lGas];
    let phase = 0;

    // ================================================================ the ledger
    const Lg = new THREE.Group(); root.add(Lg);
    const pedL = box(2.1, 0.5, 1.6, M.plastic(0x2a2e37)); pedL.position.set(-1.9, 1.0, 0); Lg.add(pedL);
    const pedR = box(2.1, 0.5, 1.6, M.plastic(0x2a2e37)); pedR.position.set(1.3, 1.0, 0); Lg.add(pedR);
    const lose = dots(6, 0.3, 0xffffff, 20, true), gain = dots(12, 0.24, 0xffffff, 20, true), le = dots(24, 0.07, HEX.e, 10); Lg.add(lose, gain, le);
    const tL = tag('', 0.3, COL.ox), tR = tag('', 0.3, COL.red), tL2 = tag('', 0.25, '#cfd6e4'), tR2 = tag('', 0.25, '#cfd6e4'), tEq = tag('', 0.32, '#ffe08a'), tN = tag('', 0.3, COL.e); Lg.add(tL, tR, tL2, tR2, tEq, tN);
    tL.position.set(-1.9, 3.3, 0.4); tL2.position.set(-1.9, 0.4, 0.9); tR.position.set(1.3, 3.3, 0.4); tR2.position.set(1.3, 0.4, 0.9); tEq.position.set(-0.3, 4.4, 0); tN.position.set(-0.3, 3.8, 0.4);
    const spot = (i, n, x0, r) => { const cols = Math.ceil(Math.sqrt(n)), row = Math.floor(i / cols), col = i % cols; return [x0 + (col - (cols - 1) / 2) * r * 2.15, 1.25 + r + row * r * 2.1, (row % 2) * 0.15]; };

    // ================================================================ board
    let S = null, bkey = '';
    const bd = board(root, 3.4, 2.38, 640, 448, (g, w, h) => {
      panelBg(g, w, h); if (!S) return;
      if (S.focus === 'ledger') {
        const r = RX[S.rx], n = eCount(r), [ls, l0, l1, ln, lw] = r.lo, [gs, g0, g1, gn, gw] = r.ga;
        title(g, 'Oxidation numbers');
        text(g, r.eq, 20, 92, '#ffe08a', 'bold 24px sans-serif');
        text(g, 'OXIDISED (number goes up)', 20, 150, COL.ox, 'bold 20px sans-serif');
        text(g, `${ln} × ${ls}:  ${on(l0)} → ${on(l1)}`, 20, 186, COL.text, 'bold 28px sans-serif'); text(g, `loses ${n} e⁻`, w - 20, 186, COL.ox, 'bold 26px sans-serif', 'right');
        text(g, lw, 20, 214, COL.dim, '19px sans-serif');
        text(g, 'REDUCED (number goes down)', 20, 270, COL.red, 'bold 20px sans-serif');
        text(g, `${gn} × ${gs}:  ${on(g0)} → ${on(g1)}`, 20, 306, COL.text, 'bold 28px sans-serif'); text(g, `gains ${Math.abs(g1 - g0) * gn} e⁻`, w - 20, 306, COL.red, 'bold 26px sans-serif', 'right');
        text(g, gw, 20, 334, COL.dim, '19px sans-serif');
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 360); g.lineTo(w - 20, 360); g.stroke();
        text(g, `${n} lost = ${Math.abs(g1 - g0) * gn} gained`, 20, 404, COL.ok, 'bold 30px sans-serif');
        return;
      }
      const R = electro(S), j = JOBS[S.job];
      title(g, 'Faraday’s law', 'count the electrons');
      text(g, `charge = ${amps(S.amps)} × ${dur(S.secs)}`, 20, 98, COL.soft, '22px sans-serif');
      text(g, `= ${num(R.Q)} C`, 20, 134, COL.text, 'bold 28px sans-serif');
      text(g, `÷ 96,485 C/mol = ${num(R.molE)} mol of electrons`, 20, 176, COL.e, '22px sans-serif');
      const z = S.job === 'al' ? 3 : 2;
      text(g, S.job === 'plate' ? '2 electrons per copper atom, 63.5 g/mol' : S.job === 'water' ? '2 electrons per H₂, 4 per O₂' : '3 electrons per aluminium atom, 27.0 g/mol', 20, 232, COL.soft, '22px sans-serif');
      const out = S.job === 'plate' ? `${mass(R.cu)} of copper` : S.job === 'water' ? `${num(R.vH2 >= 1 ? R.vH2 : R.vH2 * 1000)} ${R.vH2 >= 1 ? 'L' : 'mL'} H₂ + ${num(R.vO2 >= 1 ? R.vO2 : R.vO2 * 1000)} ${R.vO2 >= 1 ? 'L' : 'mL'} O₂` : `${mass(R.al)} of aluminium`;
      text(g, out, 20, 284, COL.hot, 'bold 34px sans-serif');
      text(g, 'mass = Q × M ÷ (z × F)', 20, 350, COL.text, '23px sans-serif');
      text(g, `cathode: ${j.cat}`, 20, 394, COL.red, '20px sans-serif'); text(g, `anode: ${j.an}`, 20, 424, COL.ox, '20px sans-serif');
      void z;
    }, [4.45, 2.7, 0]);

    const setFocus = focusSwitch(stage, { electro: El, ledger: Lg });
    const cA = new THREE.Color(), cB = new THREE.Color();
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const isE = s.focus !== 'ledger';
        setFocus(isE ? 'electro' : 'ledger');
        const narrow = fitNarrow(stage, []);
        showLabels(elLabels, isE && !narrow);
        placeBoard(bd);
        placeModel(El, { rx: 0.3, ry: 0.5, rs: 1.3 }); placeModel(Lg, { rx: 0.3, ry: 0.9, rs: 1.25 });

        if (isE) {
          const R = electro(s), j = JOBS[s.job], sp = 0.12 + 0.1 * Math.log10(s.amps / 0.1);
          phase += dt * sp;
          liqMat.color.setHex(j.liquid); liqMat.opacity = j.op; liqMat.emissive = liqMat.emissive || new THREE.Color(); liqMat.emissive.setHex(s.job === 'al' ? 0x7a2a00 : 0x000000);
          catMat.color.setHex(j.cathode); anMat.color.setHex(j.anode);
          const grow = s.job === 'plate' ? clamp(Math.log10(Math.max(R.um, 0.1) + 1) / 3, 0, 1) : 0;
          dep.visible = s.job === 'plate'; dep.scale.set(1 + grow * 0.7, 1, 1 + grow * 0.25);
          an.scale.x = s.job === 'water' ? 1 : 1 - (s.job === 'plate' ? grow * 0.45 : 0.3 * clamp(Math.log10(R.al + 1) / 6.5, 0, 1));
          pool.visible = s.job === 'al'; pool.scale.y = 0.4 + 2.2 * clamp(Math.log10(R.al + 1) / 6.5, 0, 1); pool.position.y = TY + 0.1 + 0.1 * pool.scale.y;
          // electrons: supply − → cathode, and anode → supply +
          for (let i = 0; i < NE; i++) {
            const u = (i / NE + phase) % 1, half = i % 2, p = (half ? pA : pC).at(u);
            el.place(i, p[0], p[1], p[2] + 0.06); if (i % 4 < 2 && p[1] < 3.85) sE.place(i, p[0] + (half ? 0.3 : -0.3), p[1], 0.1); else sE.hide(i);
          }
          el.done();
          // ions crossing the liquid (copper ions anode → cathode; in the other two, drawn as the positive ions drifting to the cathode)
          for (let i = 0; i < 10; i++) { const u = (i / 10 + phase * 0.8) % 1; io.place(i, lerp(XA - 0.3, XC + 0.3, u), TY + 0.45 + ((i * 0.37) % 1) * 1.1, 0.5 + 0.1 * Math.sin(i), 0.5 + 0.5 * Math.sin(Math.PI * u)); io.tint(i, s.job === 'plate' ? 0x2f8fe0 : s.job === 'water' ? 0xffe08a : 0xd4d8dc); }
          io.done();
          // bubbles: two at the cathode (hydrogen) for every one at the anode (oxygen); CO₂ at the carbon anode
          BB.forEach((b, i) => {
            const show = s.job === 'water' || (s.job === 'al' && b.side === 1);
            if (!show) return bub.hide(i);
            const u = (b.ph + time * b.v * 0.45) % 1, x = (b.side ? XA + 0.3 + Math.abs(b.dx) : XC - 0.3 - Math.abs(b.dx));
            bub.place(i, x, TY + 0.3 + u * 1.4, 0.3 + (b.dz - 0.57) * 2, 0.6 + 0.6 * u);
          });
          bub.done();
          const lvl = s.job === 'water' ? clamp(Math.log10(R.vH2 * 1000 + 1) / 4.5, 0.03, 1) : 0;
          tubes.forEach((t, i) => { t.t.visible = t.gas.visible = s.job === 'water'; const hgt = 1.4 * lvl * (i ? 0.5 : 1); t.gas.scale.y = Math.max(0.01, hgt); t.gas.position.set(t.x, TY + 3.0 - hgt / 2, 0.3); });
          tC.set(j.lc); tA.set(j.la); tJob.set(j.name); tJob.visible = inReel();
          lIon.element.textContent = s.job === 'plate' ? 'Cu²⁺ ions cross to the object' : s.job === 'water' ? 'H⁺ drifts to the cathode, OH⁻ to the anode' : 'molten cryolite with dissolved alumina, 960 °C';
          lGas.visible = lGas.visible && s.job === 'water';
        } else {
          const r = RX[s.rx], n = eCount(r), nl = r.lo[3], ng = r.ga[3], cyc = (time * 0.22) % 1, k = smooth(clamp(cyc / 0.7, 0, 1));
          cA.setHex(r.cl).lerp(cB.setHex(0xff9a6b), 0.55 * k);
          for (let i = 0; i < 6; i++) { if (i >= nl) { lose.hide(i); continue; } const p = spot(i, nl, -1.9, 0.3); lose.place(i, p[0], p[1], p[2], 1); lose.tint(i, cA.getHex()); }
          cA.setHex(r.cg).lerp(cB.setHex(0x7fb2ff), 0.55 * k);
          for (let i = 0; i < 12; i++) { if (i >= ng) { gain.hide(i); continue; } const p = spot(i, ng, 1.3, 0.24); gain.place(i, p[0], p[1], p[2], 1); gain.tint(i, cA.getHex()); }
          lose.done(); gain.done();
          for (let i = 0; i < 24; i++) {
            if (i >= n) { le.hide(i); continue; }
            const u = clamp((cyc - (i / n) * 0.4) / 0.3, 0, 1);
            if (u <= 0 || u >= 1) { le.hide(i); continue; }
            le.place(i, lerp(-1.5, 0.9, u), 2.2 + 0.7 * Math.sin(Math.PI * u) + (i % 4) * 0.08, 0.45);
          }
          le.done();
          tL.set(`${r.lo[3]} × ${r.lo[0]}: ${on(r.lo[1])} → ${on(r.lo[2])}`); tR.set(`${r.ga[3]} × ${r.ga[0]}: ${on(r.ga[1])} → ${on(r.ga[2])}`);
          tL2.set(`oxidised: loses ${n} e⁻`, COL.ox); tR2.set(`reduced: gains ${n} e⁻`, COL.red); tEq.set(r.eq); tN.set(`${n} electrons`);
        }
        const kk = isE ? `e|${s.job}|${s.amps.toPrecision(4)}|${s.secs.toPrecision(4)}` : `l|${s.rx}`;
        if (kk !== bkey) { bkey = kk; bd.redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'ledger') {
          const r = RX[s.rx], n = eCount(r);
          return fit(`<div class="big">${n} electrons lost = ${n} gained</div>
            <div class="row"><span>Reaction</span><b>${r.eq}</b></div>
            <div class="row"><span>Oxidised</span><b>${r.lo[3]} × ${r.lo[0]}, ${on(r.lo[1])} → ${on(r.lo[2])}</b></div>
            <div class="row"><span>Reduced</span><b>${r.ga[3]} × ${r.ga[0]}, ${on(r.ga[1])} → ${on(r.ga[2])}</b></div>
            <small>${r.note}</small>`);
        }
        const R = electro(s), j = JOBS[s.job];
        const head = `<div class="row"><span>Charge = current × time</span><b>${amps(s.amps)} × ${dur(s.secs)} = ${num(R.Q)} C</b></div>
          <div class="row x"><span>Electrons pushed round</span><b>${num(R.molE)} mol</b></div>`;
        if (s.job === 'plate') return fit(`<div class="big">${mass(R.cu)} of copper plated</div>${head}
          <div class="row"><span>Layer on a 20 cm² key</span><b>${num(R.um)} µm thick</b></div>
          <div class="row"><span>The copper bar loses</span><b>${mass(R.cu)}: the same</b></div>
          <div class="row x"><span>Cathode (the key)</span><b>${j.cat}</b></div>
          <div class="row x"><span>Anode (the bar)</span><b>${j.an}</b></div>
          <small>Every electron the supply pulls from the copper bar is pushed onto the key, so the solution stays as blue as it started.</small>`);
        if (s.job === 'water') return fit(`<div class="big">${num(R.vH2 >= 1 ? R.vH2 : R.vH2 * 1000)} ${R.vH2 >= 1 ? 'L' : 'mL'} of hydrogen</div>${head}
          <div class="row"><span>Oxygen at the other plate</span><b>${num(R.vO2 >= 1 ? R.vO2 : R.vO2 * 1000)} ${R.vO2 >= 1 ? 'L' : 'mL'}: half as much</b></div>
          <div class="row"><span>Voltage needed</span><b>${E_O2_H.toFixed(2)} V on paper, about ${V_WATER.toFixed(1)} V in practice</b></div>
          <div class="row x"><span>Energy used at ${V_WATER.toFixed(1)} V</span><b>${num(R.eWater * 1000)} Wh</b></div>
          <div class="row x"><span>Per kg of hydrogen at ${V_WATER.toFixed(1)} V</span><b>${num(kWhPerKgH2(V_WATER), 2)} kWh</b></div>
          <small>Four electrons make two H₂ at one plate while four leave to make one O₂ at the other: two volumes to one. Hydrogen and oxygen together are explosive, so school cells make only a test tube of each.</small>`);
        return fit(`<div class="big">${mass(R.al)} of aluminium</div>${head}
          <div class="row"><span>Energy at ${V_AL} V</span><b>${num(R.eAl)} kWh: ${KWH_AL.toFixed(1)} kWh per kg</b></div>
          <div class="row"><span>Carbon anodes burn to</span><b>${mass(R.co2)} of CO₂</b></div>
          <div class="row x"><span>Cathode</span><b>${j.cat}</b></div>
          <div class="row x"><span>Anode</span><b>${j.an}</b></div>
          <small>Aluminium sits so high on the ladder that no cheap chemical will reduce it: only electricity does. A real pot runs at 100 to 300 kA. Recycling a can needs about a twentieth of this energy.</small>`);
      },
    };
  },
};
