const bcrypt = require('bcryptjs');
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

function listar() {
  return db.prepare(`${SELECT_BASE} ORDER BY u.id`).all().map(sinPassword);
}

function idRol(nombre) {
  const r = db.prepare('SELECT id FROM roles WHERE nombre = ?').get(String(nombre).toUpperCase());
  return r ? r.id : null;
}

function idDepartamento(nombre) {
  const d = db.prepare('SELECT id FROM departamentos WHERE nombre = ?').get(String(nombre).toUpperCase());
  return d ? d.id : null;
}

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

// Convierte los datos recibidos en columnas de la tabla, validando cada uno
function aColumnas(datos) {
  const c = {};
  if (datos.usuario !== undefined) c.usuario = datos.usuario;
  if (datos.nombre !== undefined) c.nombre = datos.nombre;
  if (datos.correo !== undefined) c.correo = datos.correo;
  if (datos.password !== undefined) c.password = bcrypt.hashSync(String(datos.password), 10);
  if (datos.rol !== undefined) {
    c.rol_id = idRol(datos.rol);
    if (!c.rol_id) throw error(400, `Rol ${datos.rol} no existe`);
  }
  if (datos.departamento !== undefined) {
    c.departamento_id = idDepartamento(datos.departamento);
    if (!c.departamento_id) throw error(400, `Departamento ${datos.departamento} no existe`);
  }
  if (datos.nivel_seguridad !== undefined) {
    const n = Number(datos.nivel_seguridad);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw error(400, 'nivel_seguridad debe ser un entero de 1 a 5');
    c.nivel_seguridad = n;
  }
  if (datos.pais !== undefined) c.pais = String(datos.pais).toUpperCase();
  if (datos.tipo_contrato !== undefined) {
    c.tipo_contrato = String(datos.tipo_contrato).toUpperCase();
    if (!['INTERNO', 'EXTERNO'].includes(c.tipo_contrato)) throw error(400, 'tipo_contrato debe ser INTERNO o EXTERNO');
  }
  if (datos.estado !== undefined) {
    c.estado = String(datos.estado).toUpperCase();
    if (!['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].includes(c.estado)) throw error(400, 'estado debe ser ACTIVO, INACTIVO o SUSPENDIDO');
  }
  return c;
}

function ejecutar(fn) {
  try {
    return fn();
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) throw error(409, 'El usuario o correo ya existe');
    throw e;
  }
}

function crear(datos) {
  const obligatorios = ['usuario', 'nombre', 'correo', 'password', 'rol', 'departamento', 'nivel_seguridad', 'pais', 'tipo_contrato'];
  const faltan = obligatorios.filter(k => datos[k] === undefined || datos[k] === '');
  if (faltan.length) throw error(400, `Faltan campos: ${faltan.join(', ')}`);

  const c = aColumnas({ estado: 'ACTIVO', ...datos });
  const cols = Object.keys(c);
  return ejecutar(() => {
    const r = db.prepare(`INSERT INTO usuarios (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
      .run(...Object.values(c));
    return sinPassword(buscarPorId(Number(r.lastInsertRowid)));
  });
}

function actualizar(id, datos) {
  const c = aColumnas(datos);
  const cols = Object.keys(c);
  if (cols.length === 0) throw error(400, 'No se envio ningun campo para modificar');
  return ejecutar(() => {
    db.prepare(`UPDATE usuarios SET ${cols.map(k => `${k} = ?`).join(', ')} WHERE id = ?`)
      .run(...Object.values(c), id);
    return sinPassword(buscarPorId(id));
  });
}

module.exports = { buscarPorLogin, buscarPorId, sinPassword, listar, crear, actualizar };