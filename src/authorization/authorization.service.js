const rbac = require('./rbac/rbac.service');
const auditoria = require('../services/auditoria.service');

// Punto unico de decision: RBAC primero, luego ABAC (se agrega en el paso 7)
function autorizar({ usuario, accion, documento = null, recurso = 'sistema', entorno = {}, ip }) {
  const nombreRecurso = documento ? `documento-${documento.id}` : recurso;
  const registrar = (resultado, motivo) =>
    auditoria.registrar({ usuario: usuario.usuario, recurso: nombreRecurso, accion, resultado, motivo, ip });

  // Etapa 1: RBAC
  const r = rbac.evaluar(usuario.rol, accion);
  if (!r.permitido) {
    registrar('DENEGADO', `RBAC: ${r.motivo}`);
    return { permitido: false, etapa: 'RBAC', motivo: r.motivo };
  }

  // Etapa 2: ABAC (paso 7)

  registrar('PERMITIDO', `RBAC: ${r.motivo}`);
  return { permitido: true, etapa: 'RBAC', motivo: r.motivo };
}

module.exports = { autorizar };