// Identidad del video. Cópialo a la carpeta del video y edítalo: es lo único que cambia de un producto a otro.
// Colores en RGB 0–1 (hex → /255). Las fuentes deben estar instaladas en la máquina que renderiza.
var MARCA = {
    NOMBRE: "Tu Producto",
    LEMA: "Software para tu industria",
    CTA: "Agenda tu demo  →",
    URL: "app.tuproducto.com",          // lo que se lee en la barra de la ventana del navegador
    LOGO: "logo.png",                    // PNG con transparencia dentro de capas/ (o tomas/ para los formatos 1–3)
    C: {
        bg: [0.024, 0.024, 0.039],       // fondo casi negro
        panel: [0.060, 0.070, 0.090],
        panel2: [0.090, 0.100, 0.125],
        acento: [0.486, 0.227, 0.929],   // color principal de la marca
        neon: [0.655, 0.545, 0.980],     // versión clara del acento (titulares, brillos)
        acento2: [0.150, 0.350, 0.700],  // segundo brillo del fondo
        white: [0.96, 0.96, 0.98],
        gray: [0.56, 0.56, 0.64],
        red: [0.950, 0.360, 0.360],
        alerta: [0.85, 0.52, 0.32]       // para cifras del problema (cobre/ámbar)
    },
    FONT: { bold: "Inter-Bold", semi: "Inter-SemiBold", med: "Inter-Medium", reg: "Inter-Regular", display: "HelveticaNeue-Bold" }
};
