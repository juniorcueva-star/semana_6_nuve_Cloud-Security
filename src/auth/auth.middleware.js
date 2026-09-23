const authService = require('./auth.service');
const usuarioService = require('../services/usuario.service');

// Verifica el token y deja en req.usuario los datos ACTUALES del usuario
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debe iniciar sesion (token no enviado)' });
  }

  try {
    const payload = authService.verificarToken(token);
    const u = usuarioService.buscarPorId(Number(payload.sub));
    if (!u) return res.status(401).json({ error: 'Usuario no existe' });

    req.usuario = usuarioService.sinPassword(u);
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message === 'La sesion fue cerrada' ? e.message : 'Token invalido o expirado' });
  }
}

module.exports = { autenticar };