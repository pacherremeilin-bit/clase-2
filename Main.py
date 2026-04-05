from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from routes.servicios import router as servicios_router
from routes.auth import router as auth_router

@app.post('/registrar-mascota')
def registrar_mascota(mascota: dict):
    if not all(field in mascota for field in ['correo', 'nombre', 'tipo_servicio', 'fecha']):
        raise HTTPException(status_code=400, detail='Faltan datos para registrar la mascota')

    global mascotas_db
    if 'mascotas_db' not in globals():
        mascotas_db = []

    mascotas_db.append(mascota)
    return {'ok': True, 'mensaje': 'Mascota registrada exitosamente', 'mascota': mascota}


@app.get('/mascotas/{correo}')
def listar_mascotas(correo: str):
    if 'mascotas_db' not in globals():
        return {'mascotas': []}

    mascotas = [m for m in mascotas_db if m['correo'].lower() == correo.lower()]
    return {'mascotas': mascotas}


@app.get('/reporte/{correo}')
def reporte_correo(correo: str):
    if 'mascotas_db' not in globals():
        return {'cantidad_servicios': 0, 'total_gastado': 0.0, 'servicios': [], 'correo': correo}

    mascotas = [m for m in mascotas_db if m['correo'].lower() == correo.lower()]
    cantidad_servicios = len(mascotas)
    total_gastado = 0.0
    servicios_usados = []

    for mascota in mascotas:
        servicio_nombre = mascota.get('tipo_servicio', '')
        servicios_usados.append(servicio_nombre)
        servicio = next((s for s in servicios_db if s['nombre'].lower() == servicio_nombre.lower()), None)
        if servicio:
            total_gastado += float(servicio['precio'])

    servicios_unicos = list(dict.fromkeys(servicios_usados))
    return {
        'cantidad_servicios': cantidad_servicios,
        'total_gastado': round(total_gastado, 2),
        'servicios': servicios_unicos,
        'correo': correo
    }