const { autorizar } = require('./authorization.service');
const documentoService = require('../services/documento.service');

function denegar(res, decision) {
  return res.status(403).json({
    error: 'ACCESO DENEGADO',
    etapa: decision.etapa,
    motivo: decision.motivo,
    politicas: decision.abac || [],
  });
}

// Para operaciones sin documento: requierePermiso('VIEW_AUDIT', 'auditoria')
function requierePermiso(accion, recurso = 'sistema') {
  return (req, res, next) => {
    const decision = autorizar({ usuario: req.usuario, accion, recurso, entorno: req.entorno, ip: req.ip });
    if (!decision.permitido) return denegar(res, decision);
    next();
  };
}

// Para operaciones sobre un documento existente: requierePermisoSobreDocumento('UPDATE')
// Carga el documento de la URL (/:id), evalua RBAC + ABAC y lo deja en req.documento
function requierePermisoSobreDocumento(accion) {
  return (req, res, next) => {
    const documento = documentoService.buscarPorId(Number(req.params.id));
    if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });

    const decision = autorizar({ usuario: req.usuario, accion, documento, entorno: req.entorno, ip: req.ip });
    if (!decision.permitido) return denegar(res, decision);

    req.documento = documento;
    next();
  };
}

module.exports = { requierePermiso, requierePermisoSobreDocumento, denegar };