"""Ejemplo para piezas.py. Los textos son los rótulos visibles de TU app; ajústalos."""
import os
BASE = os.environ.get('APP_URL', 'http://127.0.0.1:5173')


def login(page, base):
    page.goto(base + '/login', wait_until='networkidle')
    page.fill('input[type=email]', os.environ['DEMO_USER']); page.fill('input[type=password]', os.environ['DEMO_PASS'])
    page.keyboard.press('Enter'); page.wait_for_timeout(3000)


def abrir_detalle(page):
    page.get_by_text('María García', exact=False).first.click()


PIEZAS = [
    {'nombre': 'pantalla-principal', 'ruta': '/', 'tipo': 'pantalla'},
    {'nombre': 'kpi-1', 'ruta': '/', 'tipo': 'tarjeta', 'texto': 'VENTAS DEL MES'},
    {'nombre': 'kpi-2', 'ruta': '/', 'tipo': 'tarjeta', 'texto': 'INGRESOS'},
    {'nombre': 'kpi-3', 'ruta': '/', 'tipo': 'tarjeta', 'texto': 'CLIENTES'},
    {'nombre': 'kpi-4', 'ruta': '/', 'tipo': 'tarjeta', 'texto': 'PEDIDOS'},
    {'nombre': 'resultado', 'ruta': '/clientes', 'tipo': 'tarjeta', 'texto': 'ACTIVO', 'antes': abrir_detalle},
    {'nombre': 'boton', 'ruta': '/clientes', 'tipo': 'selector', 'selector': 'button:has-text("Guardar")', 'pad': 6, 'radio': 8},
    {'nombre': 'detalle', 'ruta': '/pedidos', 'tipo': 'selector', 'selector': '[role=dialog]', 'antes': lambda p: p.locator('tbody tr').first.click()},
    {'nombre': 'agenda', 'ruta': '/agenda', 'tipo': 'selector', 'selector': 'main section'},
    {'nombre': 'tarjeta-1', 'ruta': '/finanzas', 'tipo': 'tarjeta', 'texto': 'ENTRADAS'},
    {'nombre': 'tarjeta-2', 'ruta': '/finanzas', 'tipo': 'tarjeta', 'texto': 'SALIDAS'},
    {'nombre': 'tarjeta-3', 'ruta': '/finanzas', 'tipo': 'tarjeta', 'texto': 'SALDO'},
]
