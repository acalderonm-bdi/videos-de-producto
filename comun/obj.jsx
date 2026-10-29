// «Producto como objeto» (estilo keynote): la interfaz se desarma en capas 3D flotantes,
// macro sobre tarjetas y botones, profundidad de campo y una palabra gigante a la vez.
// Requiere marca.jsx, lib.jsx (K) y capas/piezas.jsx (PIEZAS, lo escribe piezas.py).
// Antes de cargar: O_ASPECTO = "H" (1920×1080) | "V" (1080×1920).
var O = {};
O.ROOT = VIDEO_ROOT;
O.V = (typeof O_ASPECTO !== "undefined" && O_ASPECTO === "V");
O.W = O.V ? 1080 : 1920; O.H = O.V ? 1920 : 1080;
O.SUF = O.V ? "_V" : "_H";
O.ZOOM = O.V ? 2600 : 2666.67;               // a z=0: H ve 1920 u de ancho, V ve ~1100 u
O.FONT = MARCA.FONT.display;
O.C = { bg: MARCA.C.bg, acento: MARCA.C.acento, claro: MARCA.C.neon, blanco: MARCA.C.white, gris: MARCA.C.gray, alerta: MARCA.C.alerta };
K.W = O.W; K.H = O.H;

O.L = function (h, v) { return O.V ? v : h; };
O.p = function (x, y, z) { return [O.W / 2 + x, O.H / 2 + y, z || 0]; };   // coordenadas desde el centro

O.item = function (file) {
    var p = app.project, name = file.split("/").pop();
    for (var i = 1; i <= p.numItems; i++) if (p.item(i).name === name && !(p.item(i) instanceof CompItem)) return p.item(i);
    return p.importFile(new ImportOptions(new File(O.ROOT + "capas/" + file)));
};

// Tamaño (px) y centro dentro de la pantalla completa de una pieza capturada por piezas.py
O.info = function (name) {
    if (typeof PIEZAS === "undefined" || !PIEZAS[name]) throw new Error("falta la pieza " + name + " en capas/piezas.jsx");
    return PIEZAS[name];
};

// Escena: fondo casi negro con un resplandor tenue del acento (2D, queda detrás de lo 3D)
O.scene = function (name, dur, glow) {
    name = name + O.SUF;
    K.drop([name]);
    var c = app.project.items.addComp(name, O.W, O.H, 1, dur + K.HANDLE, 30);
    c.bgColor = O.C.bg;
    c.layers.addSolid(O.C.bg, "fondo", O.W, O.H, 1);
    if (glow !== false) {
        var g = K.ellipse(c, "resplandor", { d: O.L(1300, 1200), color: O.C.acento, opacity: 16 });
        g.Effects.addProperty("Gaussian Blur").property(1).setValue(380);
        K.P(g, "pos").expression = "[" + O.W / 2 + " + Math.sin(time*0.3)*120, " + O.H * 0.62 + " + Math.cos(time*0.25)*60]";
    }
    return c;
};

// Cámara de dos nodos con profundidad de campo. keys: [{t, pos:[x,y,z], poi:[x,y,z], f:[x,y,z] (punto enfocado)}]
// o.ap = apertura: 90–150 cine, 40–70 macro suave, ≤16 cuando hay texto que se debe leer.
O.cam = function (c, keys, o) {
    o = o || {};
    var cam = c.layers.addCamera("cam", [O.W / 2, O.H / 2]);
    var co = cam.property("ADBE Camera Options Group");
    co.property("ADBE Camera Zoom").setValue(O.ZOOM);
    co.property("ADBE Camera Depth of Field").setValue(1);
    co.property("ADBE Camera Aperture").setValue(o.ap || 90);
    co.property("ADBE Camera Blur Level").setValue(o.blur || 120);
    var tp = cam.property("ADBE Transform Group");
    var P = tp.property("ADBE Position"), A = tp.property("ADBE Anchor Point"), Fd = co.property("ADBE Camera Focus Distance");
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        P.setValueAtTime(k.t, k.pos); A.setValueAtTime(k.t, k.poi);
        var f = k.f || k.poi, dx = f[0] - k.pos[0], dy = f[1] - k.pos[1], dz = f[2] - k.pos[2];
        Fd.setValueAtTime(k.t, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
    K.ease(P, o.inf || 70); K.ease(A, o.inf || 70); K.ease(Fd, o.inf || 70);
    // respiración de cámara en mano, muy leve
    P.expression = "value + [Math.sin(time*0.9)*6, Math.cos(time*0.7)*5, 0]";
    return cam;
};

// Pieza de la interfaz como capa 3D. o: {pos, s (escala %), rx, ry, rz, shadow, sweep:[t0,t1], parent}
O.piece = function (c, file, o) {
    var l = c.layers.add(O.item(file + ".png"));
    l.name = o.name || file; l.threeDLayer = true;
    if (o.parent) l.setParentWithJump(o.parent);   // sin compensar: hereda la transformación del plano
    var tr = l.property("ADBE Transform Group");
    tr.property("ADBE Position").setValue(o.pos || O.p(0, 0, 0));
    var s = o.s || 33.3; tr.property("ADBE Scale").setValue([s, s, s]);
    if (o.rx) tr.property("ADBE Rotate X").setValue(o.rx);
    if (o.ry) tr.property("ADBE Rotate Y").setValue(o.ry);
    if (o.rz) tr.property("ADBE Rotate Z").setValue(o.rz);
    if (o.shadow !== false) {
        var d = l.Effects.addProperty("Drop Shadow");
        try { d.property("Opacity").setValue(70); d.property("Distance").setValue(60); d.property("Softness").setValue(160); d.property("Direction").setValue(180); } catch (e) {}
    }
    if (o.sweep) O.sweep(l, o.sweep[0], o.sweep[1]);
    return l;
};

// Brillo que barre la tarjeta (luz de estudio)
O.sweep = function (l, t0, t1) {
    var e = l.Effects.addProperty("CC Light Sweep");
    try {
        e.property("Direction").setValue(-25); e.property("Width").setValue(260);
        e.property("Sweep Intensity").setValue(38); e.property("Edge Intensity").setValue(0);
        var src = l.source, w = src.width, h = src.height;
        K.keys(e.property("Center"), [[t0, [-0.3 * w, h / 2]], [t1, [1.3 * w, h / 2]]], 40);
    } catch (e2) {}
    return e;
};

// Anima propiedades 3D de una capa. k: {t:[...], pos:[[...]], rx:[..], ry:[..], rz:[..], op:[..], s:[..]} (null = sin clave)
O.anim = function (l, k, inf) {
    var tr = l.property("ADBE Transform Group"), m = { pos: "ADBE Position", rx: "ADBE Rotate X", ry: "ADBE Rotate Y", rz: "ADBE Rotate Z", op: "ADBE Opacity", s: "ADBE Scale" };
    for (var key in m) {
        if (!k[key]) continue;
        var pr = tr.property(m[key]);
        for (var i = 0; i < k.t.length; i++) {
            var v = k[key][i]; if (v === null || v === undefined) continue;
            if (key === "s") v = [v, v, v];
            pr.setValueAtTime(k.t[i], v);
        }
        K.ease(pr, inf || 75);
    }
};

// Flotación suave (se suma a lo animado)
O.float = function (l, amp, seed) {
    var tr = l.property("ADBE Transform Group");
    tr.property("ADBE Position").expression = "value + [Math.sin(time*0.8+" + seed + ")*" + amp + ", Math.cos(time*0.6+" + seed + ")*" + amp * 1.3 + ", Math.sin(time*0.5+" + seed + ")*" + amp + "]";
    tr.property("ADBE Rotate Y").expression = "value + Math.sin(time*0.45+" + seed + ")*2";
};

// Halo oscuro: que una palabra blanca no se pierda sobre tarjetas blancas desenfocadas
O.halo = function (l) {
    var s = [[90, 90], [80, 220]];
    for (var i = 0; i < 2; i++) {
        var h = l.Effects.addProperty("Drop Shadow");
        try { h.property("Shadow Color").setValue([0.03, 0.02, 0.07, 1]); h.property("Opacity").setValue(s[i][0]); h.property("Distance").setValue(0); h.property("Softness").setValue(s[i][1]); } catch (e) {}
    }
};

// Palabra gigante (3D) que entra por letras desde el desenfoque. o: {pos, size, t, out, color, track, maxW, drift:[t, escala]}
O.word = function (c, str, o) {
    var lines = str.split("\n"), longest = 0;
    for (var i = 0; i < lines.length; i++) longest = Math.max(longest, lines[i].length);
    var maxW = o.maxW || O.L(1750, 1150);
    var size = Math.min(o.size || O.L(400, 420), maxW / (longest * 0.56));
    var l = K.text(c, str, { size: size, font: O.FONT, color: o.color || O.C.blanco, tracking: o.track === undefined ? -45 : o.track, leading: size * 0.95 });
    l.name = "palabra"; l.threeDLayer = true;
    var r = l.sourceRectAtTime(0, false);
    var tr = l.property("ADBE Transform Group");
    tr.property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2, 0]);
    tr.property("ADBE Position").setValue(o.pos || O.p(0, 0, 900));
    K.reveal(l, o.t || 0.1, { dur: o.dur || 0.7, dy: 0, blur: 40, scale: 120, inf: 80 });
    K.P(l, "op").setValue(100);
    if (o.drift) K.keys(tr.property("ADBE Scale"), [[o.t || 0, [100, 100, 100]], [o.drift[0], [o.drift[1], o.drift[1], 100]]], 0);
    if (o.out) K.keys(tr.property("ADBE Opacity"), [[o.out, 100], [o.out + 0.35, 0]], 60);
    return l;
};

// Anillo 3D (pulso de un botón que se presiona)
O.ring = function (c, pos, t, color) {
    var r = K.ellipse(c, "pulso", { d: 200, noFill: true, stroke: true, strokeColor: color || O.C.claro, strokeW: 6 });
    r.threeDLayer = true;
    r.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
    K.keys(r.property("ADBE Transform Group").property("ADBE Scale"), [[t, [60, 60, 100]], [t + 0.9, [520, 520, 100]]], 0);
    K.keys(r.property("ADBE Transform Group").property("ADBE Opacity"), [[t, 0], [t + 0.05, 90], [t + 0.9, 0]], 0);
    return r;
};

// ------------------------------------------------------------------ tipos de escena
// Cada tipo recibe la entrada de O.ORDEN: {tipo, dur, palabra, ...}. Las piezas son nombres de capas/*.png.
O.S = {};

// tablero · la pantalla principal llega acostada y sus tarjetas KPI despegan del plano.
// e: {palabra, pantalla, kpis:[nombres]} (las posiciones salen de PIEZAS)
O.S.tablero = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    O.word(c, e.palabra, { pos: O.p(0, O.L(-60, -380), 900), t: 0.15, drift: [dur, 112], out: dur * 0.63 });
    var sc = O.L(36, 30);
    var pl = O.piece(c, e.pantalla, { pos: O.p(0, 1700, 300), s: sc, rx: -75, rz: O.L(-24, -14), sweep: [dur * 0.37, dur * 0.63], shadow: false });
    O.anim(pl, { t: [1.5, 3.0], pos: [O.p(0, 1700, 300), O.p(O.L(60, 0), O.L(170, 260), 150)], rx: [-75, -52] }, 85);
    for (var i = 0; i < e.kpis.length; i++) {
        var inf = O.info(e.kpis[i]), lp = [inf.cx, inf.cy, 0], up = -(260 + i * 170);
        var k = O.piece(c, e.kpis[i], { s: 100, pos: lp, parent: pl, sweep: [4.2 + i * 0.12, 5.6 + i * 0.12] });
        O.anim(k, { t: [3.0 + i * 0.12, 3.9 + i * 0.12], pos: [lp, [lp[0], lp[1] - 40, up]], rx: [0, 6 + i * 3] }, 88);
    }
    var poiW = O.p(0, O.L(-60, -380), 900), poiP = O.p(0, O.L(120, 200), 150), poiK = O.p(O.L(-120, -60), O.L(40, 120), 20);
    O.cam(c, [
        { t: 0, pos: O.p(0, 0, -2500), poi: poiW },
        { t: 1.4, pos: O.p(0, -40, -2350), poi: poiW },
        { t: 3.2, pos: O.p(O.L(-300, -150), O.L(-700, -800), -1900), poi: poiP },
        { t: dur, pos: O.p(O.L(-650, -420), O.L(-1150, -1100), -1050), poi: poiK }
    ], { ap: O.L(110, 90) });
    return c;
};

// accion · macro sobre el resultado (p. ej. «aprobado») y el botón que se presiona con pulso.
// e: {palabra, fondo (pantalla), resultado, boton}
O.S.accion = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    var wp = O.p(0, O.L(-60, -300), 1100);
    O.word(c, e.palabra, { pos: wp, t: 0.1, drift: [dur, 110] });
    if (e.fondo) O.piece(c, e.fondo, { pos: O.p(O.L(520, 200), O.L(300, 560), 1900), s: 40, ry: -28, rx: 8, shadow: false });
    var cp = O.p(O.L(-140, 0), O.L(80, 120), 0), sP = O.L(56, 44);
    var pp = O.piece(c, e.resultado, { pos: cp, s: sP, ry: 18, sweep: [2.0, 3.2] });
    O.anim(pp, { t: [0, 0.8, 1.7, dur], pos: [[cp[0] + 300, cp[1] + 1300, 200], [cp[0] + 300, cp[1] + 1300, 200], cp, [cp[0] - 40, cp[1] - 20, -60]], ry: [40, 40, 16, -8], rx: [-30, -30, 0, 0] }, 85);
    var bp = O.p(O.L(420, 180), O.L(420, 470), -260), sB = O.L(64, 58);
    var bt = O.piece(c, e.boton, { pos: bp, s: sB, ry: 12 });
    O.anim(bt, { t: [0, 1.0, 1.9, 3.0, 3.1, 3.25, 3.5], pos: [[bp[0] + 500, bp[1] + 900, bp[2]], [bp[0] + 500, bp[1] + 900, bp[2]], bp, null, null, null, null],
        s: [sB, sB, sB, sB, sB * 0.9, sB * 0.9, sB] }, 70);
    O.ring(c, [bp[0], bp[1], bp[2] - 2], 3.15);
    var w = O.info(e.resultado).w * sP / 100;
    var macroA = [cp[0] - w * 0.36, cp[1] - 30, cp[2]], macroB = [cp[0] - w * 0.02, cp[1] - 10, cp[2]];
    O.cam(c, [
        { t: 0, pos: O.p(0, O.L(-40, -260), -2500), poi: wp },
        { t: 1.0, pos: O.p(0, O.L(-40, -250), -2400), poi: wp },
        { t: 1.8, pos: [macroA[0] - 260, macroA[1] - 120, -820], poi: macroA },
        { t: 2.7, pos: [macroB[0] - 120, macroB[1] - 100, -900], poi: macroB },
        { t: 3.2, pos: [bp[0] - 200, bp[1] - 140, bp[2] - 700], poi: bp },
        { t: dur, pos: O.p(O.L(-80, -40), O.L(-80, -60), -2650), poi: O.p(O.L(120, 60), O.L(160, 90), 0), f: cp }
    ], { ap: O.L(130, 110) });
    return c;
};

// detalle · una tarjeta de pie y macro sobre un dato. e: {palabra, pieza, foco:[fx, fy]} (0–1 dentro de la pieza)
O.S.detalle = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    O.word(c, e.palabra, { pos: O.p(O.L(-430, 0), O.L(0, -560), 1000), t: 0.1, drift: [dur, 110], size: O.L(470, 380) });
    var sp = O.L(40, 42), m = O.piece(c, e.pieza, { pos: O.p(O.L(380, 0), O.L(0, 120), 0), s: sp, ry: -24, sweep: [1.6, 3.2] });
    O.anim(m, { t: [0, dur], ry: [-22, -8], pos: [O.p(O.L(420, 0), O.L(40, 160), 60), O.p(O.L(360, 0), O.L(0, 100), -40)] }, 0);
    var inf = O.info(e.pieza), s = sp / 100, fx = (e.foco[0] - 0.5) * inf.w * s, fy = (e.foco[1] - 0.5) * inf.h * s;
    var foco = O.p(O.L(380, 0) + fx, O.L(0, 120) + fy, 40);
    O.cam(c, [
        { t: 0, pos: O.p(O.L(-200, -100), O.L(-200, -500), -2300), poi: O.p(O.L(-200, 0), O.L(0, -300), 600), f: O.p(0, 0, 1000) },
        { t: 1.0, pos: O.p(O.L(-100, -80), O.L(-250, -450), -2100), poi: O.p(0, O.L(0, -200), 400) },
        { t: dur * 0.5, pos: [foco[0] - 280, foco[1] - 60, -540], poi: foco },
        { t: dur, pos: [foco[0] - 120, foco[1] + 30, -430], poi: [foco[0] + 60, foco[1], 40] }
    ], { ap: O.L(45, 40) });
    return c;
};

// plano · una pieza ancha (agenda, tabla) acostada; la cámara corre a ras. e: {palabra, pieza}
O.S.plano = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    O.word(c, e.palabra, { pos: O.p(0, O.L(-300, -620), 1300), t: 0.1, drift: [dur, 108] });
    var g = O.piece(c, e.pieza, { pos: O.p(0, O.L(200, 260), 100), s: O.L(48, 40), rx: -58, rz: O.L(-18, -10), sweep: [1.4, 3.2], shadow: false });
    O.anim(g, { t: [0, dur], rz: [O.L(-22, -14), O.L(-12, -6)] }, 0);
    O.cam(c, [
        { t: 0, pos: O.p(O.L(-200, -100), O.L(-500, -700), -2600), poi: O.p(0, O.L(-300, -620), 1300) },
        { t: 1.2, pos: O.p(O.L(-200, -100), O.L(-480, -660), -2400), poi: O.p(0, O.L(-200, -500), 1100) },
        { t: dur * 0.58, pos: O.p(O.L(-700, -450), O.L(-380, -420), -900), poi: O.p(O.L(-200, -100), O.L(160, 200), 100) },
        { t: dur, pos: O.p(O.L(500, 300), O.L(-340, -380), -820), poi: O.p(O.L(300, 160), O.L(200, 260), 100) }
    ], { ap: O.L(130, 110) });
    return c;
};

// abanico · tres tarjetas en profundidad; el foco viaja de una a otra. e: {palabra, piezas:[3]}
O.S.abanico = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    O.word(c, e.palabra, { pos: O.p(0, O.L(-40, -560), 1400), t: 0.1, drift: [dur, 110] });
    var P = [];
    for (var i = 0; i < 3; i++) {
        var fin = O.V ? O.p(-60 + i * 60, -40 + i * 380, i * 260) : O.p(-560 + i * 560, 60 - i * 40, i * 300);
        var ini = [fin[0], fin[1] + O.L(900, 1200), fin[2]];
        var t0 = 0.9 + i * 0.28;
        var l = O.piece(c, e.piezas[i], { pos: ini, s: O.L(62, 56), ry: O.L(18, 10), rx: -10, sweep: [2.2 + i * 0.3, 3.6 + i * 0.3] });
        O.anim(l, { t: [0, t0, t0 + 0.8], pos: [ini, ini, fin], rx: [-40, -40, -6], op: [0, 0, 100] }, 85);
        O.float(l, 8, i * 2);
        P.push(fin);
    }
    O.cam(c, [
        { t: 0, pos: O.p(0, O.L(-60, -400), -2300), poi: O.p(0, O.L(-40, -560), 1400) },
        { t: 1.0, pos: O.p(0, O.L(-60, -380), -2250), poi: O.p(0, O.L(-40, -500), 1300) },
        { t: dur * 0.46, pos: [P[0][0] - O.L(260, 160), P[0][1] - 120, P[0][2] - 1100], poi: P[0] },
        { t: dur * 0.7, pos: [P[1][0] - O.L(200, 140), P[1][1] - 120, P[1][2] - 1200], poi: P[1] },
        { t: dur, pos: [P[2][0] - O.L(140, 120), P[2][1] - 100, P[2][2] - 1250], poi: P[2] }
    ], { ap: O.L(150, 130) });
    return c;
};

// constelacion · todas las piezas flotando; la cámara sale de adentro hacia atrás.
// e: {palabra, piezas:[[nombre, escala, x, y, z, ry], ...]}
O.S.constelacion = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur);
    var palabra = O.word(c, O.V ? e.palabra.replace(" ", "\n") : e.palabra, { pos: O.p(0, 0, -600), t: dur * 0.4, size: O.L(215, 200), maxW: O.L(1450, 1050) });
    for (var i = 0; i < e.piezas.length; i++) {
        var a = e.piezas[i], x = O.V ? a[2] * 0.62 : a[2], y = O.V ? a[3] * 1.9 : a[3];
        var l = O.piece(c, a[0], { pos: O.p(x, y, a[4]), s: a[1] * O.L(1, 0.85), ry: a[5], rx: -a[5] / 2 });
        O.float(l, 14, i);
        O.anim(l, { t: [0, dur], rz: [a[5] / 3, -a[5] / 3] }, 0);
    }
    palabra.moveToBeginning();
    O.halo(palabra);
    O.cam(c, [
        { t: 0, pos: O.p(O.L(-420, -200), O.L(-700, -1300), -1500), poi: O.p(O.L(-260, -160), O.L(-560, -1060), -300) },
        { t: dur * 0.4, pos: O.p(O.L(-60, -30), O.L(-40, -40), -2600), poi: O.p(0, 0, 0), f: O.p(0, 0, -600) },
        { t: dur, pos: O.p(0, 0, -4200), poi: O.p(0, 0, 0), f: O.p(0, 0, -600) }
    ], { ap: O.L(120, 100), inf: 60 });
    return c;
};

// marca · logo (PNG) + nombre + lema + botón de llamada a la acción, y fundido a negro (2D)
O.S.marca = function (e) {
    var dur = e.dur, c = O.scene(e.name, dur), cx = O.W / 2, cy = O.H / 2;
    var y0 = O.L(cy - 150, cy - 260);
    var lg = c.layers.add(O.item(MARCA.LOGO)); lg.name = "logo";
    var lw = lg.source.width, esc = O.L(260, 320) / lw * 100;
    K.P(lg, "pos").setValue([cx, y0]);
    K.keys(K.P(lg, "scale"), [[0.1, [esc * 0.7, esc * 0.7]], [0.8, [esc, esc]]], 85);
    K.keys(K.P(lg, "op"), [[0.1, 0], [0.4, 100]], 0);
    var g = lg.Effects.addProperty("Glow");
    try { g.property("Glow Threshold").setValue(40); g.property("Glow Radius").setValue(60); K.keys(g.property("Glow Intensity"), [[0.5, 1.8], [1.7, 0.5]], 50); } catch (er) {}
    var a = K.text(c, MARCA.NOMBRE.toUpperCase(), { size: O.L(64, 70), font: O.FONT, color: O.C.blanco, tracking: 260, pos: [cx, y0 + O.L(230, 300)] });
    K.reveal(a, 0.7, { dur: 0.6, dy: 20, blur: 20 });
    var s = K.text(c, MARCA.LEMA, { size: O.L(34, 40), font: MARCA.FONT.med, color: O.C.gris, pos: [cx, y0 + O.L(300, 380)] });
    K.reveal(s, 1.1, { dur: 0.6, by: "words", dy: 14, blur: 10 });
    var n = c.layers.addNull(); n.name = "boton"; K.P(n, "anchor").setValue([0, 0]); K.P(n, "pos").setValue([cx, y0 + O.L(470, 620)]);
    var btn = K.rect(c, "btn", { w: O.L(520, 640), h: O.L(100, 120), round: 60, color: O.C.blanco }); btn.parent = n; K.P(btn, "pos").setValue([0, 0]);
    var bt = K.text(c, MARCA.CTA, { size: O.L(40, 48), font: O.FONT, color: O.C.bg }); bt.parent = n; K.P(bt, "pos").setValue([0, O.L(14, 17)]);
    K.keys(K.P(n, "scale"), [[1.8, [70, 70]], [2.3, [100, 100]]], 85);
    K.keys(K.P(n, "op"), [[1.8, 0], [2.0, 100]], 0);
    var blk = c.layers.addSolid([0, 0, 0], "negro", O.W, O.H, 1);
    K.keys(K.P(blk, "op"), [[dur - 0.6, 0], [dur, 100]], 0);
    return c;
};

// Montaje: cortes secos al compás + grano/viñeta en una capa de ajuste arriba (todo 2D en el maestro).
// orden: [{tipo, dur, ...}] — define O.ORDEN en tu objeto.config.jsx. Duraciones = múltiplos del beat.
O.master = function (orden) {
    orden = orden || O.ORDEN;
    var total = 0, i;
    for (i = 0; i < orden.length; i++) total += orden[i].dur;
    var name = "OBJETO" + O.SUF; K.drop([name]);
    var m = app.project.items.addComp(name, O.W, O.H, 1, total, 30); m.bgColor = O.C.bg;
    var t = 0;
    for (i = 0; i < orden.length; i++) {
        var e = orden[i]; e.name = e.name || ("O" + (i + 1) + "_" + e.tipo);
        var sc = O.S[e.tipo](e);
        var l = m.layers.add(sc); l.startTime = t; l.outPoint = t + e.dur;
        t += e.dur;
    }
    var adj = m.layers.addSolid([1, 1, 1], "acabado", O.W, O.H, 1); adj.adjustmentLayer = true;
    try { var v = adj.Effects.addProperty("CC Vignette"); v.property(1).setValue(40); } catch (er) {}
    try { var nz = adj.Effects.addProperty("Noise"); nz.property(1).setValue(1.6); } catch (er) {}
    return m;
};
"obj ok";
