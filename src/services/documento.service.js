const db = require('../db/database');

const SELECT_BASE = `
  SELECT doc.id, doc.titulo, doc.descripcion, doc.propietario,
         d.nombre AS departamento, doc.nivel_confidencialidad,
         doc.estado, doc.pais, doc.fecha_creacion
  FROM documentos doc
  JOIN departamentos d ON d.id = doc.departamento_id
`;

function buscarPorId(id) {
  return db.prepare(`${SELECT_BASE} WHERE doc.id = ?`).get(id);
}

module.exports = { buscarPorId, SELECT_BASE };