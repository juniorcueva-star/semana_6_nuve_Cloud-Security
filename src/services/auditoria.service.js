const db = require('../db/database');

const insertar = db.prepare(`
  INSERT INTO auditoria (usuario, recurso, accion, resultado, motivo, direccion_ip)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function registrar({ usuario, recurso, accion, resultado, motivo, ip }) {
  insertar.run(usuario ?? 'anonimo', recurso ?? null, accion, resultado, motivo ?? null, ip ?? null);
}

// Filtros opcionales: usuario, resultado (PERMITIDO/DENEGADO), accion, limite
function listar({ usuario, resultado, accion, limite = 100 } = {}) {
  const where = [];
  const params = [];
  if (usuario) { where.push('usuario = ?'); params.push(usuario); }
  if (resultado) { where.push('resultado = ?'); params.push(String(resultado).toUpperCase()); }
  if (accion) { where.push('accion = ?'); params.push(String(accion).toUpperCase()); }
  const sql = `SELECT * FROM auditoria ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ?`;
  return db.prepare(sql).all(...params, Number(limite) || 100);
}

module.exports = { registrar, listar };