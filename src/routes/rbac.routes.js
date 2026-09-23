const express = require('express');
const { autenticar } = require('../auth/auth.middleware');
const { requierePermiso } = require('../authorization/authorize.middleware');
const rbac = require('../authorization/rbac/rbac.service');

const router = express.Router();

// GET /rbac/mis-permisos -> permisos del usuario logueado
router.get('/mis-permisos', autenticar, (req, res) => {
  res.json({ usuario: req.usuario.usuario, rol: req.usuario.rol, permisos: rbac.permisosDeRol(req.usuario.rol) });
});

// GET /rbac/matriz -> matriz completa (solo quien puede asignar roles)
router.get('/matriz', autenticar, requierePermiso('ASSIGN_ROLES', 'rbac'), (req, res) => {
  res.json(rbac.matriz());
});

module.exports = router;