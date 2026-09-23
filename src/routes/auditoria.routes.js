const express = require('express');
const { autenticar } = require('../auth/auth.middleware');
const { requierePermiso } = require('../authorization/authorize.middleware');
const auditoria = require('../services/auditoria.service');

const router = express.Router();

// GET /auditoria?usuario=carlos.ruiz&resultado=DENEGADO&accion=READ&limite=20
router.get('/', autenticar, requierePermiso('VIEW_AUDIT', 'auditoria'), (req, res) => {
  res.json(auditoria.listar(req.query));
});

module.exports = router;