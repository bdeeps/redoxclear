// Chapter 3: split the reaction in two and you have a cell.
// "cell": two half-cells (a metal in a solution of its own ions), a salt bridge and a wire. Any two of
//   the ten metals can be picked. The voltage and the direction come from redox.js:
//     each half: E = E° + (0.0592 V ÷ z) × log₁₀[ion]   (the Nernst equation at 25 °C)
//     the lower half is the anode (−, oxidation); cell voltage = E(cathode) − E(anode).
//   Zinc and copper at 1 mol/L each is the Daniell cell of 1836: +0.34 − (−0.76) = 1.10 V.
//   For every n electrons that go round the wire, n ÷ z atoms dissolve at the anode, n ÷ z ions plate
//   out at the cathode, and n single charges cross the salt bridge (K⁺ towards the cathode side,
//   NO₃⁻ towards the anode side), so both beakers stay neutral.
//   The meter shows the open-circuit voltage. A real cell under load gives a little less (internal
//   resistance, see TorchClear), and metals such as aluminium and magnesium read lower than the table
//   because of oxide films and side reactions.
// "battery": three cells you own.
//   Lead–acid: Pb + SO₄²⁻ → PbSO₄ + 2 e⁻ (E° −0.3588 V) and PbO₂ + SO₄²⁻ + 4 H⁺ + 2 e⁻ → PbSO₄ + 2 H₂O
//     (E° +1.6913 V): 2.05 V a cell, six in series for a "12 V" battery (CRC Handbook values).
//   Alkaline: Zn + 2 OH⁻ → ZnO + H₂O + 2 e⁻ and 2 MnO₂ + H₂O + 2 e⁻ → Mn₂O₃ + 2 OH⁻; nominal 1.5 V
//     (IEC 60086 "LR" cells; a fresh one reads about 1.6 V).
//   Lithium-ion: LiC₆ → C₆ + Li⁺ + e⁻ and CoO₂ + Li⁺ + e⁻ → LiCoO₂; nominal 3.7 V for a cobalt-oxide
//     cell (typical maker's rating, 3.6 to 3.7 V; Goodenough's 1980 cathode gave about 4 V).
//   Charge carried per gram of the metal that is oxidised = z F ÷ M: lithium 3.86 Ah/g, zinc 0.82,
//   lead 0.26. One electron goes round the wire for every single charge that crosses inside.
import { THREE, M, box, tube, clamp, lerp } from '../kit.js';
import { COUPLES, couple, cell, halfE, STRIPS, NERNST, FARADAY, E_PBO2, E_PBSO4, COL, HEX, board, panelBg, title, text, dot, dots, signs, tag, beaker, makeDisplay, wire, makePath,
  uv, num, focusSwitch, showLabels, fitNarrow, placeBoard, placeModel, autoView, fit, rng, REEL_VIEW } from '../redox.js';
import { par } from '../redox.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const WATER = 0xa9cfe8;
const AHG = (c) => (c.z * FARADAY) / c.M / 3600;                       // amp-hours per gram of metal oxidised
const E_LEAD = E_PBO2 - E_PBSO4;
const BATT = {
  lead: { name: 'Lead–acid', V: E_LEAD, src: 'computed from E°', neg: 'Pb + SO₄²⁻ → PbSO₄ + 2 e⁻', pos: 'PbO₂ + SO₄²⁻ + 4 H⁺ + 2 e⁻ → PbSO₄ + 2 H₂O', ion: 'H⁺', dir: 1, re: true, pack: (v) => `6 cells in series: ${(6 * v).toFixed(1)} V`, where: 'inverters and car starters (see UPSClear)', ahg: (2 * FARADAY) / 207.2 / 3600, m: 'lead', cn: 0x6f7480, cp: 0x4a3328, ci: 0xffe08a, ln: 'lead', lp: 'lead dioxide', le: 'sulphuric acid' },
  alk: { name: 'Alkaline', V: 1.5, src: 'nominal', neg: 'Zn + 2 OH⁻ → ZnO + H₂O + 2 e⁻', pos: '2 MnO₂ + H₂O + 2 e⁻ → Mn₂O₃ + 2 OH⁻', ion: 'OH⁻', dir: -1, re: false, pack: (v) => `2 cells in a torch: ${(2 * v).toFixed(1)} V`, where: 'torches, remotes and clocks (see TorchClear)', ahg: AHG(couple('zn')), m: 'zinc', cn: 0xaab4c0, cp: 0x3a3536, ci: 0xb48cff, ln: 'zinc powder', lp: 'manganese dioxide', le: 'potassium hydroxide' },
  li: { name: 'Lithium-ion', V: 3.7, src: 'nominal', neg: 'LiC₆ → C₆ + Li⁺ + e⁻', pos: 'CoO₂ + Li⁺ + e⁻ → LiCoO₂', ion: 'Li⁺', dir: 1, re: true, pack: (v) => `1 cell in a phone: ${v.toFixed(1)} V`, where: 'phones, laptops and electric cars (see MobileClear)', ahg: AHG(couple('li')), m: 'lithium', cn: 0x33373f, cp: 0x3d4f8a, ci: 0xff9a6b, ln: 'graphite holding lithium', lp: 'cobalt oxide', le: 'lithium salt in solvent' },
};
const fc = (v) => (v >= 0.1 ? +v.toPrecision(2) : v >= 0.01 ? v.toFixed(3) : v.toFixed(4)) + ' mol/L';

export default {
  id: 'cell',
  short: 'Make a cell',
  title: 'Send the electrons round a wire',
  subtitle: 'Keep the two halves apart and the electrons must take the long way: a battery.',
  get view() { return autoView(); },
  learn: `<p>In the first chapter the zinc touched the copper ions, and the electrons hopped straight across. The energy came out as a little heat. Now keep the two halves <b>apart</b>: zinc in one beaker, copper and its ions in another, joined by a <b>wire</b>.</p>
    <p>Zinc atoms still want to hand over electrons, and copper ions still want them. But now the only route is <b>through the wire</b>. A stream of electrons in a wire is an electric current (see CurrentClear). You have built a <b>cell</b>. This one, zinc and copper, is the <b>Daniell cell</b> of 1836, and it gives <b>1.10 volts</b>.</p>
    <p>The electrode where <b>oxidation</b> happens is the <b>anode</b>: it is the negative terminal, and it slowly dissolves. The electrode where <b>reduction</b> happens is the <b>cathode</b>: positive, and it grows. The <b>salt bridge</b> lets ions drift between the beakers, so that neither side builds up charge. Take it out and the current stops at once.</p>
    <p>The voltage is just the gap between the two metals on the ladder: <b>E°cell = E°(cathode) − E°(anode)</b>. Pick metals far apart, such as magnesium and silver, and you get more than 3 V. Pick neighbours and you get almost nothing. Weak solutions shift each rung a little: that is the <b>Nernst equation</b>. Tin and lead are such close neighbours that weakening one solution can even swap which of them is the anode.</p>
    <p>Every battery you own works this way. A <b>lead–acid</b> cell gives 2.05 V, so an inverter battery strings six together (see UPSClear). An <b>alkaline</b> cell uses zinc and manganese dioxide for 1.5 V (see TorchClear). A <b>lithium-ion</b> cell gives about 3.7 V, because lithium sits at the very top of the ladder, and lithium is so light that each gram carries far more charge. Recharging simply pushes the electrons back the other way.</p>
    <p class="tip"><b>Try it:</b> swap the two metals and watch the electrons turn round. Then set both sides to copper, weaken one solution, and find a small voltage from concentration alone.</p>`,
  terms: [
    { t: 'Cell', d: 'Two half-reactions kept apart, so their electrons must travel through a wire. A battery is one or more cells.' },
    { t: 'Anode', d: 'The electrode where oxidation happens. In a cell that is giving current it is the negative terminal.' },
    { t: 'Cathode', d: 'The electrode where reduction happens. In a cell that is giving current it is the positive terminal.' },
    { t: 'Salt bridge', d: 'A tube of salt solution joining the beakers. Its ions move to keep both sides electrically neutral.' },
    { t: 'Electrolyte', d: 'A liquid or paste containing ions that can move and carry charge.' },
    { t: 'Nernst equation', d: 'E = E° − (0.0592 V ÷ n) × log Q at 25 °C: how the voltage shifts when solutions are not 1 mol/L.' },
  ],
  defaults: { focus: 'cell', left: 'zn', right: 'cu', cL: 1, cR: 1, load: true, chem: 'li', mode: 'use' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'cell', label: 'Two beakers' }, { v: 'battery', label: 'Batteries you own' }] },
    { key: 'left', type: 'seg', label: 'Left metal', options: STRIPS.map((id) => ({ v: id, label: cap(couple(id).name) })), fmt: (v) => `E° ${couple(v).E.toFixed(2).replace('-', '−')} V` },
    { key: 'right', type: 'seg', label: 'Right metal', options: STRIPS.map((id) => ({ v: id, label: cap(couple(id).name) })), fmt: (v) => `E° ${couple(v).E.toFixed(2).replace('-', '−')} V` },
    { key: 'cL', type: 'log', label: 'Left solution strength', min: 0.001, max: 1, ends: ['0.001 mol/L', '1 mol/L'], fmt: fc },
    { key: 'cR', type: 'log', label: 'Right solution strength', min: 0.001, max: 1, ends: ['0.001 mol/L', '1 mol/L'], fmt: fc },
    { key: 'load', type: 'toggle', label: 'Lamp connected (let current flow)' },
    { key: 'pre', type: 'buttons', label: 'Try these cells', items: [
      { label: 'Daniell: zinc and copper', act: (s) => Object.assign(s, { focus: 'cell', left: 'zn', right: 'cu', cL: 1, cR: 1 }) },
      { label: 'Swap sides', act: (s) => Object.assign(s, { focus: 'cell', left: s.right, right: s.left, cL: s.cR, cR: s.cL }) },
      { label: 'Magnesium and silver', act: (s) => Object.assign(s, { focus: 'cell', left: 'mg', right: 'ag', cL: 1, cR: 1 }) },
      { label: 'Tin and lead: weak lead flips it', act: (s) => Object.assign(s, { focus: 'cell', left: 'sn', right: 'pb', cL: 1, cR: 0.01 }) },
      { label: 'Copper both sides, one weak', act: (s) => Object.assign(s, { focus: 'cell', left: 'cu', right: 'cu', cL: 0.001, cR: 1 }) },
    ] },
    { key: 'chem', type: 'seg', label: 'Battery', options: [{ v: 'lead', label: 'Lead–acid' }, { v: 'alk', label: 'Alkaline' }, { v: 'li', label: 'Lithium-ion' }] },
    { key: 'mode', type: 'seg', label: 'Battery is', options: [{ v: 'use', label: 'In use' }, { v: 'charge', label: 'Charging' }] },
  ],
  onChange(s, key) {
    if (['left', 'right', 'cL', 'cR', 'load'].includes(key)) s.focus = 'cell';
    if (key === 'chem' || key === 'mode') s.focus = 'battery';
  },
  quiz: [
    { q: 'In a zinc and copper cell, which way do electrons travel through the wire?', options: ['From copper to zinc', 'From zinc to copper', 'Through the salt bridge', 'They do not move'], answer: 1, why: 'Zinc is higher on the ladder, so it is oxidised and gives up electrons: it is the anode. They flow through the wire to the copper cathode, where Cu²⁺ ions take them.' },
    { q: 'E° is −0.76 V for zinc and +0.34 V for copper. What voltage does the Daniell cell give with standard solutions?', options: ['0.42 V', '0.76 V', '1.10 V', '1.50 V'], answer: 2, why: 'E°cell = E°(cathode) − E°(anode) = 0.34 − (−0.76) = 1.10 V.' },
    { q: 'What is the job of the salt bridge?', options: ['To carry electrons between the beakers', 'To let ions move so neither beaker builds up charge', 'To keep the solutions cool', 'To make the voltage bigger'], answer: 1, why: 'Electrons travel only in the wire. Without ions moving through the bridge, one beaker would go positive and the other negative within an instant, and the current would stop.' },
  ],
  reel: [
    { ms: 5400, caption: 'Keep zinc and copper apart and the electrons must go round a wire. That is the Daniell cell: 1.10 volts.', set: { focus: 'cell', left: 'zn', right: 'cu', cL: 1, cR: 1, load: true }, view: REEL_VIEW, spin: 0 },
    { ms: 5000, caption: 'Lithium sits at the top of the ladder, so a lithium-ion cell gives 3.7 volts. Charging pushes the electrons back.', set: { focus: 'battery', chem: 'li', mode: 'use' }, view: REEL_VIEW, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(23);
    // ================================================================ two beakers
    const Dn = new THREE.Group(); root.add(Dn);
    const XB = 1.95, sides = [-1, 1].map((sg) => {
      const bk = beaker(1.15, 2.3, 0.8); bk.position.x = sg * XB; Dn.add(bk);
      const mat = M.metal(0xaab4c0, { roughness: 0.42 });
      const st = box(0.55, 3.0, 0.1, mat); st.position.set(sg * XB - sg * 0.35, 1.8, 0); Dn.add(st);
      const coatMat = new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.8, metalness: 0.3 });
      const coat = box(0.58, 1.55, 0.13, coatMat); coat.position.set(st.position.x, 1.08, 0); coat.castShadow = false; Dn.add(coat);
      const ions = dots(8, 0.075, 0xffffff, 10, true); Dn.add(ions);
      const tg = tag('', 0.3); tg.position.set(sg * XB - sg * 0.35, 3.75, 0.3); Dn.add(tg);
      const tm = tag('', 0.26, '#cfd6e4'); tm.position.set(sg * XB, -0.3, 1.2); Dn.add(tm);
      return { sg, bk, st, mat, coat, coatMat, ions, tg, tm, x: st.position.x };
    });
    const BR = [[-0.95, 0.9, 0.35], [-0.95, 2.75, 0.35], [-0.6, 3.05, 0.35], [0.6, 3.05, 0.35], [0.95, 2.75, 0.35], [0.95, 0.9, 0.35]];
    const bridge = tube(BR, 0.17, M.clear(0xffffff, 0.3), false, 80); bridge.castShadow = false; Dn.add(bridge);
    const brPath = makePath(BR);
    const WP = [[sides[0].x, 3.3, 0], [sides[0].x, 4.55, 0], [sides[1].x, 4.55, 0], [sides[1].x, 3.3, 0]];
    Dn.add(wire(WP, 0.03, M.metal(0xd08a4a)));
    const wPath = makePath(WP);
    const meter = makeDisplay(1.5, 0.85); meter.position.set(0, 4.55, 0.1); Dn.add(meter);
    const NE = 14, el = dots(NE, 0.075, HEX.e, 10), sE = signs(NE, 'e⁻', 0.22, COL.e); Dn.add(el, sE);
    const NBI = 6, kIon = dots(NBI, 0.065, HEX.k, 10), nIon = dots(NBI, 0.065, HEX.so4, 10); Dn.add(kIon, nIon);
    const tBr = tag('salt bridge', 0.24, '#cfd6e4'); tBr.position.set(0, 2.55, 0.6); Dn.add(tBr);
    const lK = stage.label('K⁺ drifts to the cathode side', [0.95, 1.9, 0.6], Dn), lN = stage.label('NO₃⁻ drifts to the anode side', [-0.95, 1.5, 0.6], Dn);
    const cellLabels = [lK, lN];
    let q = 0, ckey = '', phase = 0;

    // ================================================================ batteries
    const Bt = new THREE.Group(); root.add(Bt);
    const caseM = box(5.2, 3.0, 1.5, M.clear(0xdcefff, 0.12)); caseM.position.set(0, 1.7, 0); caseM.castShadow = false; Bt.add(caseM);
    const negMat = new THREE.MeshStandardMaterial({ color: 0x33373f, roughness: 0.6 }), posMat = new THREE.MeshStandardMaterial({ color: 0x3d4f8a, roughness: 0.6 });
    const neg = box(1.3, 2.6, 1.2, negMat); neg.position.set(-1.8, 1.7, 0); Bt.add(neg);
    const pos = box(1.3, 2.6, 1.2, posMat); pos.position.set(1.8, 1.7, 0); Bt.add(pos);
    const sep = box(0.08, 2.7, 1.3, M.clear(0xffffff, 0.35)); sep.position.set(0, 1.7, 0); sep.castShadow = false; Bt.add(sep);
    const BW = [[-1.8, 3.0, 0], [-1.8, 4.5, 0], [1.8, 4.5, 0], [1.8, 3.0, 0]];
    Bt.add(wire(BW, 0.03, M.metal(0xd08a4a)));
    const bPath = makePath(BW);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe08a, toneMapped: false })); lamp.position.set(0, 4.5, 0); Bt.add(lamp);
    const charger = box(0.9, 0.5, 0.4, M.plastic(0x2a2e37)); charger.position.set(0, 4.5, 0); Bt.add(charger);
    const NI = 14, bEl = dots(NI, 0.075, HEX.e, 10), bSE = signs(NI, 'e⁻', 0.22, COL.e), bIon = dots(NI, 0.09, 0xffffff, 12, true); Bt.add(bEl, bSE, bIon);
    const IO = Array.from({ length: NI }, (_, i) => ({ y: 0.7 + rnd() * 2.0, z: -0.45 + rnd() * 0.9, ph: i / NI }));
    const tNeg = tag('− electrode', 0.28), tPos = tag('+ electrode', 0.28), tMode = tag('', 0.3, '#ffe08a'), tIon = tag('', 0.26); Bt.add(tNeg, tPos, tMode, tIon);
    tNeg.position.set(-1.8, -0.2, 0.9); tPos.position.set(1.8, -0.2, 0.9); tMode.position.set(0, 5.05, 0); tIon.position.set(0, 0.25, 0.9);
    const lNeg = stage.label('', [-1.8, 3.25, 0.7], Bt), lPos = stage.label('', [1.8, 3.25, 0.7], Bt), lEl = stage.label('', [0, 1.0, 0.8], Bt);
    const battLabels = [lNeg, lPos, lEl];
    let soc = 1, bkey0 = '';

    // ================================================================ board
    let S = null, bkey = '';
    const bd = board(root, 3.4, 2.38, 640, 448, (g, w, h) => {
      panelBg(g, w, h); if (!S) return;
      if (S.focus === 'battery') {
        title(g, 'Volts per cell');
        const rows = [['Daniell (zinc, copper)', 1.1037, '#c87533', false], ['Alkaline', BATT.alk.V, '#b48cff', S.chem === 'alk'], ['Lead–acid', BATT.lead.V, '#ffe08a', S.chem === 'lead'], ['Lithium-ion', BATT.li.V, '#ff9a6b', S.chem === 'li']];
        rows.forEach(([n, v, col, on], i) => {
          const y = 96 + i * 62; text(g, n, 20, y, on ? '#fff' : COL.soft, `${on ? 'bold ' : ''}22px sans-serif`);
          g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(20, y + 10, 480, 22); g.fillStyle = col; g.globalAlpha = on ? 1 : 0.55; g.fillRect(20, y + 10, (v / 4) * 480, 22); g.globalAlpha = 1;
          text(g, v.toFixed(2) + ' V', 20 + (v / 4) * 480 + 12, y + 29, on ? '#fff' : COL.soft, 'bold 22px sans-serif');
        });
        const b = BATT[S.chem];
        text(g, 'charge left', 20, 372, COL.soft, '21px sans-serif');
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(150, 352, 350, 26); g.fillStyle = soc > 0.2 ? COL.ok : COL.bad; g.fillRect(152, 354, 346 * soc, 22);
        text(g, `${Math.round(soc * 100)}%`, 514, 373, COL.text, 'bold 22px sans-serif');
        text(g, `1 g of ${b.m} carries ${b.ahg.toFixed(2)} Ah`, 20, 424, COL.e, '22px sans-serif');
        return;
      }
      const C = cell(S.left, S.right, S.cL, S.cR);
      title(g, 'Cell voltage', 'the gap on the ladder');
      const x0 = 30, x1 = w - 30, X = (v) => x0 + ((v + 2.6) / 4.3) * (x1 - x0), y = 210;
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      [-2, -1, 0, 1].forEach((v) => { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(X(v) - 1, y - 8, 2, 16); text(g, (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' V', X(v), y + 36, COL.soft, '19px sans-serif', 'center'); });
      STRIPS.forEach((id, i) => { const c = couple(id); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(X(c.E) - 1, y - 16, 2, 16); text(g, c.sym, X(c.E), y - 22 - (i % 2) * 20, COL.dim, '17px sans-serif', 'center'); });
      const xa = X(Math.min(C.eL, C.eR)), xc = X(Math.max(C.eL, C.eR));
      g.strokeStyle = COL.hot; g.lineWidth = 5; g.beginPath(); g.moveTo(xa, y - 78); g.lineTo(xa, y - 92); g.lineTo(xc, y - 92); g.lineTo(xc, y - 78); g.stroke();
      text(g, uv(C.E), (xa + xc) / 2, y - 104, COL.hot, 'bold 30px sans-serif', 'center');
      dot(g, xa, y, COL.ox, 11); dot(g, xc, y, COL.red, 11);
      text(g, C.dead ? 'both halves are the same: no voltage' : `anode (−): ${C.an.sym} is oxidised`, 20, 300, C.dead ? COL.bad : COL.ox, '22px sans-serif');
      if (!C.dead) text(g, `cathode (+): ${C.ca.ion} is reduced`, 20, 334, COL.red, '22px sans-serif');
      text(g, 'E = E°(cathode) − E°(anode)', 20, 384, COL.text, '21px sans-serif');
      text(g, `   − (0.0592 V ÷ ${C.n}) × log Q`, 20, 416, COL.soft, '21px sans-serif');
    }, [4.45, 2.7, 0]);

    const setFocus = focusSwitch(stage, { cell: Dn, battery: Bt });
    const c1 = new THREE.Color();
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const isC = s.focus !== 'battery';
        setFocus(isC ? 'cell' : 'battery');
        const narrow = fitNarrow(stage, []);
        showLabels(cellLabels, isC && !narrow); showLabels(battLabels, !isC && !narrow);
        placeBoard(bd);
        [Dn, Bt].forEach((G) => placeModel(G, { rx: 0, ry: 0.3, rs: 1.12, wx: -0.3, wy: 0.12, ws: 0.92, px: -0.24, py: 0.4, ps: 0.7 }));

        if (isC) {
          const C = cell(s.left, s.right, s.cL, s.cR), flow = s.load && !C.dead;
          const k = `${s.left}|${s.right}`; if (k !== ckey) { ckey = k; q = 0; }
          if (flow) { q = Math.min(1, q + dt / 14); phase += dt * 0.22; }
          const dir = C.leftIsAnode ? 1 : -1;
          sides.forEach((sd) => {
            const c = sd.sg < 0 ? C.L : C.R, conc = sd.sg < 0 ? s.cL : s.cR, anode = (sd.sg < 0) === C.leftIsAnode && !C.dead, strength = (Math.log10(conc) + 3) / 3;
            sd.mat.color.setHex(c.metal); sd.coatMat.color.setHex(c.metal);
            sd.bk.setTint(c.tint ?? WATER, c.tint ? 0.2 + 0.4 * strength : 0.22);
            sd.st.scale.x = anode ? 1 - 0.3 * q : 1; sd.st.scale.z = anode ? 1 - 0.5 * q : 1;
            sd.coat.visible = !anode && !C.dead && q > 0.02; sd.coat.scale.set(1 + 0.25 * q, 1, 1 + 1.6 * q);
            sd.tg.set(C.dead ? `${c.name}` : anode ? `anode −  ${c.name}` : `cathode +  ${c.name}`, C.dead ? '#e8eef8' : anode ? COL.ox : COL.red);
            sd.tm.set(`${c.ion} ions, ${fc(conc)}`);
            // ions leaving the anode, or arriving at the cathode
            for (let i = 0; i < 8; i++) {
              if (!flow) { sd.ions.hide(i); continue; }
              const u = (i / 8 + phase * 1.6) % 1, side = i % 2 ? 1 : -1, yy = 0.45 + ((i * 0.37) % 1) * 1.3, d = anode ? u : 1 - u;
              sd.ions.place(i, sd.x + side * (0.32 + d * 0.5), yy + d * 0.15 * side, 0.12 * side, 0.5 + 0.6 * (1 - Math.abs(d - 0.4)));
              sd.ions.tint(i, c.tint ?? 0xe8eef8);
            }
            sd.ions.done();
          });
          for (let i = 0; i < NE; i++) {
            if (!flow) { el.hide(i); sE.hide(i); continue; }
            let u = (i / NE + phase) % 1; if (dir < 0) u = 1 - u;
            const p = wPath.at(u); if (Math.abs(p[0]) < 0.85 && p[1] > 4.4) { el.hide(i); sE.hide(i); continue; }
            el.place(i, p[0], p[1], p[2] + 0.06); if (i % 2 === 0) sE.place(i, p[0] + 0.02, p[1] + 0.24, p[2] + 0.1); else sE.hide(i);
          }
          el.done();
          for (let i = 0; i < NBI; i++) {
            if (!flow) { kIon.hide(i); nIon.hide(i); continue; }
            const u = (i / NBI + phase * 0.7) % 1, a = brPath.at(dir > 0 ? u : 1 - u), b = brPath.at(dir > 0 ? 1 - u : u);
            kIon.place(i, a[0], a[1], a[2] + 0.07); nIon.place(i, b[0], b[1], b[2] - 0.07);
          }
          kIon.done(); nIon.done();
          lK.position.set((dir > 0 ? 1 : -1) * 0.95, 1.9, 0.7); lN.position.set((dir > 0 ? -1 : 1) * 0.95, 1.45, 0.7);
          meter.set(C.E.toFixed(2) + ' V', C.dead ? 'no voltage' : s.load ? 'electrons: ' + (dir > 0 ? 'left → right' : 'right → left') : 'lamp off');
          const kk = `c|${s.left}|${s.right}|${s.cL.toFixed(4)}|${s.cR.toFixed(4)}`;
          if (kk !== bkey) { bkey = kk; bd.redraw(); }
        } else {
          const b = BATT[s.chem], charging = s.mode === 'charge' && b.re;
          const k0 = s.chem; if (k0 !== bkey0) { bkey0 = k0; soc = 1; }
          soc = clamp(soc + (charging ? dt / 9 : s.mode === 'use' ? -dt / 12 : 0), 0, 1);
          const flow = charging ? soc < 1 : s.mode === 'use' && soc > 0;
          if (flow) phase += dt * 0.22;
          negMat.color.setHex(b.cn); posMat.color.setHex(b.cp);
          lamp.visible = !charging; charger.visible = charging;
          lamp.material.color.setHex(flow && !charging ? 0xffe08a : 0x4a4638);
          const ed = charging ? -1 : 1;                                   // electrons: − to + in use
          for (let i = 0; i < NI; i++) {
            if (!flow) { bEl.hide(i); bSE.hide(i); bIon.hide(i); continue; }
            let u = (i / NI + phase) % 1; if (ed < 0) u = 1 - u;
            const p = bPath.at(u);
            if (Math.abs(p[0]) < 0.5 && p[1] > 4.4) { bEl.hide(i); bSE.hide(i); } else { bEl.place(i, p[0], p[1], p[2] + 0.06); if (i % 2 === 0) bSE.place(i, p[0], p[1] + 0.24, 0.1); else bSE.hide(i); }
            let v = (IO[i].ph + phase) % 1; if (ed * b.dir < 0) v = 1 - v;
            bIon.place(i, lerp(-1.6, 1.6, v), IO[i].y, IO[i].z + 0.65, 1); bIon.tint(i, b.ci);
          }
          bEl.done(); bIon.done();
          tMode.set(!b.re && s.mode === 'charge' ? 'not rechargeable' : charging ? (soc < 1 ? 'charger pushes electrons back' : 'full') : soc > 0 ? 'in use: lamp lit' : 'flat', charging ? '#8ef0ff' : '#ffe08a');
          tIon.set(`${b.ion} ions cross inside`, '#' + b.ci.toString(16).padStart(6, '0'));
          lNeg.element.textContent = b.ln; lPos.element.textContent = b.lp; lEl.element.textContent = 'electrolyte: ' + b.le;
          const kk = `b|${s.chem}|${Math.round(soc * 50)}`;
          if (kk !== bkey) { bkey = kk; bd.redraw(); }
        }
      },
      readout: (s) => {
        if (s.focus === 'battery') {
          const b = BATT[s.chem], charging = s.mode === 'charge';
          return fit(`<div class="big">${b.name}: ${b.V.toFixed(2)} V a cell</div>
            <div class="row"><span>− electrode (oxidised in use)</span><b>${b.neg}</b></div>
            <div class="row"><span>+ electrode (reduced in use)</span><b>${b.pos}</b></div>
            <div class="row x"><span>Voltage</span><b>${b.V.toFixed(2)} V, ${b.src}${s.chem === 'lead' ? `: ${E_PBO2.toFixed(2)} − ${par(E_PBSO4)}` : ''}</b></div>
            <div class="row"><span>In practice</span><b>${b.pack(b.V)}</b></div>
            <div class="row x"><span>Charge per gram of ${b.m}</span><b>${b.ahg.toFixed(2)} Ah</b></div>
            <div class="row"><span>${charging ? 'Charging' : 'In use'}</span><b>${charging && !b.re ? 'not rechargeable: never try' : charging ? 'both half-reactions run backwards' : 'electrons leave the − electrode'}</b></div>
            <small>One electron goes round the wire for every single charge that crosses inside. Found in ${b.where}.</small>`);
        }
        const C = cell(s.left, s.right, s.cL, s.cR);
        if (C.dead) return fit(`<div class="big">0.00 V: no cell</div>
          <div class="row"><span>Both halves</span><b>${C.L.name}, at ${C.eL.toFixed(2).replace('-', '−')} V</b></div>
          <small>Two identical half-cells have nothing to push electrons with. Change one metal, or weaken one solution.</small>`);
        const std = Math.abs(s.cL - 1) < 1e-6 && Math.abs(s.cR - 1) < 1e-6;
        return fit(`<div class="big">${C.E.toFixed(2)} V</div>
          <div class="row"><span>Anode (−), oxidation</span><b>${C.an.sym} → ${C.an.ion} + ${C.an.z} e⁻</b></div>
          <div class="row"><span>Cathode (+), reduction</span><b>${C.ca.ion} + ${C.ca.z} e⁻ → ${C.ca.sym}</b></div>
          <div class="row"><span>E°cell = E°(cathode) − E°(anode)</span><b>${C.ca.E.toFixed(2).replace('-', '−')} − ${par(C.an.E)} = ${C.E0.toFixed(2).replace('-', '−')} V</b></div>
          ${std ? '' : `<div class="row"><span>Nernst shift for these strengths</span><b>${(C.E - C.E0 >= 0 ? '+' : '−') + Math.abs(C.E - C.E0).toFixed(3)} V</b></div>`}
          <div class="row x"><span>Electrons in the wire</span><b>${s.load ? (C.leftIsAnode ? 'left → right' : 'right → left') : 'none: lamp off'}</b></div>
          <div class="row x"><span>For every ${C.n} electrons</span><b>${C.ka} ${C.an.sym} dissolves, ${C.kc} ${C.ca.sym} plates out</b></div>
          <div class="row x"><span>Energy (−ΔG = nFE)</span><b>${num(-C.dG)} kJ per mole</b></div>
          <small>${['al', 'mg'].includes(C.an.id) ? `Real ${C.an.name} reads lower than this: its oxide skin gets in the way. ` : ''}The table value, with nothing drawn from the cell. Under load a real cell gives a little less.</small>`);
      },
    };
  },
};
