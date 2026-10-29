// Escenas verticales 1080x1920 con cámara que sigue al cursor. Requiere lib.jsx (K).
var VS = {};
VS.W = 1080; VS.H = 1920;
VS.PW = 1000; VS.PH = 1240;          // panel de la pantalla (igual que "panel" en camara.json)
VS.PX = 540; VS.PY = 1215;           // centro del panel en la escena
VS.ROOT = VIDEO_ROOT;

VS.footage = function (file) {
    var p = app.project;
    for (var i = 1; i <= p.numItems; i++) if (p.item(i).name === file && !(p.item(i) instanceof CompItem)) return p.item(i);
    return p.importFile(new ImportOptions(new File(VS.ROOT + "tomas/" + file)));
};

VS.bg = function (comp, seed) {
    var C = K.C;
    comp.layers.addSolid(C.bg, "bg", VS.W, VS.H, 1);
    var grid = comp.layers.addSolid([0, 0, 0], "grid", VS.W, VS.H, 1);
    var ge = grid.Effects.addProperty("Grid");
    try { ge.property("Width").setValue(90); ge.property("Border").setValue(1.2); ge.property("Color").setValue(K.C.neon); ge.property("Blending Mode").setValue(2); } catch (e) {}
    K.P(grid, "op").setValue(7);
    K.P(grid, "pos").expression = "[540 + (time*10)%90, 960 + (time*14)%90]";
    K.P(grid, "scale").setValue([112, 112]);
    var o1 = K.ellipse(comp, "orb1", { d: 900, color: C.acento, opacity: 30 });
    o1.Effects.addProperty("Gaussian Blur").property(1).setValue(260);
    K.P(o1, "pos").expression = "[800 + Math.sin(time*0.4+" + seed + ")*140, 380 + Math.cos(time*0.3)*120]";
    var o2 = K.ellipse(comp, "orb2", { d: 800, color: K.C.acento2, opacity: 22 });
    o2.Effects.addProperty("Gaussian Blur").property(1).setValue(240);
    K.P(o2, "pos").expression = "[260 + Math.cos(time*0.33+" + seed + ")*120, 1600 + Math.sin(time*0.27)*120]";
};

// Flecha de cursor estilo macOS (negra con borde blanco), punta en (0,0)
VS.arrow = function (comp) {
    var l = comp.layers.addShape(); l.name = "cursor";
    var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var vg = g.property("ADBE Vectors Group");
    var pth = vg.addProperty("ADBE Vector Shape - Group");
    var s = new Shape();
    s.vertices = [[0, 0], [0, 46], [11, 35], [19, 54], [27, 50], [19, 32], [34, 32]];
    s.closed = true;
    pth.property("ADBE Vector Shape").setValue(s);
    var st = vg.addProperty("ADBE Vector Graphic - Stroke");
    st.property("ADBE Vector Stroke Color").setValue([1, 1, 1]); st.property("ADBE Vector Stroke Width").setValue(4.5);
    vg.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([0.05, 0.05, 0.05]);
    var ds = l.Effects.addProperty("Drop Shadow");
    try { ds.property("Opacity").setValue(55); ds.property("Distance").setValue(6); ds.property("Softness").setValue(14); } catch (e) {}
    K.P(l, "anchor").setValue([0, 0]);
    return l;
};

// Pantalla con cámara. Devuelve la capa del precomp ya colocada en la escena.
VS.screen = function (comp, CAM, o) {
    o = o || {};
    var p = app.project, name = "scr_" + CAM.name;
    K.drop([name]);
    var f = VS.footage(CAM.take);
    var sc = p.items.addComp(name, VS.PW, VS.PH, 1, CAM.total, 30);
    sc.bgColor = [0.95, 0.96, 0.97];
    var v = sc.layers.add(f); v.name = "shot";
    v.timeRemapEnabled = true;
    // time remap lineal por tramos desde CAM.map [[t_salida, t_toma], ...]
    v.property("ADBE Time Remapping").expression = "var m=" + JSON.stringify(CAM.map) + "; var s=m[m.length-1][1]+(time-m[m.length-1][0]);" +
        " for (var i=1;i<m.length;i++) if (time<=m[i][0]) { s=m[i-1][1]+(m[i][1]-m[i-1][1])*(time-m[i-1][0])/(m[i][0]-m[i-1][0]); break; }" +
        " Math.min(s, " + (f.duration - 0.04).toFixed(3) + ")";
    v.startTime = 0; v.outPoint = CAM.total;
    var anc = K.P(v, "anchor"), scl = K.P(v, "scale");
    K.P(v, "pos").setValue([VS.PW / 2, VS.PH / 2]);
    for (var i = 0; i < CAM.cam.length; i++) {
        var c = CAM.cam[i];
        anc.setValueAtTime(c[0], [c[1], c[2]]);
        scl.setValueAtTime(c[0], [c[3], c[3]]);
    }
    // cursor: hijo de la toma, posición en coordenadas de la toma, tamaño constante en pantalla
    var cur = VS.arrow(sc); cur.parent = v;
    var cp = K.P(cur, "pos");
    for (var j = 0; j < CAM.cur.length; j++) cp.setValueAtTime(j / 30, CAM.cur[j]);
    var press = "";
    for (var q = 0; q < CAM.clicks.length; q++) press += "d=time-" + CAM.clicks[q][0] + "; if(d>-0.05&&d<0.25){m=Math.min(m, 0.82+0.18*Math.abs(d-0.08)/0.17);} ";
    K.P(cur, "scale").expression = "s=100*100/thisComp.layer('shot').transform.scale[0]; m=1; " + press + " [s*m*1.15, s*m*1.15]";
    // onda en cada clic
    for (var r = 0; r < CAM.clicks.length; r++) {
        var ck = CAM.clicks[r];
        var ring = K.ellipse(sc, "click" + r, { d: 60, noFill: true, stroke: true, strokeColor: K.C.acento, strokeW: 8 });
        ring.parent = v; K.P(ring, "pos").setValue([ck[1], ck[2]]);
        ring.moveAfter(cur);
        K.P(ring, "scale").expression = "t=time-" + ck[0] + "; b=100*100/thisComp.layer('shot').transform.scale[0]; t<0 ? [0,0] : [b*(0.3+t*3.2), b*(0.3+t*3.2)]";
        K.P(ring, "op").expression = "t=time-" + ck[0] + "; t<0||t>0.55 ? 0 : 100*(1-t/0.55)";
        var dot = K.ellipse(sc, "clickdot" + r, { d: 40, color: K.C.neon });
        dot.parent = v; K.P(dot, "pos").setValue([ck[1], ck[2]]); dot.moveAfter(cur);
        K.P(dot, "scale").expression = "t=time-" + ck[0] + "; b=100*100/thisComp.layer('shot').transform.scale[0]; [b*(0.6+t),b*(0.6+t)]";
        K.P(dot, "op").expression = "t=time-" + ck[0] + "; t<0||t>0.3 ? 0 : 60*(1-t/0.3)";
    }
    // matte redondeado y borde
    var m = K.rect(sc, "matte", { w: VS.PW, h: VS.PH, round: 44, color: [1, 1, 1], pos: [VS.PW / 2, VS.PH / 2] });
    for (var n = 2; n <= sc.numLayers; n++) if (sc.layer(n) !== m) sc.layer(n).setTrackMatte(m, TrackMatteType.ALPHA);
    // colocar en la escena
    var L = comp.layers.add(sc); L.name = "pantalla";
    K.keys(K.P(L, "pos"), [[0, [VS.PX, VS.PY + 260]], [0.55, [VS.PX, VS.PY]]], 85);
    K.P(L, "pos").expression = "value + [0, Math.sin(time*1.3)*5]";
    K.keys(K.P(L, "scale"), [[0, [92, 92]], [0.55, [100, 100]]], 80);
    K.keys(K.P(L, "op"), [[0, 0], [0.25, 100]], 0);
    var ds = L.Effects.addProperty("Drop Shadow");
    try { ds.property("Opacity").setValue(75); ds.property("Distance").setValue(30); ds.property("Softness").setValue(80); } catch (e) {}
    return L;
};

// Teclas: chip abajo del panel que muestra lo que se escribe
VS.typing = function (comp, CAM) {
    if (!CAM.keys.length) return;
    var t0 = CAM.keys[0][0];
    var n = comp.layers.addNull(); n.name = "teclas"; K.P(n, "anchor").setValue([0, 0]); K.P(n, "pos").setValue([540, 1748]);
    var bg = K.rect(comp, "teclas_bg", { w: 520, h: 92, round: 46, color: [0.09, 0.12, 0.12], stroke: true, strokeColor: K.C.neon, strokeW: 2 });
    bg.parent = n; K.P(bg, "pos").setValue([0, 0]);
    var ic = K.text(comp, "⌨", { size: 40, color: K.C.neon, font: K.FONT.semi }); ic.parent = n; K.P(ic, "pos").setValue([-200, 14]);
    var tx = K.text(comp, " ", { size: 40, color: K.C.white, font: K.FONT.semi, just: "L" }); tx.parent = n; K.P(tx, "pos").setValue([-150, 14]);
    var src = tx.property("ADBE Text Properties").property("ADBE Text Document");
    for (var i = 0; i < CAM.keys.length; i++) {
        var td = src.value; td.text = CAM.keys[i][1] + "|"; src.setValueAtTime(CAM.keys[i][0], td);
    }
    try { for (var k = 1; k <= src.numKeys; k++) src.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD); } catch (e) {}
    K.keys(K.P(n, "scale"), [[t0 - 0.2, [0, 0]], [t0, [108, 108]], [t0 + 0.15, [100, 100]]], 60);
    var tEnd = CAM.keys[CAM.keys.length - 1][0] + 0.9;
    var lys = [bg, ic, tx];
    for (var q = 0; q < lys.length; q++) K.keys(K.P(lys[q], "op"), [[tEnd, 100], [tEnd + 0.3, 0]], 0);
};

// Subtítulo superior: etiqueta + titular de 2 líneas (la 2.ª en el color de acento), entrada por palabras
VS.caption = function (comp, kicker, l1, l2) {
    var C = K.C, F = K.FONT;
    var kk = K.text(comp, kicker, { size: 30, color: C.neon, font: F.semi, tracking: 160, pos: [540, 255] });
    K.reveal(kk, 0.1, { dur: 0.4, dy: 14, blur: 4 });
    var a = K.text(comp, l1, { size: 82, color: C.white, font: F.bold, pos: [540, 370] });
    K.reveal(a, 0.2, { dur: 0.5, dy: 50, by: "words", scale: 60 });
    var b = K.text(comp, l2, { size: 82, color: C.neon, font: F.bold, pos: [540, 465] });
    K.reveal(b, 0.45, { dur: 0.5, dy: 50, by: "words", scale: 60 });
    var g = b.Effects.addProperty("Glow"); try { g.property("Glow Threshold").setValue(50); g.property("Glow Radius").setValue(22); g.property("Glow Intensity").setValue(0.8); } catch (e) {}
};

// Escena de demo completa
VS.demo = function (CAM, num, kicker, l1, l2, seed) {
    K.W = VS.W; K.H = VS.H;
    K.drop([CAM.name]);
    var c = app.project.items.addComp(CAM.name, VS.W, VS.H, 1, CAM.total, 30);
    c.bgColor = K.C.bg;
    VS.bg(c, seed || 1);
    VS.screen(c, CAM);
    VS.caption(c, num + "  ·  " + kicker, l1, l2);
    VS.typing(c, CAM);
    // marca pequeña abajo
    var brand = K.text(c, MARCA.NOMBRE.toUpperCase(), { size: 24, color: [0.55, 0.62, 0.62], font: K.FONT.semi, tracking: 300, pos: [540, 1880] });
    if (CAM.keys.length) K.P(brand, "op").setValue(0);
    K.finish(c);
    return c;
};
