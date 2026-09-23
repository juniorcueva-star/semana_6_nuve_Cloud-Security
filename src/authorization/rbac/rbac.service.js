const db = require('../../db/database');
const ACCIONES = require('../acciones');

// Los permisos se leen de la tabla rol_permiso: para cambiar la matriz
// no se toca el codigo, solo la base de datos
const qPermisosDeRol = db.prepare(`
  SELECT p.codigo
  FROM rol_permiso rp
  JOIN roles r ON r.id = rp.rol_id
  JOIN permisos p ON p.id = rp.permiso_id
  WHERE r.nombre = ?
`);

function permisosDeRol(rol) {
  return qPermisosDeRol.all(rol).map(f => f.codigo);
}

// usuario -> rol -> permisos -> operacion
function evaluar(rol, accion) {
  const permiso = ACCIONES[accion];
  if (!permiso) {
    return { permitido: false, motivo: `Accion desconocida: ${accion}` };
  }
  const permitido = permisosDeRol(rol).includes(permiso);
  return {
    permitido,
    motivo: permitido
      ? `Rol ${rol} tiene el permiso ${permiso}`
      : `Rol ${rol} no tiene el permiso ${permiso}`,
  };
}

// Matriz completa roles x permisos (entregable 6)
function matriz() {
  const roles = db.prepare('SELECT nombre FROM roles ORDER BY id').all().map(r => r.nombre);
  const permisos = db.prepare('SELECT codigo FROM permisos ORDER BY id').all().map(p => p.codigo);
  return roles.map(rol => {
    const suyos = permisosDeRol(rol);
    const fila = { rol };
    permisos.forEach(p => { fila[p] = suyos.includes(p) ? 'SI' : 'NO'; });
    return fila;
  });
}

module.exports = { evaluar, permisosDeRol, matriz };