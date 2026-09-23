const db = require('../db/database');

const SELECT_BASE = `
  SELECT u.id, u.usuario, u.nombre, u.correo, u.password,
         r.nombre AS rol, d.nombre AS departamento,
         u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  JOIN departamentos d ON d.id = u.departamento_id
`;

function buscarPorLogin(login) {
  return db.prepare(`${SELECT_BASE} WHERE u.usuario = ? OR u.correo = ?`).get(login, login);
}

function buscarPorId(id) {
  return db.prepare(`${SELECT_BASE} WHERE u.id = ?`).get(id);
}

// Nunca devolver la contrasena al cliente
function sinPassword(u) {
  const { password, ...resto } = u;
  return resto;
}

module.exports = { buscarPorLogin, buscarPorId, sinPassword };