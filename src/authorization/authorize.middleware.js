const { autorizar } = require('./authorization.service');

// Uso en rutas: requierePermiso('VIEW_AUDIT', 'auditoria')
function requierePermiso(accion, recurso = 'sistema') {
  return (req, res, next) => {
    const decision = autorizar({ usuario: req.usuario, accion, recurso, entorno: req.entorno, ip: req.ip });
    if (!decision.permitido) {
      return res.status(403).json({ error: 'ACCESO DENEGADO', etapa: decision.etapa, motivo: decision.motivo });
    }
    next();
  };
}

module.exports = { requierePermiso };