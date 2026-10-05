// Chapter 2: the reactivity series. Pick any metal strip and any solution: does the metal push the
// other one out? Nothing here is a list of remembered cases. The answer comes from the table of
// standard electrode potentials in redox.js (CRC Handbook values):
//   metal A in a solution of B's ions reacts only if E°(B) > E°(A), i.e. E°cell = E°(B) − E°(A) > 0.
// The balanced equation uses n = lcm(z_A, z_B) electrons: n ÷ z_A atoms of A lose them and n ÷ z_B
// ions of B gain them, so the two electron counts are equal by construction. ΔG° = −n F E°cell.
// "Dilute acid" is the couple 2 H⁺ + 2 e⁻ → H₂ at 0.00 V: metals above hydrogen fizz, copper, silver
// and gold do not. One mole of gas takes up 24.5 L at 25 °C and 1 atm.
// Lithium, potassium, calcium and sodium are on the ladder but are not offered as strips: they react
// with the water itself. Aluminium's real behaviour is slowed by its oxide skin (chapter 5).
// The 6-second run is a time-lapse; real rates depend on surface, concentration and temperature.
import { THREE, M, box, clamp, lerp } from '../kit.js';
import { COUPLES, couple, displace, STRIPS, SOLUTIONS, VMOLAR, COL, board, panelBg, title, text, dots, tag, beaker, uv, num,
  fitNarrow, placeBoard, placeModel, autoView, fit, rng, REEL_VIEW } from '../redox.js';
import { par } from '../redox.js';

const LADDER = [...COUPLES].sort((a, b) => a.E - b.E);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const WATER = 0xa9cfe8;

export default {
  id: 'series',
  short: 'The reactivity series',
  title: 'Which metal pushes which out?',
  subtitle: 'Pick a metal and a solution. A table of voltages decides, every time.',
  get view() { return autoView({ px: 0.15 }); },
  learn: `<p>Zinc pushes copper out of solution. Can copper push zinc out? No. Line the metals up by how easily they give away electrons and you get the <b>reactivity series</b>: potassium and sodium at the top, then magnesium, aluminium, zinc, iron, lead, then hydrogen, copper, silver and gold at the bottom.</p>
    <p>The rule: <b>a metal can push out any metal below it</b>, and nothing above it. The higher metal is <b>oxidised</b> (it loses electrons and dissolves), and the ions of the lower metal are <b>reduced</b> (they gain those electrons and come out as solid metal). This is a <b>displacement reaction</b>.</p>
    <p>Two famous cases. An <b>iron nail</b> in blue copper sulphate turns copper-brown, and the solution goes pale green as iron ions replace copper ions. A <b>copper wire</b> in clear silver nitrate grows glittering silver crystals, and the water turns blue.</p>
    <p>The ladder is not a list to learn by heart. Each rung has a measured voltage, its <b>standard electrode potential E°</b>. (Sorted by voltage, lithium and calcium land a little higher than in the school list, which ranks the top metals by how violently they react with water. For every metal you can dip here, the two orders agree.) Take the E° of the ions in the water and subtract the E° of the strip. If the answer is <b>positive</b>, the reaction goes. If it is negative, nothing happens.</p>
    <p><b>Hydrogen</b> is on the ladder too, at exactly 0 V. Metals above it push hydrogen out of <b>dilute acid</b> as bubbles of gas. Copper, silver and gold sit below it, which is why they do not dissolve in dilute acid, and why gold jewellery survives for thousands of years.</p>
    <p><b>In the lab.</b> At school these tests use small strips and a few millilitres of dilute solution, with eye protection on and hands washed afterwards. Lead and silver salts are handled by the teacher. The metals at the very top of the ladder react with water itself, far too strongly for this experiment, so they are not on the menu.</p>
    <p class="tip"><b>Try it:</b> put <b>copper in silver nitrate</b>, then swap them round to silver in copper sulphate. Find the only two metals here that do nothing in dilute acid along with copper.</p>`,
  terms: [
    { t: 'Reactivity series', d: 'Metals in order of how easily they lose electrons, most reactive at the top.' },
    { t: 'Displacement reaction', d: 'A more reactive metal takes the place of a less reactive one in a compound or solution.' },
    { t: 'Standard electrode potential (E°)', d: 'A voltage that measures how strongly an ion pulls electrons, compared with hydrogen at 0 V. Lower means more reactive metal.' },
    { t: 'Half-equation', d: 'One half of a redox reaction, showing only the loss or only the gain of electrons.' },
    { t: 'Noble metal', d: 'A metal low in the series, such as gold or silver, that is hard to oxidise.' },
  ],
  defaults: { metal: 'fe', sol: 'cu' },
  controls: [
    { key: 'metal', type: 'seg', label: 'Metal strip', options: STRIPS.map((id) => ({ v: id, label: cap(couple(id).name) })), fmt: (v) => `E° ${couple(v).E.toFixed(2).replace('-', '−')} V` },
    { key: 'sol', type: 'seg', label: 'Solution it is dipped in', options: SOLUTIONS.map((id) => ({ v: id, label: cap(couple(id).salt) })), fmt: (v) => `${couple(v).ion}: E° ${couple(v).E.toFixed(2).replace('-', '−')} V` },
    { key: 'pre', type: 'buttons', label: 'Classic tests', items: [
      { label: 'Iron nail in copper sulphate', act: (s) => { s.metal = 'fe'; s.sol = 'cu'; } },
      { label: 'Copper in silver nitrate', act: (s) => { s.metal = 'cu'; s.sol = 'ag'; } },
      { label: 'Copper in zinc sulphate', act: (s) => { s.metal = 'cu'; s.sol = 'zn'; } },
      { label: 'Zinc in dilute acid', act: (s) => { s.metal = 'zn'; s.sol = 'h'; } },
      { label: 'Copper in dilute acid', act: (s) => { s.metal = 'cu'; s.sol = 'h'; } },
      { label: 'Run it again', act: (s, inst) => inst.restart?.() },
    ] },
  ],
  quiz: [
    { q: 'An iron nail is left in copper sulphate solution. What do you see?', options: ['Nothing', 'The nail gets a brown copper coat and the blue fades to pale green', 'The nail turns silver', 'Bubbles of oxygen'], answer: 1, why: 'Iron is above copper in the series, so iron atoms lose electrons and dissolve as pale green Fe²⁺, while Cu²⁺ ions gain them and plate out as copper.' },
    { q: 'E° for Zn²⁺/Zn is −0.76 V and for Cu²⁺/Cu is +0.34 V. A copper strip is put in zinc sulphate. E°cell = −0.76 − 0.34 = −1.10 V. What does that mean?', options: ['A fast reaction', 'A slow reaction', 'No reaction: copper cannot push zinc out', 'An explosion'], answer: 2, why: 'A negative cell voltage means the reaction does not go that way. It goes the other way round: zinc in copper sulphate, at +1.10 V.' },
    { q: 'Why does gold not dissolve in dilute acid?', options: ['Gold is too heavy', 'Gold sits below hydrogen in the series, so it cannot give electrons to H⁺ ions', 'Acid has no electrons', 'Gold has an oxide coat'], answer: 1, why: 'Only metals above hydrogen can reduce H⁺ to hydrogen gas. Gold (+1.50 V) is far below hydrogen (0 V), so it keeps its electrons.' },
  ],
  reel: [
    { ms: 5400, caption: 'Copper wire in silver nitrate: copper sits higher in the reactivity series, so silver crystals grow.', set: { metal: 'cu', sol: 'ag' }, act: (s, inst) => inst.restart?.(), view: REEL_VIEW, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = new THREE.Group(); root.add(G);
    const rnd = rng(11);
    const bk = beaker(1.35, 2.7, 0.78); G.add(bk);
    const TOP = bk.top;
    const stripMat = M.metal(0x7d8187, { roughness: 0.4 });
    const strip = box(0.6, 3.5, 0.09, stripMat); strip.position.set(0, 2.0, 0); G.add(strip);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xc87533, roughness: 0.85, metalness: 0.3, transparent: true, opacity: 0 });
    const coat = box(0.64, TOP - 0.3, 0.13, coatMat); coat.position.set(0, 0.25 + (TOP - 0.3) / 2, 0); coat.castShadow = false; G.add(coat);
    const NC = 90, crystals = dots(NC, 0.07, 0xffffff, 8, true); G.add(crystals);
    crystals.material.metalness = 0.7; crystals.material.roughness = 0.3;
    const CR = Array.from({ length: NC }, () => { const edge = rnd() < 0.35; return { x: edge ? (rnd() < 0.5 ? -0.32 : 0.32) : -0.3 + rnd() * 0.6, y: 0.3 + rnd() * (TOP - 0.45), z: edge ? (rnd() - 0.5) * 0.1 : (rnd() < 0.5 ? -0.09 : 0.09), s: 0.5 + rnd() * 1.3, t: rnd() * 0.5 }; });
    const NB = 46, bub = dots(NB, 0.055, 0xffffff, 8); G.add(bub); bub.material.transparent = true; bub.material.opacity = 0.75;
    const BB = Array.from({ length: NB }, () => ({ x: -0.34 + rnd() * 0.68, z: rnd() < 0.5 ? -0.12 : 0.12, ph: rnd(), v: 0.5 + rnd() * 0.5, w: rnd() * 6.28 }));
    const tRes = tag('', 0.36), tStrip = tag('', 0.3), tSol = tag('', 0.3, '#9fd0ff'); G.add(tRes, tStrip, tSol);
    tRes.position.set(0, 4.35, 0); tStrip.position.set(-1.15, 3.55, 0); tSol.position.set(0, -0.35, 1.4);

    let S = null, p = 0, key = '', bkey = '';
    const bd = board(root, 3.1, 3.39, 640, 700, (g, w, h) => {
      panelBg(g, w, h); if (!S) return;
      const R = displace(S.metal, S.sol);
      title(g, 'The ladder', 'E° in volts');
      const y0 = 74, dy = 36;
      text(g, 'gives electrons most easily', 20, y0 - 8, COL.dim, '18px sans-serif');
      LADDER.forEach((c, i) => {
        const y = y0 + 22 + i * dy, isA = c.id === S.metal, isB = c.id === S.sol;
        if (isA || isB) { g.fillStyle = isA && isB ? 'rgba(255,255,255,.18)' : isA ? 'rgba(255,154,107,.22)' : 'rgba(127,178,255,.22)'; g.fillRect(12, y - 25, w - 24, dy - 2); }
        const col = isA ? COL.ox : isB ? COL.red : c.water ? COL.dim : COL.text;
        text(g, cap(c.name), 24, y, col, `${isA || isB ? 'bold ' : ''}22px sans-serif`);
        text(g, `${c.ion}`, 190, y, col, '21px sans-serif');
        text(g, c.E === 0 ? '0.00' : (c.E > 0 ? '+' : '−') + Math.abs(c.E).toFixed(2), 330, y, col, '22px monospace', 'right');
        // bar from −3.1 to +1.6 V
        const X = (v) => 350 + ((v + 3.1) / 4.7) * 270;
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(350, y - 14, 270, 12);
        g.fillStyle = col; g.fillRect(Math.min(X(0), X(c.E)), y - 14, Math.max(2, Math.abs(X(c.E) - X(0))), 12);
        if (isA) text(g, 'strip', w - 22, y - 16 + 22, COL.ox, 'bold 17px sans-serif', 'right');
        if (isB && !isA) text(g, 'ions', w - 22, y - 16 + 22, COL.red, 'bold 17px sans-serif', 'right');
      });
      const ya = y0 + 22 + LADDER.findIndex((c) => c.id === S.metal) * dy - 8, yb = y0 + 22 + LADDER.findIndex((c) => c.id === S.sol) * dy - 8;
      if (!R.same) {
        g.strokeStyle = R.goes ? COL.ok : COL.bad; g.fillStyle = g.strokeStyle; g.lineWidth = 5;
        g.beginPath(); g.moveTo(160, ya); g.lineTo(160, yb); g.stroke();
        if (R.goes) { g.beginPath(); g.moveTo(160, yb + 6); g.lineTo(150, yb - 10); g.lineTo(170, yb - 10); g.closePath(); g.fill(); }
        else { g.beginPath(); g.moveTo(148, yb - 12); g.lineTo(172, yb + 12); g.moveTo(172, yb - 12); g.lineTo(148, yb + 12); g.stroke(); }
      }
      text(g, 'holds its electrons tightest', 20, y0 + 22 + 16 * dy - 4, COL.dim, '18px sans-serif');
      text(g, R.same ? 'same metal: nothing to swap' : R.goes ? `electrons fall ${uv(R.E)} down the ladder` : 'electrons cannot climb the ladder', w - 20, y0 + 22 + 16 * dy - 4, R.goes ? COL.ok : COL.bad, 'bold 20px sans-serif', 'right');
    }, [4.5, 2.6, 0]);

    const c1 = new THREE.Color(), c2 = new THREE.Color();
    return {
      restart() { p = 0; },
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const k = s.metal + '|' + s.sol; if (k !== key) { key = k; p = 0; }
        const R = displace(s.metal, s.sol), a = R.a, b = R.b;
        if (R.goes) p = Math.min(1, p + dt / 6);
        fitNarrow(stage, []);
        placeBoard(bd, [[4.55, 2.75, 0], -0.25, 1.05], [[0, 8.95, 0], 0, 1.45], [[2.05, 1.75, 0], 0, 1.05]);
        placeModel(G, { rx: 0, ry: 0.2, rs: 1.3, wx: -0.6, wy: 0.45, px: -2.0, py: 0.5, ps: 0.85 });
        stripMat.color.setHex(a.metal);
        // the liquid: from the colour of B's ions towards the colour of A's ions
        const from = b.tint ?? WATER, to = a.tint ?? WATER, f = R.goes ? p : 0;
        c1.setHex(from).lerp(c2.setHex(to), f);
        bk.setTint(c1.getHex(), lerp(b.tint ? 0.58 : 0.24, a.tint ? 0.5 : 0.24, f));
        const solid = R.goes && !b.gas;
        coatMat.color.setHex(b.gas ? a.metal : b.metal); coatMat.opacity = solid ? clamp(p * 1.5, 0, 0.95) : 0; coat.visible = solid;
        crystals.material.color.setHex(b.gas ? 0xffffff : b.metal);
        CR.forEach((q, i) => { const g = solid ? clamp((p - q.t * 0.6) / 0.5, 0, 1) : 0; if (g <= 0) crystals.hide(i); else crystals.place(i, q.x, q.y, q.z, g * q.s); });
        crystals.done();
        const fizz = R.goes && b.gas ? 1 - p * 0.8 : 0;
        BB.forEach((q, i) => {
          if (i / NB >= fizz) return bub.hide(i);
          const u = (q.ph + time * q.v * 0.5) % 1; bub.place(i, q.x + 0.05 * Math.sin(time * 3 + q.w), 0.3 + u * (TOP - 0.3), q.z + (q.z > 0 ? 0.1 : -0.1) * u, 0.6 + u * 0.7);
        });
        bub.done();
        tStrip.set(`${a.name} strip`); tSol.set(b.gas ? 'dilute acid (H⁺ ions)' : `${b.salt} (${b.ion} ions)`);
        tRes.set(R.same ? 'same metal: no change' : !R.goes ? 'no reaction' : b.gas ? `${a.name} dissolves, hydrogen bubbles off` : `${b.name} comes out on the ${a.name}`, R.goes ? '#5ce1a9' : '#ff8fa6');
        const kk = k; if (kk !== bkey) { bkey = kk; bd.redraw(); }
      },
      readout: (s) => {
        const R = displace(s.metal, s.sol), a = R.a, b = R.b;
        const calc = `<div class="row"><span>E°cell = E°(${b.ion}) − E°(${a.sym})</span><b class="${R.goes ? 'ok' : 'no'}">${b.E.toFixed(2).replace('-', '−')} − ${par(a.E)} = ${R.E.toFixed(2).replace('-', '−')} V</b></div>`;
        if (R.same) return fit(`<div class="big">Same metal: nothing to swap</div>${calc}<small>A metal in a solution of its own ions is the starting point of a cell: see the next chapter.</small>`);
        if (!R.goes) return fit(`<div class="big">No reaction</div>${calc}
          <div class="row"><span>Electrons moved</span><b>0</b></div>
          <small>${cap(a.name)} sits below ${b.name} on the ladder, so it holds its electrons more tightly and cannot hand them over. ${b.gas ? 'Dilute acid cannot dissolve it.' : `The reverse pairing does react: ${b.name} in a ${a.name} salt.`}</small>`);
        const perG = b.gas ? `${num((R.kb * VMOLAR) / (R.ka * a.M) * 1000)} mL of hydrogen` : `${num((R.kb * b.M) / (R.ka * a.M))} g of ${b.name}`;
        const note = a.id === 'al' ? 'In real life aluminium is slow to start: a thin oxide skin protects it. See chapter 5.' : a.id === 'mg' && !b.gas ? 'Magnesium is so high on the ladder that it also slowly pushes hydrogen out of the water itself.' : b.id === 'pb' || b.id === 'ag' ? 'Lead salts are toxic and silver nitrate stains skin: these are teacher demonstrations.' : 'The run is a time-lapse. The voltage says which way the reaction goes, not how fast.';
        return fit(`<div class="big">${cap(a.name)} pushes out ${b.gas ? 'hydrogen' : b.name}</div>
          <div class="row"><span>Reaction</span><b>${R.eq}</b></div>
          <div class="row x"><span>Oxidation</span><b>${R.ox}</b></div>
          <div class="row x"><span>Reduction</span><b>${R.red}</b></div>
          <div class="row"><span>Electrons lost</span><b>${R.ka} ${a.sym} × ${a.z} = ${R.n}</b></div>
          <div class="row"><span>Electrons gained</span><b>${b.gas ? `${R.kb * 2} H⁺ × 1` : `${R.kb} ${b.ion} × ${b.z}`} = ${R.n}</b></div>
          ${calc}
          <div class="row x"><span>Energy released (−ΔG° = nFE°)</span><b>${num(-R.dG)} kJ per mole</b></div>
          <div class="row x"><span>Each gram of ${a.name} gives</span><b>${perG}</b></div>
          <small>${note}</small>`);
      },
    };
  },
};
