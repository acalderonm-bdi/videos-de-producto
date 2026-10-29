// Video de lanzamiento / evento: escenas genéricas armadas desde LINEA (la escribe linea.py desde specs.json).
// Requiere marca.jsx, lib.jsx (K), obj.jsx (O), capas/piezas.jsx (PIEZAS) y linea.jsx (LINEA).
// Cada escena tiene k = tipo: palabra | numero | logo | tarjetas | fila | toma | cierre.
// Reglas de legibilidad (aprendidas a la mala): una tarjeta con datos se ve casi de frente (ry ≤ 6°) y ocupa el
// 65–80 % del ancho; apertura ≤ 16 en todo lo que tenga texto; la cámara nunca más cerca de ~1450 u de una toma.
var L = {};
L.col = function (n) { return n ? (O.C[n] || MARCA.C[n]) : O.C.blanco; };

L.titulo = function (c, str, o) {   // texto 2D con tracking, entra por palabras
    var l = K.text(c, str, { size: o.size || 34, color: o.color || O.C.blanco, font: o.font || MARCA.FONT.semi, tracking: o.track === undefined ? 300 : o.track, pos: [o.pos[0], o.pos[1]] });
    K.reveal(l, o.t || 0, { dur: 0.6, by: "words", dy: 14, blur: 10 });
    return l;
};

// Cámara fija de frente con un empuje lento (para palabras y números)
L.cam0 = function (c, d, z) {
    z = z === undefined ? 300 : z;
    O.cam(c, [{ t: 0, pos: O.p(0, 0, -2667 + z), poi: O.p(0, 0, z) }, { t: d, pos: O.p(0, 0, -2450 + z), poi: O.p(0, 0, z) }], { ap: 12 });
};

// Cámara que encuadra una pieza de frente al `fr` del ancho (0.65–0.8) con un empuje leve
L.frente = function (pieza, s, d, fr) {
    var w = O.info(pieza).w * s / 100, dist = Math.max(1450, O.ZOOM * w / (O.W * (fr || 0.72)));
    return [{ t: 0, pos: O.p(-40, -20, -dist * 1.08), poi: O.p(0, 0, 0) }, { t: d, pos: O.p(30, -10, -dist), poi: O.p(0, 0, 0) }];
};

// Tarjeta que entra (escala + opacidad) y opcionalmente sale. o: {pos, s, t, d, out, sweep}
L.card = function (c, pieza, o) {
    var l = O.piece(c, pieza, { pos: o.pos, s: o.s, ry: o.ry || 3, sweep: o.sweep, shadow: o.shadow });
    var t = o.t || 0;
    O.anim(l, { t: [t, t + (o.d || 0.7)], s: [o.s * 0.85, o.s], op: [0, 100] }, 85);
    if (o.out) K.keys(l.property("ADBE Transform Group").property("ADBE Opacity"), [[o.out, 100], [o.out + 0.3, 0]], 0);
    return l;
};

L.K = {};

// palabra · una palabra/cifra gigante con subtítulo. e: {txt, c, sub, subc}
L.K.palabra = function (c, e) {
    var y = e.sub ? -40 : 0;
    var w = O.word(c, e.txt, { pos: O.p(0, y, 300), t: e.off, size: 360, color: L.col(e.c), maxW: O.L(1500, 980) });
    O.halo(w);
    if (e.sub) L.titulo(c, e.sub, { pos: [O.W / 2, O.H / 2 + O.L(200, 260)], t: e.off + 0.9, size: 30, color: L.col(e.subc || "gris"), track: 380 });
    L.cam0(c, e.dur);
};

// numero · una cifra que cuenta de 0 al valor. e: {n, pre, suf, sub, c}
L.K.numero = function (c, e) {
    var l = K.text(c, (e.pre || "") + "0" + (e.suf || ""), { size: O.L(420, 300), font: O.FONT, color: L.col(e.c || "alerta"), pos: [O.W / 2, O.H / 2 + 60] });
    var src = l.property("ADBE Text Properties").property("ADBE Text Document"), cuenta = Math.max(1.2, (e.dv || 2) * 0.6);
    src.expression = "var k=Math.min(1,Math.max(0,(time-" + e.off + ")/" + cuenta + ")); k=1-Math.pow(1-k,3); '" + (e.pre || "") + "'+Math.round(" + e.n + "*k).toLocaleString('es-MX')+'" + (e.suf || "") + "'";
    K.reveal(l, e.off, { dur: 0.5, dy: 30, blur: 20 });
    if (e.sub) L.titulo(c, e.sub, { pos: [O.W / 2, O.H / 2 + O.L(230, 260)], t: e.off + 0.35, size: 34, track: 420 });
    L.cam0(c, e.dur, 0);
};

// logo · aparece la marca (después del problema, «la revelación»)
L.K.logo = function (c, e) {
    var lg = c.layers.add(O.item(MARCA.LOGO)); lg.name = "logo";
    var esc = O.L(320, 360) / lg.source.width * 100;
    K.P(lg, "pos").setValue([O.W / 2, O.H / 2 - 60]);
    K.keys(K.P(lg, "scale"), [[0.2, [esc * 0.6, esc * 0.6]], [1.1, [esc, esc]], [e.dur, [esc * 1.06, esc * 1.06]]], 85);
    K.keys(K.P(lg, "op"), [[0.2, 0], [0.5, 100]], 0);
    var n = K.text(c, MARCA.NOMBRE.toUpperCase(), { size: 60, font: O.FONT, color: O.C.blanco, tracking: 260, pos: [O.W / 2, O.H / 2 + 200] });
    K.reveal(n, 0.8, { dur: 0.6, dy: 20, blur: 20 });
    L.cam0(c, e.dur, 0);
};

// tarjetas · una o varias piezas en secuencia, de frente, con una palabra de fondo opcional. e: {cards:[[pieza, t]], fondo, s}
// (sin s, la primera pieza mide 1150 u de ancho)
L.K.tarjetas = function (c, e) {
    var d = e.dur, cp = O.p(0, 0, 0), n = e.cards, ancho = function (k) { return e.s || O.L(1150, 900) / O.info(n[k][0]).w * 100; };
    if (e.fondo) O.word(c, e.fondo, { pos: O.p(-380, -300, 1700), t: 0.1, size: 520, color: [0.13, 0.12, 0.13], drift: [d, 108] });
    for (var i = 0; i < n.length; i++) {
        var t0 = n[i][1], t1 = i + 1 < n.length ? n[i + 1][1] - 0.3 : null;
        L.card(c, n[i][0], { pos: cp, s: ancho(i), t: t0, d: 0.7, out: t1, sweep: [t0 + 1.0, t0 + 2.6] });
    }
    O.cam(c, L.frente(n[0][0], ancho(0), d, 0.72), { ap: 12 });
};

// fila · tres piezas lado a lado, de frente y sin encimarse. e: {cards:[[pieza, t] ×3]}
L.K.fila = function (c, e) {
    var d = e.dur, n = e.cards, P = O.V ? [O.p(0, -560, 0), O.p(0, 0, 0), O.p(0, 560, 0)] : [O.p(-600, 0, 0), O.p(0, 0, 0), O.p(600, 0, 0)];
    for (var i = 0; i < 3; i++) L.card(c, n[i][0], { pos: P[i], s: e.s || O.L(480, 820) / O.info(n[i][0]).w * 100, t: n[i][1], d: 0.6, sweep: [n[i][1] + 0.6, n[i][1] + 1.8] });
    O.cam(c, [{ t: 0, pos: O.p(0, -30, -2900), poi: O.p(0, 0, 0) }, { t: d, pos: O.p(0, -20, -2700), poi: O.p(0, 0, 0) }], { ap: 16 });
};

// toma · la grabación real de la app como plano casi frontal, con una palabra arriba (z negativo = delante del plano).
// e: {toma (sin .mp4), desde (s dentro de la toma), vel (1 = tiempo real), txt}
L.K.toma = function (c, e) {
    var d = e.dur, p = app.project, f = null, name = e.toma + ".mp4";
    for (var i = 1; i <= p.numItems; i++) if (p.item(i).name === name && !(p.item(i) instanceof CompItem)) f = p.item(i);
    if (!f) f = p.importFile(new ImportOptions(new File(VIDEO_ROOT + "tomas/" + name)));
    var v = c.layers.add(f); v.threeDLayer = true; v.name = "toma";
    v.timeRemapEnabled = true;
    v.property("ADBE Time Remapping").expression = "Math.min(" + (e.desde || 0) + " + time*" + (e.vel || 1) + ", " + (f.duration - 0.05).toFixed(3) + ")";
    v.startTime = 0; v.outPoint = c.duration;
    var s = O.L(1200, 900) / f.width * 100;   // el plano completo dentro del cuadro, con aire para la palabra
    K.P(v, "scale").setValue([s, s, s]); K.P(v, "pos").setValue(O.p(0, O.L(130, 160), 0));
    K.keys(K.P(v, "ry"), [[0, -5], [d, 3]], 0);
    var ds = v.Effects.addProperty("Drop Shadow");
    try { ds.property("Opacity").setValue(70); ds.property("Distance").setValue(50); ds.property("Softness").setValue(140); } catch (er) {}
    if (e.txt) { var w = O.word(c, e.txt, { pos: O.p(0, O.L(-360, -600), -100), t: e.off, size: O.L(110, 100), maxW: O.L(1700, 1000), track: -20 }); O.halo(w); }
    O.cam(c, [{ t: 0, pos: O.p(0, 0, -2667), poi: O.p(0, 0, 0) }, { t: d, pos: O.p(0, 0, -2450), poi: O.p(0, 0, 0) }], { ap: 10 });
};

// cierre · marca + frase + lema + llamada a la acción, y fundido a negro. e: {txt}
L.K.cierre = function (c, e) {
    var d = e.dur;
    var lg = c.layers.add(O.item(MARCA.LOGO)); var esc = O.L(220, 260) / lg.source.width * 100;
    K.P(lg, "pos").setValue([O.W / 2, O.H / 2 - O.L(180, 300)]);
    K.keys(K.P(lg, "scale"), [[0.3, [esc * 0.75, esc * 0.75]], [1.1, [esc, esc]]], 85); K.keys(K.P(lg, "op"), [[0.3, 0], [0.6, 100]], 0);
    var frase = e.txt ? e.txt.replace("\n", O.V ? "\n" : " ") : MARCA.LEMA;
    L.titulo(c, frase, { pos: [O.W / 2, O.H / 2 + O.L(130, 60)], t: 1.1, size: O.L(74, 64), font: MARCA.FONT.reg, track: 0 });
    if (e.txt) L.titulo(c, MARCA.LEMA, { pos: [O.W / 2, O.H / 2 + O.L(225, 240)], t: 1.8, size: 40, color: O.C.gris, font: MARCA.FONT.reg, track: 0 });
    L.titulo(c, MARCA.CTA.toUpperCase(), { pos: [O.W / 2, O.H / 2 + O.L(340, 380)], t: 2.6, size: 34, color: O.C.claro, track: 300 });
    var blk = c.layers.addSolid([0, 0, 0], "negro", O.W, O.H, 1);
    K.keys(K.P(blk, "op"), [[d - 1.0, 0], [d, 100]], 0);
    L.cam0(c, d);
};

// Maestro: todas las escenas de LINEA en orden, cortes secos, acabado arriba
L.master = function (nombre) {
    var m = app.project.items.addComp(nombre + O.SUF, O.W, O.H, 1, LINEA.total, 30); m.bgColor = O.C.bg;
    for (var i = 0; i < LINEA.escenas.length; i++) {
        var e = LINEA.escenas[i];
        var c = O.scene(e.name, e.dur, e.k === "tarjetas" || e.k === "fila" || e.k === "toma");
        L.K[e.k](c, e);
        var l = m.layers.add(c); l.startTime = e.t0; l.outPoint = e.t0 + e.dur;
    }
    var adj = m.layers.addSolid([1, 1, 1], "acabado", O.W, O.H, 1); adj.adjustmentLayer = true;
    try { var v = adj.Effects.addProperty("CC Vignette"); v.property(1).setValue(40); } catch (er) {}
    try { var nz = adj.Effects.addProperty("Noise"); nz.property(1).setValue(1.6); } catch (er) {}
    return m;
};
"escenas ok";
