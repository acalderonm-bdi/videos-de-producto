"""Ejemplo de flujos para toma.py. Copia este archivo y adapta selectores y rutas a tu app.
Regla: cada toma cuenta un flujo COMPLETO (buscar → seleccionar → resultado visible) y marca el resultado.
"""
import os

BASE = os.environ.get('APP_URL', 'http://127.0.0.1:5173')
LOCALE = 'es-MX'

# Opcional: el producto se llama distinto en la grabación que en la app interna (solo cambia lo que se ve)
RENOMBRAR = [[r'Nombre Interno', 'Tu Producto']]

# Opcional: forzar tema oscuro, cerrar banners, etc. antes de que cargue la app
INIT_SCRIPTS = ["try{localStorage.setItem('theme','dark')}catch(e){}"]


def login(page, base):
    # Usuario de demo LOCAL, nunca credenciales de producción. Se leen del entorno, no se escriben aquí.
    page.goto(base + '/login', wait_until='networkidle')
    page.fill('input[type=email]', os.environ['DEMO_USER'])
    page.fill('input[type=password]', os.environ['DEMO_PASS'])
    page.keyboard.press('Enter'); page.wait_for_timeout(3000)


def tablero(t):
    t.ir('/', 0.4); t.start(); t.hold(0.8)
    for x in (400, 690, 980, 1270): t.move(x, 380, 0.6); t.hold(0.5)      # recorre las tarjetas KPI
    t.mark('kpis'); t.hold(1.0); t.stop()


def buscar_y_resultado(t):
    t.ir('/clientes', 0.4); t.start(); t.hold(0.6)
    t.click_el(t.p.locator('input[placeholder*="Buscar"]').first, 0.9, dx=-60)
    t.type('María', 0.12); t.hold(1.0); t.mark('busca')
    t.click_el(t.p.get_by_text('María García', exact=False).first, 0.7); t.hold(1.2)
    t.mark('resultado'); t.hold(2.0)          # el resultado se queda a la vista: la cámara lo abrirá a pantalla completa
    t.stop()


def proceso_largo(t):
    t.ir('/reportes', 0.4); t.start(); t.hold(0.6)
    t.click_el(t.p.get_by_role('button', name='Generar').first, 0.8); t.mark('pide')
    t.pause()                                  # la espera no se graba
    t.p.get_by_text('Listo', exact=False).first.wait_for(timeout=300000)
    t.resume(); t.mark('resultado'); t.hold(2.0); t.stop()


TOMAS = {'tablero': tablero, 'buscar': buscar_y_resultado, 'proceso': proceso_largo}
