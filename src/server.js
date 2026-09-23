require('dotenv').config();
const express = require('express');
const entorno = require('./authorization/abac/entorno.middleware');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(entorno);

app.get('/api/salud', (req, res) => {
  res.json({ mensaje: 'SecureDocs funcionando' });
});

// Modulo de autenticacion
app.use('/auth', require('./routes/auth.routes'));

// Modulo RBAC
app.use('/rbac', require('./routes/rbac.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});