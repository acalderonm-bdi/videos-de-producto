// Guion del formato «producto como objeto»: qué escenas, en qué orden, con qué piezas y qué palabra.
// Duraciones en múltiplos del beat (120 BPM → 0.5 s) para que los cortes caigan en la música.
// Tipos: tablero · accion · detalle · plano · abanico · constelacion · marca (ver comun/obj.jsx).
O.ORDEN = [
    { tipo: "tablero", dur: 7, palabra: "Tu negocio.", pantalla: "pantalla-principal", kpis: ["kpi-1", "kpi-2", "kpi-3", "kpi-4"] },
    { tipo: "accion", dur: 5, palabra: "Al instante.", fondo: "pantalla-principal", resultado: "resultado", boton: "boton" },
    { tipo: "detalle", dur: 4.5, palabra: "Detalle.", pieza: "resultado", foco: [0.2, 0.5] },
    { tipo: "plano", dur: 4.5, palabra: "Agenda.", pieza: "pantalla-principal" },
    { tipo: "abanico", dur: 5, palabra: "Dinero.", piezas: ["kpi-1", "kpi-2", "kpi-4"] },
    { tipo: "constelacion", dur: 5.5, palabra: "Un solo sistema.", piezas: [
        ["pantalla-principal", 26, -600, -420, 1200, -10], ["kpi-2", 70, -820, 340, 300, 14], ["kpi-1", 70, -260, -560, -300, -10],
        ["resultado", 30, 280, 560, -500, 8], ["kpi-4", 62, -880, -60, -700, 18], ["boton", 60, 720, 60, -900, -14],
        ["kpi-3", 66, 260, -380, 900, 10]] },     // [pieza, escala %, x, y, z, giro]
    { tipo: "marca", dur: 5.5 }
];
