const db = require('../db/database');

const insertar = db.prepare(`
  INSERT INTO auditoria (usuario, recurso, accion, resultado, motivo, direccion_ip)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function registrar({ usuario, recurso, accion, resultado, motivo, ip }) {
  insertar.run(usuario ?? 'anonimo', recurso ?? null, accion, resultado, motivo ?? null, ip ?? null);
}

module.exports = { registrar };
