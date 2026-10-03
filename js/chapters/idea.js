// Chapter 1: the idea. A strip of zinc in copper sulphate solution, seen at the scale of atoms.
//   Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)
//   oxidation: Zn → Zn²⁺ + 2 e⁻        reduction: Cu²⁺ + 2 e⁻ → Cu
// Every event on screen moves exactly two electrons from one metal atom to one copper ion: the atom
// becomes a 2+ ion and swims off, the ion becomes a neutral copper atom and takes its place. So the
// electrons lost always equal the electrons gained, and the solution always holds as much + charge
// (Cu²⁺ and Zn²⁺) as − charge (the sulphate ions, which only watch: "spectator ions").
// Whether anything happens is decided by the table of standard electrode potentials in redox.js:
// E°(Cu²⁺/Cu) = +0.34 V is above zinc (−0.76), iron (−0.45) and magnesium (−2.37), so all three push
// copper out, and below silver (+0.80), which does nothing. E°cell = E°(Cu) − E°(metal), ΔG° = −nFE°.
// The grams in the readout are for a school-sized beaker: 100 mL of 0.1 mol/L copper sulphate, which
// holds 0.01 mol of Cu²⁺ (0.635 g of copper). The picture shows 12 of those ions.
// The speed of the picture is a time-lapse and is NOT taken from E°: a table of voltages says which
// way a reaction goes, not how fast.
import { THREE, M, box, clamp, smooth, lerp } from '../kit.js';
import { couple, displace, COL, HEX, board, panelBg, title, text, axes, line, dots, signs, tag, beaker, uv, num, mass,
  fitNarrow, placeBoard, placeModel, autoView, fit, inReel, rng, REEL_VIEW } from '../redox.js';
import { par } from '../redox.js';

const N = 12, COLS = 4, ROWS = 8, D = 0.44, XS = -1.65, Y0 = 0.62, GAP = 2.2, MOL = 0.01;
const ORDER = [[4, 0], [1, 0], [6, 0], [2, 0], [7, 0], [0, 0], [5, 0], [3, 0], [4, 1], [1, 1], [6, 1], [3, 1]];
const T_END = (N - 1) * GAP + 3.4;
const ION = { zn: 0xdfe6f0, fe: 0xa9d6a0, mg: 0xf4f4f0, ag: 0xffffff };
const doneAt = (t) => clamp(Math.floor((t - 2.0) / GAP) + 1, 0, N);

export default {
  id: 'idea',
  short: 'Electrons change hands',
  title: 'Oxidation is loss, reduction is gain',
  subtitle: 'Dip zinc in blue copper sulphate and follow every electron.',
  get view() { return autoView(); },
  learn: `<p>Put a strip of grey <b>zinc</b> in blue <b>copper sulphate</b> solution. Within minutes the strip is coated in brown copper, and the blue slowly fades. Nothing was burned and nothing was heated. So what happened?</p>
    <p>Zoom in to the atoms. The blue colour comes from <b>copper ions</b>, Cu²⁺: copper atoms that are each short of two electrons. When a copper ion touches the zinc, a zinc atom hands it <b>two electrons</b>.</p>
    <p><b>Zn → Zn²⁺ + 2 e⁻</b> &nbsp; the zinc atom <b>loses</b> electrons. That is <b>oxidation</b>.<br><b>Cu²⁺ + 2 e⁻ → Cu</b> &nbsp; the copper ion <b>gains</b> them. That is <b>reduction</b>.</p>
    <p>The copper ion becomes an ordinary copper atom and sticks to the strip. The zinc atom, now a zinc ion, swims away into the water. Remember it as <b>OIL RIG</b>: <b>O</b>xidation <b>I</b>s <b>L</b>oss, <b>R</b>eduction <b>I</b>s <b>G</b>ain.</p>
    <p>The two halves can never happen alone. An electron that leaves one atom must land on another, so every reaction of this kind is a pair: a <b>red</b>uction and an <b>ox</b>idation, a <b>redox</b> reaction. Count them on the board: electrons lost always equals electrons gained. The yellow <b>sulphate ions</b> take no part. They are <b>spectator ions</b>, and they keep the water's charges balanced.</p>
    <p>Why does zinc give and copper take? Zinc holds its outer electrons more loosely than copper does. Chemists measure that as a voltage, and the next chapter lines the metals up by it. Try a <b>silver</b> strip here: silver holds its electrons more tightly than copper, so nothing happens at all.</p>
    <p class="tip"><b>Try it:</b> press <b>Start again</b> and watch one copper ion dock, take two electrons and turn into a copper atom. Then switch the strip to silver.</p>`,
  terms: [
    { t: 'Oxidation', d: 'Losing electrons. The zinc atom is oxidised to a zinc ion.' },
    { t: 'Reduction', d: 'Gaining electrons. The copper ion is reduced to a copper atom.' },
    { t: 'Redox reaction', d: 'A reaction in which electrons move from one substance to another. Oxidation and reduction always come together.' },
    { t: 'Ion', d: 'An atom or group of atoms with an electric charge, because it has lost or gained electrons.' },
    { t: 'Reducing agent', d: 'The substance that gives electrons away (and is itself oxidised). Here: zinc.' },
    { t: 'Oxidising agent', d: 'The substance that takes electrons (and is itself reduced). Here: the copper ions.' },
    { t: 'Spectator ion', d: 'An ion that is present but does not change, like the sulphate ions here.' },
  ],
  defaults: { strip: 'zn', speed: 1, spect: true },
  controls: [
    { key: 'strip', type: 'seg', label: 'Metal strip, in copper sulphate', options: [{ v: 'zn', label: 'Zinc' }, { v: 'fe', label: 'Iron' }, { v: 'mg', label: 'Magnesium' }, { v: 'ag', label: 'Silver' }] },
    { key: 'speed', type: 'range', label: 'Speed', min: 0, max: 4, step: 0.1, ends: ['paused', '4×'], fmt: (v) => (v ? v.toFixed(1) + '×' : 'paused') },
    { key: 'spect', type: 'toggle', label: 'Show the sulphate ions (spectators)' },
    { key: 'go', type: 'buttons', label: 'Time', items: [{ label: 'Start again', act: (s, inst) => inst.restart?.() }, { label: 'Jump to the end', act: (s, inst) => inst.finish?.() }] },
  ],
  quiz: [
    { q: 'A zinc atom becomes Zn²⁺. What has happened to it?', options: ['It gained two electrons: reduction', 'It lost two electrons: oxidation', 'It gained two protons', 'Nothing, it only dissolved'], answer: 1, why: 'A 2+ charge means two electrons have left. Loss of electrons is oxidation: OIL RIG.' },
    { q: 'In the beaker, 500 electrons have left zinc atoms. How many electrons have copper ions gained?', options: ['250', '1,000', '500', 'It depends on the temperature'], answer: 2, why: 'Electrons are not made or destroyed in a reaction. Every electron lost by zinc was gained by copper, so the two counts are always equal.' },
    { q: 'A silver strip is put in copper sulphate solution. What happens?', options: ['Copper coats the silver', 'The silver dissolves quickly', 'Nothing: silver holds its electrons more tightly than copper', 'The solution turns red'], answer: 2, why: 'A metal only pushes out a metal that sits below it in the reactivity series. Silver is below copper, so it cannot give electrons to copper ions.' },
  ],
  reel: [
    { ms: 6200, caption: 'Dip zinc in blue copper sulphate. Each zinc atom hands two electrons to a copper ion: oxidation is loss, reduction is gain.', set: { strip: 'zn', speed: 2.6, spect: true }, act: (s, inst) => inst.restart?.(), view: REEL_VIEW, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const G = new THREE.Group(); root.add(G);
    const rnd = rng(7);
    // ---------------------------------------------------------------- the picture
    const water = box(4.0, 3.75, 1.7, M.clear(0x2f8fe0, 0.13)); water.position.set(0.6, 2.2, -0.2); water.castShadow = false; G.add(water);
    const NA = COLS * ROWS * 2;
    const atoms = dots(NA, 0.21, 0xffffff, 18, true); G.add(atoms);
    const site = (c, r, l) => [XS - (COLS - 1 - c) * D, Y0 + r * D, -l * D];
    const cu = dots(N, 0.21, 0xffffff, 18, true), so4 = dots(N, 0.19, HEX.so4, 14, true), el = dots(2 * N, 0.07, HEX.e, 10); G.add(cu, so4, el);
    const sPlus = signs(2 * N, '2+', 0.2), sMinus = signs(N, '2−', 0.19, '#3a2f00'), sE = signs(2 * N, 'e⁻', 0.2, COL.e); G.add(sPlus, sMinus, sE);
    const home = () => [-0.75 + rnd() * 2.9, 0.8 + rnd() * 2.9, -0.55 + rnd() * 0.9];
    const mk = () => ({ h: home(), p: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], w: [0.5 + rnd() * 0.5, 0.4 + rnd() * 0.5, 0.3 + rnd() * 0.4] });
    const CU = Array.from({ length: N }, mk), ZN = Array.from({ length: N }, mk), SO = Array.from({ length: N }, mk);
    const wander = (q, t, A = 0.32) => [q.h[0] + A * Math.sin(q.w[0] * t + q.p[0]), q.h[1] + A * Math.sin(q.w[1] * t + q.p[1]), q.h[2] + 0.2 * Math.sin(q.w[2] * t + q.p[2])];
    const tStrip = tag('zinc strip', 0.3), tSol = tag('copper sulphate solution', 0.3, '#9fd0ff'); G.add(tStrip, tSol);
    tStrip.position.set(XS - 0.75, 4.3, 0); tSol.position.set(0.9, 4.3, 0);
    const lCu = stage.label('Cu²⁺: a copper ion, two electrons short', [0, 0, 0], G), lSo = stage.label('SO₄²⁻: a spectator', [0, 0, 0], G), lEv = stage.label('', [0, 0, 0], G, 'hot');
    lEv.element.style.setProperty('--c', COL.e);

    // ---------------------------------------------------------------- the beaker you would see
    const Bk = new THREE.Group(); Bk.position.set(4.3, 0, 0.9); Bk.scale.setScalar(0.72); root.add(Bk);
    const bk = beaker(0.72, 1.7, 0.78); Bk.add(bk);
    const stripMat = M.metal(0xaab4c0, { roughness: 0.45 }), coatMat = new THREE.MeshStandardMaterial({ color: 0x8a4a22, roughness: 0.9, transparent: true, opacity: 0 });
    const st = box(0.34, 2.1, 0.05, stripMat); st.position.set(0, 1.2, 0); Bk.add(st);
    const coat = box(0.37, 1.18, 0.08, coatMat); coat.position.set(0, 0.74, 0); coat.castShadow = false; Bk.add(coat);
    const lBk = stage.label('what you see', [0, 2.6, 0], Bk);

    // ---------------------------------------------------------------- board
    let S = null, simT = 0, bkey = '';
    const bd = board(root, 3.4, 2.38, 640, 448, (g, w, h) => {
      panelBg(g, w, h); if (!S) return;
      const R = displace(S.strip, 'cu'), a = R.a, done = R.goes ? doneAt(simT) : 0;
      title(g, 'Electron ledger');
      // two bars that must match
      const y0 = 300, hh = 190, bw = 92;
      [[`lost by ${a.sym}`, COL.ox, 40], ['gained by Cu²⁺', COL.red, 160]].forEach(([lab, col, x]) => {
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.strokeRect(x, y0 - hh, bw, hh);
        g.fillStyle = col; g.fillRect(x, y0 - (hh * done) / N, bw, (hh * done) / N);
        text(g, String(2 * done), x + bw / 2, y0 - (hh * done) / N - 10, col, 'bold 30px sans-serif', 'center');
        text(g, lab, x + bw / 2, y0 + 28, COL.soft, '19px sans-serif', 'center');
      });
      text(g, 'electrons', 146, y0 + 54, COL.dim, '19px sans-serif', 'center');
      // ions in the water against time
      const { X, Y } = axes(g, w, h, { x0: 330, x1: 610, y0: 300, y1: 110, xMax: T_END, yMax: N, xTicks: [], yTicks: [0, 6, 12], yLabel: 'ions in the water' });
      if (R.goes) {
        const cuPts = [], znPts = [];
        for (let t = 0; t <= Math.min(simT, T_END); t += 0.1) { const d = doneAt(t); cuPts.push([t, N - d]); znPts.push([t, d]); }
        line(g, cuPts, X, Y, '#4aa3ff', 4); line(g, znPts, X, Y, '#dfe6f0', 4);
      } else line(g, [[0, N], [T_END, N]], X, Y, '#4aa3ff', 4);
      text(g, 'Cu²⁺', 540, 136, '#4aa3ff', 'bold 21px sans-serif'); if (R.goes) text(g, a.ion, 540, 286, '#dfe6f0', 'bold 21px sans-serif');
      text(g, 'time →', 540, 328, COL.dim, '19px sans-serif');
      text(g, R.goes ? `${a.sym} → ${a.ion} + 2 e⁻   (oxidation)` : `${a.name} holds its electrons tighter than copper`, 20, 388, R.goes ? COL.ox : COL.bad, '22px sans-serif');
      text(g, R.goes ? 'Cu²⁺ + 2 e⁻ → Cu   (reduction)' : 'no electrons move: no reaction', 20, 424, R.goes ? COL.red : COL.bad, '22px sans-serif');
    }, [4.45, 3.3, 0]);

    const tmp = new THREE.Color(), blue = new THREE.Color(0x2f8fe0), pale = new THREE.Color();
    let lastStrip = '';
    const api = {
      restart() { simT = 0; },
      finish() { simT = T_END; },
      update(dt, s) {
        dt = Math.max(0, dt); S = s;
        if (s.strip !== lastStrip) { lastStrip = s.strip; simT = 0; }
        const R = displace(s.strip, 'cu'), a = R.a, goes = R.goes;
        simT = Math.min(simT + dt * s.speed, T_END + 200);
        const narrow = fitNarrow(stage, [lCu, lSo, lBk]);
        placeBoard(bd, [[4.6, 3.45, 0], -0.25, 1.1]);
        placeModel(G, { rx: 0.25, ry: 0.55, rs: 1.15, px: -0.1 });
        Bk.visible = !inReel() && !narrow; lBk.visible = Bk.visible;
        const done = goes ? doneAt(simT) : 0, f = done / N;
        // lattice: every atom of the strip, except the surface ones that have left
        const left = new Map();
        if (goes) ORDER.forEach(([r, l], k) => left.set(r + '|' + l, k));
        let i = 0;
        for (let l = 0; l < 2; l++) for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++, i++) {
          const k = c === COLS - 1 ? left.get(r + '|' + l) : undefined;
          if (k === undefined) { const p = site(c, r, l); atoms.place(i, p[0], p[1], p[2], 1); atoms.tint(i, a.metal); continue; }
          const tau = simT - k * GAP, S0 = site(c, r, l);
          if (tau < 2.0) { atoms.place(i, S0[0], S0[1], S0[2], 1); atoms.tint(i, a.metal); sPlus.hide(N + k); continue; }
          const u = smooth((tau - 2.0) / 1.4), W = wander(ZN[k], simT), x = lerp(S0[0], W[0], u), y = lerp(S0[1], W[1], u), z = lerp(S0[2], W[2], u) + 0.7 * Math.sin(Math.PI * u);
          atoms.place(i, x, y, z, 0.74); atoms.tint(i, ION[s.strip]); sPlus.place(N + k, x, y, z + 0.2);
        }
        atoms.done();
        // copper: ions wandering, docking, taking two electrons, then sitting in the strip as atoms
        let ev = null;
        for (let k = 0; k < N; k++) {
          const W = wander(CU[k], simT), [r, l] = ORDER[k], S0 = site(COLS - 1, r, l), Dk = [S0[0] + D, S0[1], S0[2]], tau = goes ? simT - k * GAP : -1;
          let p = W, ion = true;
          if (tau >= 0 && tau < 1.2) { const u = smooth(tau / 1.2); p = [lerp(W[0], Dk[0], u), lerp(W[1], Dk[1], u), lerp(W[2], Dk[2], u)]; }
          else if (tau >= 1.2 && tau < 2.4) { p = Dk; ion = tau < 2.0; }
          else if (tau >= 2.4) { const u = smooth((tau - 2.4) / 0.8); p = [lerp(Dk[0], S0[0], u), Dk[1], Dk[2]]; ion = false; }
          cu.place(k, p[0], p[1], p[2], ion ? 0.74 : 1); cu.tint(k, ion ? 0x2f8fe0 : 0xc87533);
          if (ion) sPlus.place(k, p[0], p[1], p[2] + 0.2); else sPlus.hide(k);
          for (let j = 0; j < 2; j++) {
            if (tau >= 1.2 && tau < 2.0) { const u = clamp((tau - 1.2 - j * 0.15) / 0.6, 0, 1), y = S0[1] + (j ? -0.1 : 0.1) + 0.12 * Math.sin(Math.PI * u) * (j ? -1 : 1); el.place(2 * k + j, lerp(S0[0], Dk[0], u), y, S0[2] + 0.3); sE.place(2 * k + j, lerp(S0[0], Dk[0], u), y + (j ? -0.2 : 0.2), S0[2] + 0.35); ev = Dk; }
            else { el.hide(2 * k + j); sE.hide(2 * k + j); }
          }
        }
        cu.done(); el.done();
        for (let k = 0; k < N; k++) {
          if (!s.spect) { so4.hide(k); sMinus.hide(k); continue; }
          const p = wander(SO[k], simT * 0.8); so4.place(k, p[0], p[1], p[2] - 0.25, 1); sMinus.place(k, p[0], p[1], p[2] - 0.05);
        }
        so4.done();
        // colours: the blue fades as copper ions leave the water
        pale.setHex(a.tint ?? 0xcfe2f0); tmp.copy(blue).lerp(pale, f);
        water.material.color.copy(tmp); water.material.opacity = lerp(0.14, a.tint ? 0.1 : 0.05, f);
        bk.setTint(tmp.getHex(), lerp(0.55, a.tint ? 0.35 : 0.14, f));
        stripMat.color.setHex(a.metal); coatMat.opacity = Math.min(1, f * 1.6);
        tStrip.set(`${a.name} strip`);
        lCu.position.set(...wander(CU[N - 1], simT)).y += 0.36; lSo.position.set(...wander(SO[0], simT * 0.8)).y -= 0.36; lSo.visible = lSo.visible && s.spect;
        lEv.visible = !!ev; if (ev) { lEv.position.set(ev[0] + 0.5, ev[1] + 0.5, 0.4); lEv.element.textContent = `2 electrons hop: ${a.sym} to Cu²⁺`; }
        const key = `${s.strip}|${Math.round(Math.min(simT, T_END + 1) * 5)}`;
        if (key !== bkey) { bkey = key; bd.redraw(); }
      },
      readout: (s) => {
        const R = displace(s.strip, 'cu'), a = R.a, done = R.goes ? doneAt(simT) : 0, f = done / N, cuC = couple('cu');
        if (!R.goes) return fit(`<div class="big">No reaction</div>
          <div class="row"><span>Electrons moved</span><b>0</b></div>
          <div class="row"><span>E°cell = E°(Cu) − E°(${a.sym})</span><b class="no">${(cuC.E - a.E).toFixed(2).replace('-', '−')} V: will not go</b></div>
          <div class="row x"><span>In the water</span><b>${N} Cu²⁺, ${N} SO₄²⁻</b></div>
          <small>Silver holds its electrons more tightly than copper, so it cannot hand any to the copper ions. Turn it round (copper in silver nitrate) and it does go: see the next chapter.</small>`);
        return fit(`<div class="big">${2 * done} electrons lost = ${2 * done} gained</div>
          <div class="row"><span>Oxidation: ${R.ox}</span><b>${done} atoms</b></div>
          <div class="row"><span>Reduction: ${R.red}</span><b>${done} ions</b></div>
          <div class="row"><span>In the water</span><b>${N - done} Cu²⁺ + ${done} ${a.ion} · ${N} SO₄²⁻</b></div>
          <div class="row x"><span>Charge in the water</span><b>+${2 * N} and −${2 * N}: balanced</b></div>
          <div class="row"><span>E°cell = ${cuC.E.toFixed(2)} − ${par(a.E)}</span><b>${uv(R.E)}</b></div>
          <div class="row x"><span>Energy released (−ΔG° = nFE°)</span><b>${num(-R.dG)} kJ per mole</b></div>
          <div class="row x"><span>In 100 mL of 0.1 mol/L so far</span><b>${mass(f * MOL * a.M)} ${a.sym} gone, ${mass(f * MOL * cuC.M)} Cu made</b></div>
          <small>12 of the beaker's 6 × 10²¹ copper ions are drawn. The speed is a time-lapse: voltages say which way, not how fast.</small>`);
      },
    };
    return api;
  },
};
