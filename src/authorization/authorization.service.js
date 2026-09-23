const rbac = require('./rbac/rbac.service');
const abac = require('./abac/abac.engine');
const auditoria = require('../services/auditoria.service');

// Punto unico de decision (punto 7): RBAC = PERMITIDO  AND  ABAC = PERMITIDO
function autorizar({ usuario, accion, documento = null, recurso = 'sistema', entorno = {}, ip, auditar = true }) {
  const nombreRecurso = documento ? `documento-${documento.id ?? 'nuevo'}` : recurso;
  const registrar = (resultado, motivo) => {
    if (auditar) auditoria.registrar({ usuario: usuario.usuario, recurso: nombreRecurso, accion, resultado, motivo, ip });
  };

  // Etapa 1: RBAC
  const r = rbac.evaluar(usuario.rol, accion);
  if (!r.permitido) {
    registrar('DENEGADO', `RBAC: ${r.motivo}`);
    return { permitido: false, etapa: 'RBAC', motivo: r.motivo, rbac: r };
  }

  // Etapa 2: ABAC
  const a = abac.evaluar({ usuario, accion, documento, entorno });
  if (!a.permitido) {
    registrar('DENEGADO', `ABAC: ${a.motivo}`);
    return { permitido: false, etapa: 'ABAC', motivo: a.motivo, rbac: r, abac: a.evaluadas };
  }

  registrar('PERMITIDO', `RBAC y ABAC OK`);
  return { permitido: true, etapa: 'RBAC+ABAC', motivo: 'Acceso autorizado', rbac: r, abac: a.evaluadas };
}

module.exports = { autorizar };