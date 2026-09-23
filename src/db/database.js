const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, '..', '..', 'securedocs.db'));
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS rol_permiso (
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    permiso_id INTEGER NOT NULL REFERENCES permisos(id),
    PRIMARY KEY (rol_id, permiso_id)
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    nivel_seguridad INTEGER NOT NULL CHECK (nivel_seguridad BETWEEN 1 AND 5),
    pais TEXT NOT NULL,
    tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('INTERNO','EXTERNO')),
    estado TEXT NOT NULL CHECK (estado IN ('ACTIVO','INACTIVO','SUSPENDIDO'))
  );

  CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    propietario INTEGER NOT NULL REFERENCES usuarios(id),
    departamento_id INTEGER NOT NULL REFERENCES departamentos(id),
    nivel_confidencialidad INTEGER NOT NULL CHECK (nivel_confidencialidad BETWEEN 1 AND 5),
    estado TEXT NOT NULL CHECK (estado IN ('BORRADOR','PENDIENTE','APROBADO','PUBLICADO')),
    pais TEXT NOT NULL,
    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS politicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activa INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    recurso TEXT,
    accion TEXT,
    fecha TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    resultado TEXT NOT NULL,
    motivo TEXT,
    direccion_ip TEXT
  );
`);

module.exports = db;