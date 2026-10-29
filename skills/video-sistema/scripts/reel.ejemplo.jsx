// Reel vertical con cámara que sigue al cursor: una escena por toma (cam/<escena>.jsx lo escribe camara.py).
// VS.demo(CAM, número, etiqueta, línea 1, línea 2 en color de acento, semilla del fondo)
var REEL = [
    ["V1", "01", "BUSCAR", "Lo encuentras", "en un segundo."]
];
function reel() {
    var m = app.project.items.addComp("REEL_V", 1080, 1920, 1, 1, 30), t = 0;
    for (var i = 0; i < REEL.length; i++) {
        $.evalFile(new File(VIDEO_ROOT + "escenas/" + REEL[i][0] + ".jsx"));   // construir.sh copia cam/ aquí
        var c = VS.demo(CAM, REEL[i][1], REEL[i][2], REEL[i][3], REEL[i][4], i + 1);
        m.duration = t + CAM.L;
        var l = m.layers.add(c); l.startTime = t; l.outPoint = t + CAM.L; t += CAM.L;
    }
    return m;
}
