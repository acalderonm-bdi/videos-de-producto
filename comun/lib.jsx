// Ayudas compartidas para todas las escenas (EffectCraft, modelo de objetos estilo After Effects).
// Requiere marca.jsx (MARCA) y VIDEO_ROOT definidos antes de cargar.
var K = {};
K.W = 1920; K.H = 1080; K.FPS = 30;
K.HANDLE = 0.5; // cola extra de cada escena: la usan las transiciones de FilmCraft
// VIDEO_ROOT: carpeta del video, con / al final. Definirla antes de cargar.
if (typeof VIDEO_ROOT === "undefined") throw new Error("define VIDEO_ROOT antes de cargar lib.jsx");
K.ROOT = VIDEO_ROOT;
K.C = MARCA.C;
K.FONT = MARCA.FONT;

K.tr = function (l) { return l.property("ADBE Transform Group"); };
K.P = function (l, name) {
    var m = { pos: "ADBE Position", scale: "ADBE Scale", op: "ADBE Opacity", rot: "ADBE Rotate Z", rx: "ADBE Rotate X", ry: "ADBE Rotate Y", anchor: "ADBE Anchor Point" };
    return K.tr(l).property(m[name]);
};

K.ease = function (prop, inf) {
    inf = inf || 75;
    var v = prop.value, n = (v instanceof Array) ? v.length : 1;
    for (var k = 1; k <= prop.numKeys; k++) {
        var arr = [];
        try {
            for (var i = 0; i < n; i++) arr.push(new KeyframeEase(0, inf));
            prop.setTemporalEaseAtKey(k, arr, arr);
        } catch (e) {
            var one = [new KeyframeEase(0, inf)];
            try { prop.setTemporalEaseAtKey(k, one, one); } catch (e2) {}
        }
    }
};

// keys: [[t, v], ...]
K.keys = function (prop, keys, inf) {
    for (var i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0], keys[i][1]);
    if (inf !== 0) K.ease(prop, inf || 75);
    return prop;
};

K.setTD = function (l, fn) {
    var p = l.property("ADBE Text Properties").property("ADBE Text Document");
    var td = p.value; fn(td); p.setValue(td);
};

// o: {size, color, font, pos, just: "L"|"C"|"R", tracking, leading}
K.text = function (comp, str, o) {
    o = o || {};
    var l = comp.layers.addText(str);
    K.setTD(l, function (td) {
        td.fontSize = o.size || 64;
        td.fillColor = o.color || K.C.white;
        td.font = o.font || K.FONT.bold;
        td.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : o.just === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
        if (o.tracking !== undefined) td.tracking = o.tracking;
        if (o.leading) { td.autoLeading = false; td.leading = o.leading; }
    });
    if (o.pos) K.P(l, "pos").setValue(o.pos);
    if (o.name) l.name = o.name;
    return l;
};

// Revelado por letra: opacidad 0, sube desde abajo y desenfoca. o: {dy, blur, dur, by: "chars"|"words"}
K.reveal = function (l, start, o) {
    o = o || {};
    var an = l.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
    var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    var ap = an.property("ADBE Text Animator Properties");
    ap.addProperty("ADBE Text Opacity").setValue(0);
    ap.addProperty("ADBE Text Position 3D").setValue([0, o.dy === undefined ? 70 : o.dy, 0]);
    if (o.blur !== 0) ap.addProperty("ADBE Text Blur").setValue([o.blur || 14, o.blur || 14]);
    if (o.scale) ap.addProperty("ADBE Text Scale 3D").setValue([o.scale, o.scale, 100]);
    var adv = sel.property("advanced");
    adv.property("shape").setValue(1);
    if (o.by === "words") adv.property("basedOn").setValue(3);
    K.keys(sel.property("ADBE Text Percent Start"), [[start, 0], [start + (o.dur || 0.8), 100]], o.inf || 70);
    return an;
};

// Salida: todo el texto se va (opacidad + blur) entre t y t+d
K.fadeOut = function (l, t, d) {
    var op = K.P(l, "op");
    K.keys(op, [[t, op.valueAtTime(t, false)], [t + (d || 0.4), 0]], 60);
};

K.shapeLayer = function (comp, name) {
    var l = comp.layers.addShape(); l.name = name || "shape";
    return l;
};

// Rectángulo redondeado. o: {w,h,round,color,pos,stroke,strokeColor,strokeW,opacity,noFill}
K.rect = function (comp, name, o) {
    var l = K.shapeLayer(comp, name);
    var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var vg = g.property("ADBE Vectors Group");
    var r = vg.addProperty("ADBE Vector Shape - Rect");
    r.property("ADBE Vector Rect Size").setValue([o.w, o.h]);
    r.property("ADBE Vector Rect Roundness").setValue(o.round || 0);
    if (!o.noFill) vg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(o.color || K.C.panel);
    if (o.stroke) {
        var s = vg.addProperty("ADBE Vector Graphic - Stroke");
        s.property("ADBE Vector Stroke Color").setValue(o.strokeColor || K.C.acento);
        s.property("ADBE Vector Stroke Width").setValue(o.strokeW || 2);
    }
    if (o.pos) K.P(l, "pos").setValue(o.pos);
    if (o.opacity !== undefined) K.P(l, "op").setValue(o.opacity);
    l.rectSize = r.property("ADBE Vector Rect Size");
    return l;
};

K.ellipse = function (comp, name, o) {
    var l = K.shapeLayer(comp, name);
    var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var vg = g.property("ADBE Vectors Group");
    vg.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([o.d, o.d]);
    if (!o.noFill) vg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(o.color || K.C.acento);
    if (o.stroke) {
        var s = vg.addProperty("ADBE Vector Graphic - Stroke");
        s.property("ADBE Vector Stroke Color").setValue(o.strokeColor || K.C.acento);
        s.property("ADBE Vector Stroke Width").setValue(o.strokeW || 2);
    }
    if (o.pos) K.P(l, "pos").setValue(o.pos);
    if (o.opacity !== undefined) K.P(l, "op").setValue(o.opacity);
    return l;
};

// Fondo de la marca: color base, rejilla tenue, dos brillos del color de acento que flotan.
K.bg = function (comp, seed) {
    seed = seed || 1;
    var base = comp.layers.addSolid(K.C.bg, "bg", K.W, K.H, 1);
    var grid = comp.layers.addSolid([0, 0, 0], "grid", K.W, K.H, 1);
    var ge = grid.Effects.addProperty("Grid");
    try {
        ge.property("Width").setValue(96);
        ge.property("Border").setValue(1.2);
        ge.property("Color").setValue(K.C.neon);
        ge.property("Blending Mode").setValue(2);
    } catch (e) {}
    K.P(grid, "op").setValue(7);
    K.P(grid, "pos").expression = "[960 + (time*12)%96, 540 + (time*6)%96]";
    K.P(grid, "scale").setValue([110, 110]);
    var o1 = K.ellipse(comp, "orb1", { d: 900, color: K.C.acento, opacity: 32 });
    o1.Effects.addProperty("Gaussian Blur").property(1).setValue(260);
    K.P(o1, "pos").expression = "seedRandom(" + seed + ",true); [1500 + Math.sin(time*0.35+" + seed + ")*160, 260 + Math.cos(time*0.28)*120]";
    var o2 = K.ellipse(comp, "orb2", { d: 760, color: K.C.acento2, opacity: 22 });
    o2.Effects.addProperty("Gaussian Blur").property(1).setValue(240);
    K.P(o2, "pos").expression = "[380 + Math.cos(time*0.3+" + seed + ")*140, 880 + Math.sin(time*0.24)*90]";
    return [base, grid, o1, o2];
};

// Viñeta + grano al final de la escena (capa de ajuste arriba de todo)
K.finish = function (comp) {
    var adj = comp.layers.addSolid([1, 1, 1], "finish", K.W, K.H, 1);
    adj.adjustmentLayer = true;
    try { var v = adj.Effects.addProperty("CC Vignette"); v.property(1).setValue(35); } catch (e) {}
    try { var n = adj.Effects.addProperty("Noise"); n.property(1).setValue(2.2); } catch (e) {}
    return adj;
};

K.footage = function (file) {
    var p = app.project;
    for (var i = 1; i <= p.numItems; i++) if (p.item(i).name === file) return p.item(i);
    return p.importFile(new ImportOptions(new File(K.ROOT + "tomas/" + file)));
};

// Ventana de navegador con la toma dentro (esquinas redondeadas + barra con 3 puntos).
K.windowComp = function (name, file, dur, trim, label) {
    var p = app.project;
    var f = K.footage(file);
    var BAR = 56, H = 1080 + BAR;
    var w = p.items.addComp("win_" + name, 1920, H, 1, dur, 30);
    w.bgColor = K.C.panel;
    var v = w.layers.add(f);
    K.P(v, "pos").setValue([960, BAR + 540]);
    v.startTime = -(trim || 0);
    // congelar el último cuadro si la escena dura más que la toma
    if (f.duration - (trim || 0) < dur) {
        v.timeRemapEnabled = true;
        var tr = v.property("ADBE Time Remapping");
        tr.expression = "Math.min(time, " + (f.duration - 0.05).toFixed(3) + ")";
        v.outPoint = dur;
    }
    var bar = K.rect(w, "bar", { w: 1920, h: BAR, color: [0.11, 0.13, 0.14], pos: [960, BAR / 2] });
    var dots = [[0.98, 0.37, 0.34], [0.99, 0.74, 0.20], [0.30, 0.80, 0.36]];
    for (var i = 0; i < 3; i++) K.ellipse(w, "dot" + i, { d: 16, color: dots[i], pos: [40 + i * 28, BAR / 2] });
    var url = K.rect(w, "url", { w: 560, h: 30, round: 15, color: [0.17, 0.19, 0.2], pos: [960, BAR / 2] });
    var ut = K.text(w, MARCA.URL + "  ·  " + (label || name), { size: 17, color: K.C.gray, font: K.FONT.med, pos: [960, BAR / 2 + 6] });
    var m = K.rect(w, "matte", { w: 1920, h: H, round: 30, color: [1, 1, 1], pos: [960, H / 2] });
    for (var j = 2; j <= w.numLayers; j++) w.layer(j).setTrackMatte(m, TrackMatteType.ALPHA);
    return w;
};

// Coloca una ventana en 3D. o: {pos:[x,y], scale, ry:[a,b], rx:[a,b], t0 (entrada), from:"right"|"left"|"bottom"}
K.placeWindow = function (comp, w, o) {
    var L = comp.layers.add(w);
    L.threeDLayer = true;
    L.startTime = o.t0 || 0;
    var s = o.scale || 60;
    var t0 = o.t0 || 0, d = comp.duration;
    var dx = o.from === "left" ? -700 : o.from === "bottom" ? 0 : 700;
    var dy = o.from === "bottom" ? 600 : 40;
    K.keys(K.P(L, "pos"), [[t0, [o.pos[0] + dx, o.pos[1] + dy, 300]], [t0 + 0.9, [o.pos[0], o.pos[1], 0]], [d, [o.pos[0] + (o.drift || -30), o.pos[1] - 10, -60]]], 82);
    K.keys(K.P(L, "scale"), [[t0, [s * 0.92, s * 0.92, s]], [t0 + 0.9, [s, s, s]], [d, [s * 1.05, s * 1.05, s]]], 70);
    var ry = o.ry || [-18, -8];
    K.keys(K.P(L, "ry"), [[t0, ry[0] * 2], [t0 + 0.9, ry[0]], [d, ry[1]]], 70);
    var rx = o.rx || [6, 3];
    K.keys(K.P(L, "rx"), [[t0, rx[0]], [d, rx[1]]], 50);
    K.keys(K.P(L, "op"), [[t0, 0], [t0 + 0.35, 100]], 0);
    var ds = L.Effects.addProperty("Drop Shadow");
    try {
        ds.property("Opacity").setValue(70);
        ds.property("Distance").setValue(40);
        ds.property("Softness").setValue(90);
        ds.property("Shadow Color").setValue([0, 0, 0]);
    } catch (e) {}
    return L;
};

// Etiqueta-píldora con texto. Devuelve el null que la mueve. o: {pos, color, txtColor, size, dot, t, padX}
K.chip = function (comp, str, o) {
    o = o || {};
    var size = o.size || 30, padX = o.padX || 28;
    var t = K.text(comp, str, { size: size, color: o.txtColor || K.C.white, font: K.FONT.semi, just: "L", pos: [0, 0] });
    var r = t.sourceRectAtTime(0, false);
    var dotW = o.dot ? size * 0.9 : 0;
    var w = r.width + padX * 2 + dotW, h = size * 2.0;
    var pill = K.rect(comp, "chip_" + str, { w: w, h: h, round: h / 2, color: o.color || K.C.panel2, stroke: true, strokeColor: o.stroke || [1, 1, 1], strokeW: 1.5 });
    try { pill.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(3).property("ADBE Vector Stroke Opacity").setValue(18); } catch (e) {}
    var n = comp.layers.addNull(); n.name = "n_" + str;
    K.P(n, "pos").setValue([0, 0]);
    K.P(n, "anchor").setValue([0, 0]);
    t.moveBefore(pill);
    t.parent = n; pill.parent = n;
    K.P(t, "pos").setValue([-w / 2 + padX + dotW, -r.top - r.height / 2]);
    K.P(pill, "pos").setValue([0, 0]);
    if (o.dot) {
        var d = K.ellipse(comp, "dot_" + str, { d: size * 0.42, color: o.dot });
        d.parent = n; d.moveBefore(pill);
        K.P(d, "pos").setValue([-w / 2 + padX + size * 0.2, 0]);
    }
    K.P(n, "pos").setValue(o.pos || [960, 540]);
    var t0 = o.t || 0;
    K.keys(K.P(n, "scale"), [[t0, [0, 0]], [t0 + 0.22, [112, 112]], [t0 + 0.38, [100, 100]]], 60);
    n.chipWidth = w;
    return n;
};

K.renderTo = function (comp, file) {
    var item = app.project.renderQueue.items.add(comp);
    var om = item.outputModule(1);
    om.file = new File(K.ROOT + "render/" + file);
    return item;
};

// Borra un comp (y sus win_ precomps) si ya existe, para reconstruir sin duplicados.
K.drop = function (names) {
    var p = app.project;
    for (var i = p.numItems; i >= 1; i--) {
        var it = p.item(i);
        for (var j = 0; j < names.length; j++) if (it.name === names[j] || it.name.indexOf(names[j] + "__") === 0) { it.remove(); break; }
    }
};

// Escena de módulo. o: {name, dur, num, tag, head, sub, side: "L"|"R", shots: [{file, trim, pos, scale, ry, t0, from}], chips: [{text, pos, dot, t}]}
K.feature = function (o) {
    var p = app.project, dur = (o.dur || 6) + K.HANDLE;
    var wins = [];
    for (var i = 0; i < o.shots.length; i++) wins.push("win_" + o.name + (i ? "_" + i : ""));
    K.drop([o.name].concat(wins));
    var c = p.items.addComp(o.name, 1920, 1080, 1, dur, 30);
    c.bgColor = K.C.bg;
    K.bg(c, o.seed || 2);
    var textX = o.side === "R" ? 1100 : 120;
    for (var k = 0; k < o.shots.length; k++) {
        var s = o.shots[k];
        var w = K.windowComp(o.name + (k ? "_" + k : ""), s.file, dur, s.trim || 0, s.label);
        w.name = wins[k];
        K.placeWindow(c, w, s);
    }
    var tag = K.text(c, o.num + "  ·  " + o.tag, { size: 24, color: K.C.neon, font: K.FONT.semi, just: "L", pos: [textX, 390], tracking: 140 });
    K.reveal(tag, 0.15, { dy: 16, blur: 6, dur: 0.5 });
    var bar = K.rect(c, "accent", { w: 64, h: 6, round: 3, color: K.C.acento, pos: [textX + 32, 350] });
    K.keys(K.P(bar, "scale"), [[0.1, [0, 100]], [0.6, [100, 100]]], 80);
    K.P(bar, "anchor").setValue([-32, 0]); K.P(bar, "pos").setValue([textX, 350]);
    var h = K.text(c, o.head, { size: o.headSize || 76, color: K.C.white, font: K.FONT.bold, just: "L", pos: [textX, 486], leading: (o.headSize || 76) * 1.12 });
    K.reveal(h, 0.3, { dur: 0.9 });
    var sub = K.text(c, o.sub, { size: 30, color: K.C.gray, font: K.FONT.med, just: "L", pos: [textX, 486 + (o.headSize || 76) * 1.12 * (o.head.split("\n").length) + 20], leading: 42 });
    K.reveal(sub, 0.85, { dy: 24, blur: 8, dur: 0.7, by: "words" });
    for (var m = 0; m < (o.chips || []).length; m++) {
        var ch = o.chips[m];
        K.chip(c, ch.text, { pos: ch.pos, dot: ch.dot, t: ch.t || (1.5 + m * 0.4), size: ch.size });
    }
    for (var z = 0; z < (o.zooms || []).length; z++) K.zoomCard(c, o.name + "_z" + z, o.zooms[z]);
    // salida: todo hace zoom suave y se apaga en los últimos 0.3 s (la transición la pone FilmCraft)
    K.finish(c);
    return c;
};

// Tarjeta-lupa: recorta una región de la toma (coordenadas 1920x1080 de la toma), la amplía y la hace flotar.
// o: {file, rect:[x,y,w,h], scale, pos, t, trim}
K.zoomCard = function (comp, name, o) {
    K.drop(["zoom_" + name]);
    var f = K.footage(o.file), sc = o.scale || 1.4;
    var W = Math.round(o.rect[2] * sc), H = Math.round(o.rect[3] * sc);
    var z = app.project.items.addComp("zoom_" + name, W, H, 1, comp.duration, 30);
    var v = z.layers.add(f);
    v.startTime = -(o.trim || 0);
    v.timeRemapEnabled = true;
    v.property("ADBE Time Remapping").expression = o.hold !== undefined ? String(o.hold) : "Math.min(time + " + (o.trim || 0) + ", " + (f.duration - 0.05).toFixed(3) + ")";
    v.startTime = 0; v.outPoint = comp.duration;
    K.P(v, "anchor").setValue([o.rect[0], o.rect[1]]);
    K.P(v, "pos").setValue([0, 0]);
    K.P(v, "scale").setValue([sc * 100, sc * 100]);
    var m = K.rect(z, "matte", { w: W, h: H, round: 18, color: [1, 1, 1], pos: [W / 2, H / 2] });
    v.setTrackMatte(m, TrackMatteType.ALPHA);
    var brd = K.rect(z, "border", { w: W - 3, h: H - 3, round: 18, noFill: true, stroke: true, strokeColor: K.C.neon, strokeW: 3, pos: [W / 2, H / 2] });
    var L = comp.layers.add(z);
    K.P(L, "pos").setValue(o.pos);
    var t0 = o.t || 1.5;
    K.keys(K.P(L, "scale"), [[t0, [60, 60]], [t0 + 0.28, [104, 104]], [t0 + 0.45, [100, 100]]], 65);
    K.keys(K.P(L, "op"), [[t0, 0], [t0 + 0.15, 100]], 0);
    K.P(L, "pos").expression = "value + [0, Math.sin((time-" + t0 + ")*1.6)*6]";
    var ds = L.Effects.addProperty("Drop Shadow");
    try { ds.property("Opacity").setValue(75); ds.property("Distance").setValue(24); ds.property("Softness").setValue(60); } catch (e) {}
    return L;
};
