const db = require('../../db/database');
const POLITICAS = require('./politicas');

// Politicas activas segun la tabla "politicas" (se pueden apagar sin tocar codigo)
function codigosActivos() {
  return new Set(db.prepare('SELECT codigo FROM politicas WHERE activa = 1').all().map(p => p.codigo));
}

// Usuario + Recurso + Accion + Entorno -> Politicas -> PERMITIR / DENEGAR
function evaluar({ usuario, accion, documento = null, entorno = {} }) {
  const ctx = { usuario, accion, documento, entorno };
  const activas = codigosActivos();
  const evaluadas = [];

  for (const p of POLITICAS) {
    if (!activas.has(p.codigo)) continue;
    if (p.acciones !== '*' && !p.acciones.includes(accion)) continue;
    if (p.excepto.includes(usuario.rol)) continue;
    if (!p.aplica(ctx)) continue;

    evaluadas.push({ politica: p.codigo, cumple: p.cumple(ctx), detalle: p.detalle(ctx) });
  }

  const fallidas = evaluadas.filter(e => !e.cumple);
  return {
    permitido: fallidas.length === 0,
    motivo: fallidas.length === 0
      ? 'Cumple todas las politicas ABAC'
      : fallidas.map(f => `${f.politica} (${f.detalle})`).join('; '),
    evaluadas,
  };
}

// Matriz de politicas (entregable 7)
function matriz() {
  const estado = new Map(db.prepare('SELECT codigo, activa FROM politicas').all().map(p => [p.codigo, p.activa]));
  return POLITICAS.map(p => ({
    codigo: p.codigo,
    nombre: p.nombre,
    regla: p.regla,
    acciones: p.acciones === '*' ? 'TODAS' : p.acciones.join(', '),
    exceptuados: p.excepto.join(', ') || '-',
    activa: estado.get(p.codigo) === 1 ? 'SI' : 'NO',
  }));
}

module.exports = { evaluar, matriz };