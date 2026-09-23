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

function listar() {
  return db.prepare(`${SELECT_BASE} ORDER BY doc.id`).all();
}

function idDepartamento(nombre) {
  const d = db.prepare('SELECT id FROM departamentos WHERE nombre = ?').get(nombre);
  return d ? d.id : null;
}

function crear({ titulo, descripcion, propietario, departamento, nivel_confidencialidad, pais }) {
  const r = db.prepare(`
    INSERT INTO documentos (titulo, descripcion, propietario, departamento_id, nivel_confidencialidad, estado, pais)
    VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?)
  `).run(titulo, descripcion ?? null, propietario, idDepartamento(departamento), nivel_confidencialidad, pais);
  return buscarPorId(Number(r.lastInsertRowid));
}

function actualizar(id, { titulo, descripcion }) {
  db.prepare('UPDATE documentos SET titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion) WHERE id = ?')
    .run(titulo ?? null, descripcion ?? null, id);
  return buscarPorId(id);
}

function eliminar(id) {
  db.prepare('DELETE FROM documentos WHERE id = ?').run(id);
}

function aprobar(id) {
  db.prepare("UPDATE documentos SET estado = 'APROBADO' WHERE id = ?").run(id);
  return buscarPorId(id);
}

module.exports = { buscarPorId, listar, idDepartamento, crear, actualizar, eliminar, aprobar };