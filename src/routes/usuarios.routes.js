const express = require('express');
const { autenticar } = require('../auth/auth.middleware');
const { requierePermiso, denegar } = require('../authorization/authorize.middleware');
const { autorizar } = require('../authorization/authorization.service');
const usuarioService = require('../services/usuario.service');

const router = express.Router();
router.use(autenticar);

function responderError(res, e) {
  res.status(e.status || 500).json({ error: e.message });
}

// GET /usuarios
router.get('/', requierePermiso('MANAGE_USERS', 'usuarios'), (req, res) => {
  res.json(usuarioService.listar());
});

// POST /usuarios -> registrar usuario (si trae rol, tambien exige ASSIGN_ROLES)
router.post('/', requierePermiso('MANAGE_USERS', 'usuarios'), requierePermiso('ASSIGN_ROLES', 'usuarios'), (req, res) => {
  try {
    res.status(201).json(usuarioService.crear(req.body || {}));
  } catch (e) {
    responderError(res, e);
  }
});

// PUT /usuarios/:id -> modificar, activar/desactivar, asignar rol, departamento o nivel
router.put('/:id', requierePermiso('MANAGE_USERS', 'usuarios'), (req, res) => {
  const id = Number(req.params.id);
  const datos = req.body || {};

  if (!usuarioService.buscarPorId(id)) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Cambiar el rol es una operacion aparte en la matriz RBAC
  if (datos.rol !== undefined) {
    const d = autorizar({ usuario: req.usuario, accion: 'ASSIGN_ROLES', recurso: `usuario-${id}`, entorno: req.entorno, ip: req.ip });
    if (!d.permitido) return denegar(res, d);
  }

  // Un administrador no puede desactivarse ni quitarse el rol a si mismo
  if (id === req.usuario.id && (datos.estado !== undefined || datos.rol !== undefined)) {
    return res.status(400).json({ error: 'No puede cambiar su propio estado o rol' });
  }

  try {
    res.json(usuarioService.actualizar(id, datos));
  } catch (e) {
    responderError(res, e);
  }
});

module.exports = router;