// Chapter 4: rusting is a slow cell, and four ways to stop it. Then the Delhi iron pillar.
// "drop": a drop of water on steel (U. R. Evans's "drop experiment", 1920s). Under the middle of the
//   drop, where oxygen is scarce, iron is oxidised: Fe → Fe²⁺ + 2 e⁻ (E° −0.447 V). The electrons run
//   through the metal to the rim of the drop, where oxygen from the air is plentiful and is reduced:
//   O₂ + 2 H₂O + 4 e⁻ → 4 OH⁻ (E° +0.401 V). Each oxygen molecule on screen takes exactly the four
//   electrons that two iron atoms gave. Fe²⁺ and OH⁻ meet between the two and drop out as iron
//   hydroxide, which more oxygen turns into rust, FeO(OH) and Fe₂O₃·nH₂O (that last step is described
//   in the text, not animated). Driving voltage from the table: 0.401 − (−0.447) = 0.85 V.
//   Speeds are a time-lapse scaled (on a log scale) to the first-year loss of metal in ISO 9223:2012,
//   "Corrosion of metals and alloys: Corrosivity of atmospheres" (carbon steel / zinc, µm per year):
//     C1 ≤1.3 / ≤0.1   C2 1.3–25 / 0.1–0.7   C3 25–50 / 0.7–2.1   C4 50–80 / 2.1–4.2   C5 80–200 / 4.2–8.4
//   (values as tabulated by the galvanizing associations; the standard itself was not opened).
//   Zinc coat: 85 µm is the usual minimum average for hot-dip galvanized structural steel (ISO 1461).
//   Coat life = 85 µm ÷ zinc rate. With a scratch, zinc (E° −0.762 V) is the anode and the bare steel
//   the cathode: zinc gives the electrons, 0.31 V below iron. Zinc anode capacity from Faraday's law:
//   2 F ÷ 65.38 g/mol = 820 Ah per kg.
//   Stainless steel: at least 10.5% chromium, which forms a chromium oxide film a few nanometres
//   thick that re-forms when scratched; chlorides (sea salt) can still pit it.
// "pillar": the iron pillar at the Qutb complex, Delhi. Facts from R. Balasubramaniam, "On the
//   corrosion resistance of the Delhi iron pillar", Corrosion Science 42 (2000) 2103–2129, and his
//   "New insights on the 1600-year old corrosion resistant Delhi iron pillar", Indian Journal of
//   History of Science 36 (2001) 1–49: wrought iron made by forge-welding lumps of bloomery iron;
//   phosphorus about 0.25% (modern steel: under 0.05%), because no lime was used in smelting, so the
//   phosphorus stayed in the iron; slag particles trapped in the metal; a protective film of
//   amorphous "misawite", δ-FeOOH, next to the metal, with crystalline iron hydrogen phosphate hydrate
//   (FePO₄·H₃PO₄·4H₂O) forming over the centuries through cycles of wetting and drying; the film is
//   about one-twentieth of a millimetre (50 µm) thick after 1,600 years. Size: 7.21 m long, 1.12 m of
//   it below ground, about 42 cm across at the base tapering to about 30 cm; more than 6 tonnes.
//   The capital is drawn roughly. The layers in the magnifier are not to scale and the timing of the
//   stages is schematic: only the end state (about 50 µm) is a measured figure.
import { THREE, M, box, clamp, lerp, smooth } from '../kit.js';
import { couple, E_O2_OH, FARADAY, COL, HEX, board, panelBg, title, text, dots, signs, tag, num,
  focusSwitch, showLabels, fitNarrow, placeBoard, placeModel, autoView, fit, inReel, rng, REEL_VIEW } from '../redox.js';
import { par } from '../redox.js';

const FE = couple('fe'), ZN = couple('zn');
// ISO 9223 first-year corrosion, µm per year: [low, high]
export const ENV = [
  { id: 'c1', cat: 'C1', name: 'Dry indoors', steel: [0.2, 1.3], zinc: [0.02, 0.1], le: true },
  { id: 'c2', cat: 'C2', name: 'Clean country air', steel: [1.3, 25], zinc: [0.1, 0.7] },
  { id: 'c3', cat: 'C3', name: 'City or mild coast', steel: [25, 50], zinc: [0.7, 2.1] },
  { id: 'c4', cat: 'C4', name: 'Salty coast', steel: [50, 80], zinc: [2.1, 4.2] },
  { id: 'c5', cat: 'C5', name: 'Sea spray', steel: [80, 200], zinc: [4.2, 8.4] },
];
const env = (id) => ENV.find((e) => e.id === id);
const mid = ([a, b]) => Math.sqrt(a * b);
const rng2 = (r, e) => (e.le ? `under ${r[1]}` : `${r[0]} to ${r[1]}`);
const COAT = 85;                                            // µm of zinc
const ZN_AH_KG = (2 * FARADAY) / ZN.M / 3.6;                // 820 Ah per kg
const X0 = -0.3, YS = 1.6, PLW = 5.6;
const PILLAR = { L: 7.21, below: 1.12, d0: 0.42, d1: 0.30, P: 0.25, film: 50, age: 1600 };
const U = 0.5;                                              // scene units per metre in the pillar scene

export default {
  id: 'rust',
  short: 'Rust, and stopping it',
  title: 'Rust is a slow battery',
  subtitle: 'Iron, water and oxygen make a tiny cell. Break any link and the rusting stops.',
  get view() { return autoView(); },
  learn: `<p>Leave a steel nail in damp air and it turns to flaky brown <b>rust</b>. Rusting needs three things together: <b>iron</b>, <b>water</b> and <b>oxygen</b>. Take away any one and it stops. A nail in dry air, or in boiled water sealed under oil, stays bright.</p>
    <p>Look inside a single drop of water. In the middle, iron atoms give up electrons and dissolve: <b>Fe → Fe²⁺ + 2 e⁻</b>. That spot is an <b>anode</b>. The electrons run through the metal to the edge of the drop, where there is plenty of air. There, oxygen takes them: <b>O₂ + 2 H₂O + 4 e⁻ → 4 OH⁻</b>. That is the <b>cathode</b>. The steel is its own wire and the water is its own salt bridge. Rust is a cell that has been short-circuited.</p>
    <p><b>Why salt makes it worse.</b> Ions have to drift through the water to finish the circuit. Pure water has very few ions. Salty water has many, so the current flows easily. That is why a cycle or a car rusts faster in Mumbai, Chennai or Kochi than in dry Jaipur, and fastest of all where sea spray lands on it.</p>
    <p><b>Four ways to stop it.</b> <b>Paint</b> or oil keeps water and oxygen off the steel, until it is scratched. <b>Galvanising</b> coats the steel in <b>zinc</b>. Zinc is higher on the ladder than iron, so even at a scratch the zinc gives the electrons and the iron is left alone. The same trick protects ships, pipelines and geyser tanks: bolt on a block of zinc or magnesium, a <b>sacrificial anode</b>, and replace it when it is eaten away (see WaterHeaterClear). <b>Stainless steel</b> contains at least 10.5% <b>chromium</b>, which forms an invisible skin of chromium oxide that heals itself when scratched.</p>
    <p><b>The iron pillar of Delhi.</b> Near the Qutb Minar stands an iron pillar more than 7 metres long, made about 1,600 years ago. Its inscription names a king Chandra, generally identified as the Gupta emperor Chandragupta II. It has barely rusted. The reason is chemistry, worked out by the metallurgist <b>R. Balasubramaniam</b> of IIT Kanpur (<i>Corrosion Science</i>, 2000). The old ironmakers used no limestone, so their iron kept a lot of <b>phosphorus</b>, about 0.25%. Through centuries of wet and dry weather, the phosphorus helped a thin, tight layer to form on the surface: first a compact iron oxyhydroxide called <b>misawite</b>, then, right against the metal, crystals of <b>iron hydrogen phosphate</b>. That film is only about a twentieth of a millimetre thick, and it keeps water and oxygen away from the iron beneath.</p>
    <p class="tip"><b>Try it:</b> move the bare steel from dry indoors to sea spray and watch the electrons speed up. Then galvanise it, scratch it, and see which metal gives the electrons.</p>`,
  terms: [
    { t: 'Rust', d: 'Hydrated iron(III) oxide, FeO(OH) and Fe₂O₃·nH₂O: what iron becomes when water and oxygen oxidise it.' },
    { t: 'Corrosion', d: 'The slow oxidation of a metal by its surroundings. Rusting is the corrosion of iron.' },
    { t: 'Galvanising', d: 'Coating steel with zinc, usually by dipping it in molten zinc.' },
    { t: 'Sacrificial anode', d: 'A block of a more reactive metal, joined to steel, that is oxidised in its place.' },
    { t: 'Passive film', d: 'A very thin, tight oxide layer that seals a metal from air and water, as on stainless steel and aluminium.' },
    { t: 'Misawite', d: 'A compact, non-crystalline iron oxyhydroxide, δ-FeOOH, that forms the protective film on the Delhi iron pillar.' },
  ],
  defaults: { focus: 'drop', prot: 'bare', scratch: false, env: 'c3', iron: 'pillar', age: 1600 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'drop', label: 'A drop on steel' }, { v: 'pillar', label: 'Delhi iron pillar' }] },
    { key: 'env', type: 'seg', label: 'Where the steel lives', options: ENV.map((e) => ({ v: e.id, label: e.name })), fmt: (v) => `ISO 9223 ${env(v).cat}` },
    { key: 'prot', type: 'seg', label: 'Protection', options: [{ v: 'bare', label: 'Bare steel' }, { v: 'paint', label: 'Paint' }, { v: 'zinc', label: 'Zinc (galvanised)' }, { v: 'ss', label: 'Stainless steel' }] },
    { key: 'scratch', type: 'toggle', label: 'Scratch through the coating' },
    { key: 'iron', type: 'seg', label: 'Pillar: which iron', options: [{ v: 'pillar', label: 'The pillar’s iron' }, { v: 'mild', label: 'Modern mild steel' }] },
    { key: 'age', type: 'range', label: 'Pillar: years in the open', min: 0, max: 1600, step: 10, ends: ['new', '1,600 years'], fmt: (v) => (v ? `${Math.round(v)} years` : 'new') },
  ],
  onChange(s, key) {
    if (['env', 'prot', 'scratch'].includes(key)) s.focus = 'drop';
    if (key === 'iron' || key === 'age') s.focus = 'pillar';
  },
  quiz: [
    { q: 'In a rusting drop of water on steel, what takes the electrons that the iron gives up?', options: ['The water molecules’ hydrogen only', 'Oxygen from the air, at the edge of the drop', 'The rust', 'Nitrogen'], answer: 1, why: 'Oxygen is reduced at the rim of the drop: O₂ + 2 H₂O + 4 e⁻ → 4 OH⁻. With no oxygen there is nothing to take the electrons, and the iron does not rust.' },
    { q: 'A galvanised bucket gets a deep scratch that shows the steel. Why does the steel still not rust?', options: ['The scratch is too small for water', 'Zinc is more reactive than iron, so the zinc is oxidised in its place', 'Zinc is harder than steel', 'Steel never rusts in buckets'], answer: 1, why: 'Zinc sits above iron in the reactivity series. Joined to the steel, it becomes the anode and gives the electrons, and the steel is the protected cathode.' },
    { q: 'Why has the iron pillar of Delhi resisted rust for about 1,600 years?', options: ['It is made of stainless steel', 'Its phosphorus-rich iron grew a thin protective film in Delhi’s wet and dry weather', 'It is coated in gold', 'Nobody knows'], answer: 1, why: 'Published metallurgy (Balasubramaniam, 2000) found about 0.25% phosphorus in the iron and a compact film of misawite and iron phosphate about 0.05 mm thick that seals the surface.' },
  ],
  reel: [
    { ms: 5200, caption: 'Rust is a tiny battery: iron gives electrons in the middle of a drop, oxygen takes them at the edge.', set: { focus: 'drop', prot: 'bare', scratch: false, env: 'c5' }, view: REEL_VIEW, spin: 0 },
    { ms: 5000, caption: 'Coat the steel in zinc. Even at a scratch the zinc gives the electrons, and the iron is spared.', set: { focus: 'drop', prot: 'zinc', scratch: true, env: 'c5' }, view: REEL_VIEW, spin: 0 },
    { ms: 5200, caption: 'Delhi’s iron pillar: phosphorus-rich iron grew a film a twentieth of a millimetre thick in 1,600 years.', set: { focus: 'pillar', iron: 'pillar' }, anim: { age: [0, 1600] }, view: REEL_VIEW, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(41);
    // ================================================================ a drop on steel
    const Dr = new THREE.Group(); root.add(Dr);
    const plate = box(PLW, 0.7, 2.2, M.metal(FE.metal, { roughness: 0.5 })); plate.position.set(X0, YS - 0.35, 0); Dr.add(plate);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.6, metalness: 0.1 });
    const coats = [-1, 1].map(() => { const c = box(1, 0.12, 2.22, coatMat); c.castShadow = false; Dr.add(c); return c; });
    const dropM = new THREE.Mesh(new THREE.SphereGeometry(1.75, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.clear(0x6fb6e8, 0.3)); dropM.scale.set(1, 0.5, 0.6); dropM.castShadow = false; dropM.renderOrder = 3; Dr.add(dropM);
    const ions = dots(6, 0.1, 0xffffff, 12, true), el = dots(12, 0.07, HEX.e, 10), o2 = dots(12, 0.085, HEX.o2, 10, true), oh = dots(12, 0.075, HEX.oh, 10, true), rustD = dots(70, 0.09, HEX.rust, 8, true);
    Dr.add(ions, el, o2, oh, rustD);
    const sE = signs(12, 'e⁻', 0.2, COL.e), sI = signs(6, '2+', 0.18); Dr.add(sE, sI);
    const RU = Array.from({ length: 70 }, () => ({ dx: (rnd() - 0.5) * 0.5, z: (rnd() - 0.5) * 1.5, s: 0.6 + rnd() * 0.9 }));
    const air = Array.from({ length: 4 }, (_, i) => ({ x: X0 - 2.4 + i * 1.6 + rnd() * 0.4, y: YS + 1.5 + rnd() * 0.7, p: rnd() * 6.28 }));
    const tAn = tag('', 0.28, COL.ox), tCa = tag('', 0.28, COL.red), tTop = tag('', 0.32); Dr.add(tAn, tCa, tTop);
    const lE = stage.label('electrons run through the metal', [X0 + 1.7, YS - 0.4, 1.2], Dr), lW = stage.label('a drop of water', [X0 + 2.1, YS + 0.45, 0.6], Dr);
    const dropLabels = [lE, lW];
    let phi = 0, dkey = '', tScr = 0;

    // ================================================================ the Delhi iron pillar
    const Pl = new THREE.Group(); root.add(Pl);
    const GY = 0.75;                                                  // ground level
    const ground = box(3.2, GY, 2.2, M.matte(0x6d5a44)); ground.position.set(-1.9, GY / 2, -0.6); Pl.add(ground);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3b3431, roughness: 0.55, metalness: 0.6 });
    const H = (PILLAR.L - PILLAR.below) * U, r0 = (PILLAR.d0 / 2) * U, r1 = (PILLAR.d1 / 2) * U, capH = 1.0 * U, shaftH = H - capH;
    const prof = [[r0, -PILLAR.below * U], [r0, 0], [r1, shaftH], [r1 * 1.25, shaftH + 0.04], [r1 * 1.55, shaftH + 0.2], [r1 * 1.1, shaftH + 0.3], [r1 * 1.5, shaftH + 0.36], [r1 * 1.5, shaftH + 0.42], [r1 * 1.05, shaftH + 0.46], [r1 * 1.4, shaftH + 0.52], [r1 * 1.2, shaftH + 0.58], [0, capH + shaftH]];
    const pil = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40), ironMat); pil.position.set(-1.9, GY, 0.2); pil.castShadow = true; Pl.add(pil);
    const hole = box(0.5, PILLAR.below * U, 0.02, M.ghost(0x000000, 0.35)); hole.position.set(-1.9, GY - (PILLAR.below * U) / 2, 0.51); Pl.add(hole);
    const man = new THREE.Group(); man.position.set(-0.95, GY, 0.4); Pl.add(man);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * U * 1.6, 1.25 * U, 6, 12), M.matte(0x3b6fd8)); body.position.y = 0.78 * U; man.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * U * 1.3, 16, 12), M.matte(0xc68b64)); head.position.y = 1.58 * U; man.add(head);
    // the magnifier: a slice through the surface, metal at the left, air at the right (not to scale)
    const Mg = new THREE.Group(); Mg.position.set(0.95, 2.35, 0.2); Mg.scale.setScalar(0.95); Pl.add(Mg);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 10, 64), M.metal(0xc9a24a)); Mg.add(frame);
    const LAY = [
      { id: 'iron', c: 0x4a4744, name: 'iron' },
      { id: 'phos', c: 0x35b6a5, name: 'iron hydrogen phosphate crystals' },
      { id: 'mis', c: 0x7a4a2a, name: 'misawite, δ-FeOOH' },
      { id: 'rust', c: 0xc2662a, name: 'ordinary rust' },
    ].map((l) => { const m = box(1, 1.9, 0.5, new THREE.MeshStandardMaterial({ color: l.c, roughness: 0.8 })); m.castShadow = false; Mg.add(m); return { ...l, m }; });
    const slag = dots(14, 0.05, 0x8d99a8, 8, true); Mg.add(slag);
    const SL = Array.from({ length: 14 }, () => [-1.05 + rnd() * 0.75, -0.8 + rnd() * 1.6, 0.26]);
    const drops = dots(8, 0.06, 0x8fd0ff, 8); Mg.add(drops);
    const tM = tag('surface, magnified (not to scale)', 0.24, '#cfd6e4'); tM.position.set(0, -1.75, 0); Mg.add(tM);
    const tP = tag('Delhi iron pillar, c. 400 CE', 0.3, '#ffe08a'); tP.position.set(0.95, 4.02, 0.3); Pl.add(tP);
    const lH = stage.label('6.09 m above ground', [-1.6, GY + H * 0.62, 0.9], Pl), lMan = stage.label('1.7 m', [-0.95, GY + 1.3, 0.6], Pl);
    const lLay = LAY.map((l, i) => (i ? null : stage.label(l.name, [0, 0, 0], Mg))), lSlag = stage.label('slag specks', [-0.8, -1.1, 0.4], Mg);
    const pilLabels = [lH, lMan, lSlag, lLay[0]];

    // ================================================================ board
    let S = null, bkey = '';
    const bd = board(root, 3.4, 2.38, 640, 448, (g, w, h) => {
      panelBg(g, w, h); if (!S) return;
      if (S.focus === 'pillar') {
        title(g, 'Why it has not rusted away');
        const rows = [['Phosphorus in the iron', `${PILLAR.P}%`, 'modern steel: under 0.05%'], ['Protective film today', `${PILLAR.film} µm`, 'a twentieth of a millimetre'], ['Average growth', `${(PILLAR.film / PILLAR.age).toFixed(2)} µm a year`, 'city steel, year one: 25–50 µm']];
        rows.forEach(([a, b, c], i) => { const y = 88 + i * 66; text(g, a, 20, y, COL.soft, '20px sans-serif'); text(g, b, 20, y + 32, i === 0 ? '#35d6c2' : COL.hot, 'bold 28px sans-serif'); text(g, c, w - 20, y + 30, COL.dim, '19px sans-serif', 'right'); });
        text(g, 'In the magnifier, from the metal outwards:', 20, 296, COL.soft, '19px sans-serif');
        [['#35b6a5', 'iron phosphate'], ['#9a6038', 'misawite δ-FeOOH'], ['#c2662a', 'rust']].forEach(([c, n], i) => { const x = 20 + [0, 190, 430][i]; g.fillStyle = c; g.fillRect(x, 310, 22, 22); text(g, n, x + 30, 328, COL.text, '20px sans-serif'); });
        text(g, 'R. Balasubramaniam, Corrosion Science 42 (2000)', 20, 384, COL.text, '20px sans-serif');
        text(g, '"On the corrosion resistance of the Delhi iron pillar"', 20, 414, COL.soft, '19px sans-serif');
        return;
      }
      title(g, 'Metal lost in a year', 'ISO 9223, µm');
      const x0 = 150, x1 = w - 30, X = (v) => x0 + ((Math.log10(v) + 2) / 4.5) * (x1 - x0);
      [0.01, 0.1, 1, 10, 100].forEach((v) => { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(v), 70); g.lineTo(X(v), 380); g.stroke(); text(g, String(v), X(v), 404, COL.soft, '19px sans-serif', 'center'); });
      ENV.forEach((e, i) => {
        const y = 84 + i * 60, on = e.id === S.env;
        if (on) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(10, y - 8, w - 20, 54); }
        text(g, e.cat, 20, y + 16, on ? '#fff' : COL.soft, 'bold 22px sans-serif'); text(g, e.name, 20, y + 38, on ? COL.text : COL.dim, '15px sans-serif');
        g.globalAlpha = on ? 1 : 0.5;
        g.fillStyle = '#c2662a'; g.fillRect(X(e.steel[0]), y, Math.max(4, X(e.steel[1]) - X(e.steel[0])), 16);
        g.fillStyle = '#b8c2cc'; g.fillRect(X(e.zinc[0]), y + 22, Math.max(4, X(e.zinc[1]) - X(e.zinc[0])), 16);
        g.globalAlpha = 1;
      });
      text(g, '■ steel', 330, 436, '#e0803a', 'bold 20px sans-serif'); text(g, '■ zinc', 430, 436, '#b8c2cc', 'bold 20px sans-serif'); text(g, 'log scale', w - 20, 436, COL.dim, '18px sans-serif', 'right');
    }, [4.45, 2.7, 0]);

    const setFocus = focusSwitch(stage, { drop: Dr, pillar: Pl });
    // where things happen for each kind of protection: anode x, cathode x, meeting point (offsets from the centre, times ±1)
    const plan = (s) => {
      if (s.prot === 'bare') return { on: true, an: 0.1, ca: 1.5, meet: 0.8, metal: 'fe' };
      if (s.prot === 'paint') return s.scratch ? { on: true, an: 0.04, ca: 0.22, meet: 0.14, metal: 'fe', slow: 0.6 } : { on: false };
      if (s.prot === 'zinc') return s.scratch ? { on: true, an: 0.85, ca: 0.1, meet: 0.5, metal: 'zn' } : { on: true, an: 0.1, ca: 1.5, meet: 0.8, metal: 'zn' };
      return { on: false };
    };
    const rateOf = (s) => { const e = env(s.env), p = plan(s); if (!p.on) return 0; return mid(p.metal === 'zn' ? e.zinc : e.steel) * (p.slow || 1); };
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt); S = s;
        const isD = s.focus !== 'pillar';
        setFocus(isD ? 'drop' : 'pillar');
        const narrow = fitNarrow(stage, []);
        showLabels(dropLabels, isD && !narrow); showLabels(pilLabels, !isD && !narrow);
        placeBoard(bd);
        placeModel(Dr, { rx: 0.3, ry: 1.3, rs: 1.3 }); placeModel(Pl, { rx: 0.5, ry: 0.4, rs: 1.25 });

        if (isD) {
          const p = plan(s), k = `${s.prot}|${s.scratch}|${s.env}`;
          if (k !== dkey) { dkey = k; phi = 0; tScr = 0; }
          tScr += dt;
          const rate = rateOf(s), v = rate > 0 ? 0.1 + 0.2 * clamp((Math.log10(rate) + 1.3) / 3.4, 0, 1) * 2.4 : 0;
          phi += dt * v;
          // coating
          const tc = s.prot === 'bare' ? 0 : s.prot === 'ss' ? 0.05 : 0.12;
          let gap = s.prot !== 'bare' && s.scratch ? 0.5 : 0;
          if (s.prot === 'ss' && s.scratch) gap = 0.5 * (1 - smooth(clamp(((tScr % 6) - 1.2) / 2.5, 0, 1)));
          coatMat.color.setHex(s.prot === 'paint' ? 0x2f6fb5 : s.prot === 'zinc' ? 0xb8c2cc : 0x9fe8d2);
          coatMat.metalness = s.prot === 'paint' ? 0.05 : 0.8; coatMat.roughness = s.prot === 'paint' ? 0.6 : 0.35;
          plate.material.color.setHex(s.prot === 'ss' ? 0xc6ccd4 : FE.metal);
          coats.forEach((c, i) => { const sg = i ? 1 : -1, len = (PLW - gap) / 2; c.visible = tc > 0; c.scale.set(len, tc / 0.12, 1); c.position.set(X0 + sg * (gap / 2 + len / 2), YS + tc / 2, 0); });
          const yT = YS + tc; dropM.position.set(X0, yT, 0);
          const ySurf = gap > 0.05 || tc === 0 ? YS : yT;
          // the cycles
          const m = p.on ? couple(p.metal) : FE, ionCol = m.tint ?? 0xe8eef8, prodCol = p.on && p.metal === 'zn' ? 0xeef2f6 : HEX.rust;
          const K = Math.floor(phi);
          for (let j = 0; j < 3; j++) {
            const kc = K - j, u = phi - kc, live = p.on && kc >= 0 && u < 2, sg = kc % 2 ? 1 : -1;
            const ax = X0 + sg * p.an, cx = X0 + sg * p.ca, mx = X0 + sg * p.meet, slot = ((kc % 3) + 3) % 3, yA = p.metal === 'zn' ? yT : ySurf, yC = p.metal === 'zn' && s.scratch ? YS : yA;
            for (let q = 0; q < 2; q++) {
              const i = slot * 2 + q;
              if (!live || u >= 1.6) { ions.hide(i); sI.hide(i); continue; }
              const up = smooth(clamp(u / 0.4, 0, 1)), go = smooth(clamp((u - 0.4) / 1.2, 0, 1)), z = (q ? 0.25 : -0.05) + 0.4;
              const x = lerp(ax + (q ? 0.1 : -0.1), mx + (q ? 0.1 : -0.1), go), y = yA + 0.1 + up * 0.3 - go * 0.25;
              ions.place(i, x, y, z, 0.5 + 0.5 * up); ions.tint(i, ionCol); sI.place(i, x, y, z + 0.12);
            }
            for (let q = 0; q < 4; q++) {
              const i = slot * 4 + q, t = clamp((u - 0.1 - q * 0.06) / 0.62, 0, 1);
              if (!live || u < 0.1 || t >= 1) { el.hide(i); sE.hide(i); continue; }
              const x = lerp(ax, cx, t), y = Math.min(yA, yC) - 0.22 - 0.06 * q;
              el.place(i, x, y, 1.13); if (q === 0) sE.place(i, x, y - 0.2, 1.15); else sE.hide(i);
            }
            for (let q = 0; q < 2; q++) {                               // one O₂ molecule: two red atoms
              const i = slot * 4 + q, t = smooth(clamp(u / 0.9, 0, 1));
              if (!live || u >= 0.9) { o2.hide(i); continue; }
              o2.place(i, lerp(cx + sg * 0.9, cx, t) + (q ? 0.11 : -0.03), lerp(YS + 1.9, yC + 0.16, t), 0.5);
            }
            for (let q = 2; q < 4; q++) o2.hide(slot * 4 + q);
            for (let q = 0; q < 4; q++) {
              const i = slot * 4 + q, t = smooth(clamp((u - 0.9) / 0.7, 0, 1));
              if (!live || u < 0.9 || u >= 1.6) { oh.hide(i); continue; }
              oh.place(i, lerp(cx, mx, t) + (q - 1.5) * 0.07, yC + 0.14 + 0.1 * Math.sin(t * Math.PI) + (q % 2) * 0.08, 0.35 + (q - 1.5) * 0.12);
            }
          }
          ions.done(); el.done(); o2.done(); oh.done();
          // oxygen waiting in the air when nothing is happening
          if (!p.on) air.forEach((a, i) => { const y = a.y + 0.15 * Math.sin(time * 1.3 + a.p); o2.place(i * 2, a.x - 0.07, y, 0.4); o2.place(i * 2 + 1, a.x + 0.07, y, 0.4); o2.done(); });
          const made = p.on ? clamp(Math.floor(phi - 0.6), 0, 35) * 2 : 0;
          rustD.material.color.setHex(prodCol);
          RU.forEach((r, i) => { if (i >= made) return rustD.hide(i); const sg = i % 2 ? 1 : -1; rustD.place(i, X0 + sg * p.meet + r.dx * (p.meet > 0.3 ? 1 : 0.3), (p.meet > gap / 2 + 0.05 ? yT : YS) + 0.05 + (i > 30 ? 0.07 : 0), r.z * 0.7 + 0.2, r.s); });
          rustD.done();
          const an = p.on ? X0 + (p.metal === 'zn' && s.scratch ? 0.85 : 0) : X0;
          tAn.visible = tCa.visible = p.on;
          tAn.set(p.on ? `anode: ${m.sym} → ${m.ion} + 2 e⁻` : ''); tAn.position.set(an + (p.metal === 'zn' && s.scratch ? 1.0 : 0.3), yT + (p.metal === 'zn' && s.scratch ? 0.9 : 1.35), 0.5);
          tCa.set('cathode: O₂ takes 4 e⁻'); tCa.position.set(X0 - (p.metal === 'zn' && s.scratch ? 1.3 : 1.6), yT + (p.metal === 'zn' && s.scratch ? 1.45 : 0.85), 0.5);
          tTop.position.set(X0, inReel() ? YS + 2.6 : YS - 1.2, 0.6);
          tTop.set(s.prot === 'bare' ? 'bare steel: rusting' : s.prot === 'paint' ? (s.scratch ? 'paint, scratched: rust starts in the scratch' : 'paint keeps water and oxygen off') : s.prot === 'zinc' ? (s.scratch ? 'zinc gives the electrons: steel is spared' : 'zinc coat: weathers slowly') : s.scratch ? (gap > 0.05 ? 'stainless, scratched…' : '…the chromium oxide skin has healed') : 'stainless: sealed by chromium oxide',
            s.prot === 'bare' || (s.prot === 'paint' && s.scratch) ? '#ff8fa6' : '#5ce1a9');
        } else {
          const a = s.age, pillar = s.iron === 'pillar';
          // layer thicknesses in the magnifier (drawn, not measured): iron fills the rest
          const tr = pillar ? 0.32 * smooth(a / 40) * (1 - 0.35 * smooth((a - 40) / 400)) : 0.25 + 0.75 * smooth(a / 1600);
          const tm = pillar ? 0.3 * smooth((a - 3) / 300) : 0, tp = pillar ? 0.34 * smooth((a - 60) / 1540) : 0;
          const loss = pillar ? 0.1 * smooth(a / 200) : 0.2 + 0.6 * smooth(a / 1600);     // how far the metal face has retreated
          const face = 0.1 - loss;
          let x = face; const W = [0, tp, tm, tr];
          LAY.forEach((l, i) => {
            if (i === 0) { const w0 = face + 1.25; l.m.scale.x = Math.max(0.01, w0); l.m.position.x = -1.25 + w0 / 2; lLay[0].position.set(-0.75, 0.75, 0.4); return; }
            const wv = W[i]; l.m.visible = wv > 0.01; l.m.scale.x = Math.max(0.01, wv); l.m.position.x = x + wv / 2; x += wv;
          });
          LAY[3].m.material.color.setHex(pillar ? 0xc2662a : 0xa8501c);
          SL.forEach((q, i) => { if (pillar && q[0] < face - 0.05) slag.place(i, q[0], q[1], q[2]); else slag.hide(i); }); slag.done();
          lSlag.visible = lSlag.visible && pillar;
          // rain: stopped by the film on the pillar, soaking in on mild steel
          for (let i = 0; i < 8; i++) { const t = (time * 0.5 + i / 8) % 1, stop = pillar ? x - (a > 30 ? 0 : 0.2) : face + 0.05, xx = lerp(1.25, stop, Math.min(1, t * 1.4)); drops.place(i, xx, -0.75 + i * 0.21, 0.3, t * 1.4 > 1 ? (pillar && a > 30 ? 1.3 - (t * 1.4 - 1) * 2 : 0.6) : 1); } drops.done();
          ironMat.color.setHex(pillar ? 0x3b3431 : new THREE.Color(0x4a4744).lerp(new THREE.Color(0x8a3f16), smooth(a / 300)).getHex());
          tP.set(pillar ? 'Delhi iron pillar, c. 400 CE' : 'the same pillar in modern mild steel (imagined)', pillar ? '#ffe08a' : '#ff8fa6');
        }
        const kk = isD ? `d|${s.env}` : 'p';
        if (kk !== bkey) { bkey = kk; bd.redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'pillar') {
          if (s.iron === 'mild') return fit(`<div class="big">Mild steel: rust that never seals</div>
            <div class="row"><span>Phosphorus</span><b>under 0.05%</b></div>
            <div class="row"><span>Rust layer</span><b>porous and flaky: water gets through</b></div>
            <div class="row"><span>City air, first year (ISO 9223 C3)</span><b>25 to 50 µm lost</b></div>
            <small>An imagined comparison. Unprotected mild steel keeps rusting because its rust lets water and oxygen through. That is why modern steel is painted or galvanised.</small>`);
          return fit(`<div class="big">A film about 0.05 mm thick</div>
            <div class="row"><span>Made</span><b>c. 400 CE, forge-welded wrought iron</b></div>
            <div class="row"><span>Phosphorus in the iron</span><b>about ${PILLAR.P}%</b></div>
            <div class="row"><span>First, a compact film</span><b>misawite, δ-FeOOH</b></div>
            <div class="row"><span>Then, against the metal</span><b>FePO₄·H₃PO₄·4H₂O crystals</b></div>
            <div class="row x"><span>Size</span><b>${PILLAR.L} m long, over 6 tonnes</b></div>
            <div class="row x"><span>Average film growth</span><b>${PILLAR.film} µm ÷ ${num(PILLAR.age)} years = ${(PILLAR.film / PILLAR.age).toFixed(2)} µm a year</b></div>
            <small>From R. Balasubramaniam, Corrosion Science 42 (2000) 2103–2129. The layers are drawn far thicker than life, and the timing of the stages is schematic.</small>`);
        }
        const e = env(s.env), p = plan(s), done = p.on ? Math.max(0, Math.floor(phi + 0.1)) : 0;
        const ledger = `<div class="row"><span>Electrons lost = gained</span><b>${4 * done} = ${4 * done}</b></div>`;
        const where = `<div class="row"><span>Air: ${e.name} (${e.cat})</span><b>bare steel: ${rng2(e.steel, e)} µm a year</b></div>`;
        if (s.prot === 'bare') return fit(`<div class="big">Rusting: ${rng2(e.steel, e)} µm a year</div>
          <div class="row"><span>Anode (middle of the drop)</span><b>Fe → Fe²⁺ + 2 e⁻</b></div>
          <div class="row"><span>Cathode (edge of the drop)</span><b>O₂ + 2 H₂O + 4 e⁻ → 4 OH⁻</b></div>
          ${ledger}
          <div class="row"><span>Driving voltage, E°</span><b>${E_O2_OH.toFixed(2)} − ${par(FE.E)} = ${(E_O2_OH - FE.E).toFixed(2)} V</b></div>
          <div class="row x"><span>1 mm of steel, at the first-year rate</span><b>${num(1000 / e.steel[1], 2)} years or more</b></div>
          <small>First-year loss of bare carbon steel in ${e.name.toLowerCase()} air (ISO 9223 ${e.cat}). Rusting slows a little as the rust thickens. Salt in the water carries the ion current.</small>`);
        if (s.prot === 'paint') return fit(`<div class="big">${s.scratch ? 'Rust starts in the scratch' : 'Paint: no rusting'}</div>
          ${where}
          <div class="row"><span>Under sound paint</span><b>no water, no oxygen: no cell</b></div>
          ${s.scratch ? `<div class="row"><span>In the scratch</span><b>Fe → Fe²⁺ + 2 e⁻</b></div>${ledger}` : ''}
          <small>${s.scratch ? 'Rust takes up more room than the iron it came from, so it lifts the paint and creeps underneath. Touch up scratches early.' : 'Paint, oil, grease and plastic coatings all work the same way: they are barriers. They protect only while unbroken.'}</small>`);
        if (s.prot === 'zinc') return fit(`<div class="big">${s.scratch ? 'Zinc is the anode: steel spared' : 'Zinc coat: ' + rng2(e.zinc, e) + ' µm a year'}</div>
          <div class="row"><span>Zinc lost in ${e.name.toLowerCase()} air (${e.cat})</span><b>${rng2(e.zinc, e)} µm a year</b></div>
          <div class="row"><span>An ${COAT} µm coat lasts about</span><b>${e.le ? `over ${num(COAT / e.zinc[1], 2)}` : `${num(COAT / e.zinc[1], 2)} to ${num(COAT / e.zinc[0], 2)}`} years</b></div>
          ${s.scratch ? `<div class="row"><span>At the scratch</span><b>Zn → Zn²⁺ + 2 e⁻, iron untouched</b></div>${ledger}
          <div class="row"><span>Zinc is above iron by</span><b>${FE.E.toFixed(2).replace('-', '−')} − ${par(ZN.E)} = ${(FE.E - ZN.E).toFixed(2)} V</b></div>` : ledger}
          <div class="row x"><span>A zinc anode gives (2F ÷ M)</span><b>${num(ZN_AH_KG, 2)} Ah per kg</b></div>
          <small>Zinc protects twice: as a barrier, and by giving its own electrons wherever steel shows. Ships and pipelines use bolted-on zinc blocks the same way.</small>`);
        return fit(`<div class="big">Stainless: a skin that heals</div>
          ${where}
          <div class="row"><span>Chromium in the steel</span><b>at least 10.5%</b></div>
          <div class="row"><span>Skin</span><b>chromium oxide, a few nanometres thick</b></div>
          <div class="row"><span>${s.scratch ? 'Scratched' : 'Unscratched'}</span><b>${s.scratch ? 'the skin re-forms from the air' : 'sealed: no cell'}</b></div>
          <small>${['c4', 'c5'].includes(s.env) ? 'Not rust-proof: chloride from sea salt can break the skin and pit ordinary grades, so coastal railings need the molybdenum grade (316) and washing.' : 'Stainless is not rust-proof everywhere: chloride from salt can break the skin and cause pitting.'}</small>`);
      },
    };
  },
};
