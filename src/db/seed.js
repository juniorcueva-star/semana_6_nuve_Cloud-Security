const bcrypt = require('bcryptjs');
const db = require('./database');

// 1. Limpiar datos anteriores
db.exec(`
  DELETE FROM auditoria; DELETE FROM documentos; DELETE FROM usuarios;
  DELETE FROM rol_permiso; DELETE FROM permisos; DELETE FROM roles;
  DELETE FROM departamentos; DELETE FROM politicas;
  DELETE FROM sqlite_sequence;
`);

// 2. Departamentos
const departamentos = ['TI', 'FINANZAS', 'RRHH', 'AUDITORIA'];
const insDep = db.prepare('INSERT INTO departamentos (nombre) VALUES (?)');
departamentos.forEach(d => insDep.run(d));

// 3. Roles
const roles = [
  ['ADMINISTRADOR', 'Administra usuarios, roles y configuraciones'],
  ['GERENTE', 'Supervisa documentos de su area'],
  ['SUPERVISOR', 'Revisa y aprueba documentos'],
  ['EMPLEADO', 'Crea y consulta documentos de su area'],
  ['AUDITOR', 'Consulta documentos y registros de auditoria'],
  ['INVITADO', 'Acceso temporal a determinados documentos'],
];
const insRol = db.prepare('INSERT INTO roles (nombre, descripcion) VALUES (?, ?)');
roles.forEach(r => insRol.run(...r));

// 4. Permisos (operaciones del sistema)
const permisos = [
  ['DOC_CREAR', 'Crear documento'],
  ['DOC_CONSULTAR', 'Consultar documento'],
  ['DOC_MODIFICAR', 'Modificar documento'],
  ['DOC_ELIMINAR', 'Eliminar documento'],
  ['DOC_APROBAR', 'Aprobar documento'],
  ['AUDITORIA_VER', 'Ver auditoria'],
  ['USUARIOS_GESTIONAR', 'Gestionar usuarios'],
  ['ROLES_ASIGNAR', 'Asignar roles'],
];
const insPerm = db.prepare('INSERT INTO permisos (codigo, descripcion) VALUES (?, ?)');
permisos.forEach(p => insPerm.run(...p));

// 5. Matriz RBAC (punto 4 del laboratorio)
const matriz = {
  ADMINISTRADOR: ['DOC_CREAR', 'DOC_CONSULTAR', 'DOC_MODIFICAR', 'DOC_ELIMINAR', 'DOC_APROBAR', 'AUDITORIA_VER', 'USUARIOS_GESTIONAR', 'ROLES_ASIGNAR'],
  GERENTE:       ['DOC_CREAR', 'DOC_CONSULTAR', 'DOC_MODIFICAR', 'DOC_ELIMINAR', 'DOC_APROBAR', 'AUDITORIA_VER'],
  SUPERVISOR:    ['DOC_CREAR', 'DOC_CONSULTAR', 'DOC_MODIFICAR', 'DOC_APROBAR'],
  EMPLEADO:      ['DOC_CREAR', 'DOC_CONSULTAR', 'DOC_MODIFICAR'],
  AUDITOR:       ['DOC_CONSULTAR', 'AUDITORIA_VER'],
  INVITADO:      ['DOC_CONSULTAR'],
};
const insRP = db.prepare(`
  INSERT INTO rol_permiso (rol_id, permiso_id)
  SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = ? AND p.codigo = ?
`);
for (const [rol, lista] of Object.entries(matriz)) {
  lista.forEach(codigo => insRP.run(rol, codigo));
}

// 6. Usuarios de prueba (todos con contrasena 123456)
const hash = bcrypt.hashSync('123456', 10);
const usuarios = [
  // usuario, nombre, correo, rol, departamento, nivel, pais, contrato, estado
  ['admin', 'Admin General', 'admin@techcorp.com', 'ADMINISTRADOR', 'TI', 5, 'PERU', 'INTERNO', 'ACTIVO'],
  ['rosa.diaz', 'Rosa Diaz', 'rosa.diaz@techcorp.com', 'GERENTE', 'FINANZAS', 5, 'PERU', 'INTERNO', 'ACTIVO'],
  ['carlos.ruiz', 'Carlos Ruiz', 'carlos.ruiz@techcorp.com', 'SUPERVISOR', 'FINANZAS', 3, 'PERU', 'INTERNO', 'ACTIVO'],
  ['luis.perez', 'Luis Perez', 'luis.perez@techcorp.com', 'EMPLEADO', 'FINANZAS', 2, 'PERU', 'INTERNO', 'ACTIVO'],
  ['maria.lopez', 'Maria Lopez', 'maria.lopez@techcorp.com', 'EMPLEADO', 'RRHH', 2, 'PERU', 'INTERNO', 'ACTIVO'],
  ['jorge.vega', 'Jorge Vega', 'jorge.vega@techcorp.com', 'AUDITOR', 'AUDITORIA', 4, 'PERU', 'INTERNO', 'ACTIVO'],
  ['invitado.ext', 'Pedro Invitado', 'pedro@consultora.com', 'INVITADO', 'FINANZAS', 1, 'PERU', 'EXTERNO', 'ACTIVO'],
  ['sofia.inactiva', 'Sofia Ramos', 'sofia.ramos@techcorp.com', 'EMPLEADO', 'FINANZAS', 2, 'PERU', 'INTERNO', 'INACTIVO'],
  ['diego.chile', 'Diego Soto', 'diego.soto@techcorp.com', 'EMPLEADO', 'FINANZAS', 3, 'CHILE', 'INTERNO', 'ACTIVO'],
];
const insUsr = db.prepare(`
  INSERT INTO usuarios (usuario, nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado)
  VALUES (?, ?, ?, ?, (SELECT id FROM roles WHERE nombre = ?), (SELECT id FROM departamentos WHERE nombre = ?), ?, ?, ?, ?)
`);
usuarios.forEach(([u, n, c, rol, dep, niv, pais, contr, est]) =>
  insUsr.run(u, n, c, hash, rol, dep, niv, pais, contr, est));

// 7. Documentos de prueba
const documentos = [
  // titulo, descripcion, propietario, departamento, nivel, estado, pais
  ['Presupuesto 2027', 'Presupuesto anual de la empresa', 'carlos.ruiz', 'FINANZAS', 3, 'PENDIENTE', 'PERU'],
  ['Reporte de gastos Q3', 'Gastos del tercer trimestre', 'luis.perez', 'FINANZAS', 2, 'BORRADOR', 'PERU'],
  ['Plan financiero confidencial', 'Proyecciones a 5 anos', 'rosa.diaz', 'FINANZAS', 4, 'APROBADO', 'PERU'],
  ['Estrategia de fusion', 'Documento de alta confidencialidad', 'rosa.diaz', 'FINANZAS', 5, 'PENDIENTE', 'PERU'],
  ['Planilla de sueldos', 'Planilla mensual', 'maria.lopez', 'RRHH', 2, 'PENDIENTE', 'PERU'],
  ['Manual de proveedores', 'Guia publica para proveedores', 'rosa.diaz', 'FINANZAS', 1, 'PUBLICADO', 'PERU'],
];
const insDoc = db.prepare(`
  INSERT INTO documentos (titulo, descripcion, propietario, departamento_id, nivel_confidencialidad, estado, pais)
  VALUES (?, ?, (SELECT id FROM usuarios WHERE usuario = ?), (SELECT id FROM departamentos WHERE nombre = ?), ?, ?, ?)
`);
documentos.forEach(d => insDoc.run(...d));

// 8. Politicas ABAC (punto 6). Se pueden activar o desactivar sin tocar el codigo
const politicas = [
  ['P1_DEPARTAMENTO', 'Departamento', 'usuario.departamento == documento.departamento'],
  ['P2_NIVEL', 'Nivel de seguridad', 'usuario.nivel_seguridad >= documento.nivel_confidencialidad'],
  ['P3_PROPIEDAD', 'Propiedad', 'Solo el propietario modifica (excepto GERENTE y ADMINISTRADOR)'],
  ['P4_HORARIO', 'Horario', 'Nivel >= 4 solo entre 08:00 y 18:00'],
  ['P5_PAIS', 'Pais', 'usuario.pais == documento.pais'],
  ['P6_DISPOSITIVO', 'Dispositivo', 'Nivel >= 4 solo desde dispositivo CORPORATIVO'],
  ['P7_ESTADO', 'Estado del usuario', 'usuario.estado == ACTIVO'],
  ['P8_INVITADO', 'Invitados', 'EXTERNO, nivel <= 1 y documento PUBLICADO'],
];
const insPol = db.prepare('INSERT INTO politicas (codigo, nombre, descripcion) VALUES (?, ?, ?)');
politicas.forEach(p => insPol.run(...p));

console.log('Base de datos creada con datos de prueba:');
for (const t of ['departamentos', 'roles', 'permisos', 'rol_permiso', 'usuarios', 'documentos', 'politicas']) {
  console.log(`  ${t}: ${db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n}`);
}