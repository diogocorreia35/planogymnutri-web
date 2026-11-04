const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Analisa os pedidos JSON enviados pelo cliente.
app.use(express.json());

// Mantém o estado de autenticação entre pedidos.
app.use(session({
  secret: 'cfa849c4bdf91a040d43025a5fd16477ff34d2c864c61bd2000ed2c2f4d8bb91', // Substituir por um segredo de ambiente antes de publicar.
  resave: false,
  saveUninitialized: false
}));

// Disponibiliza os ficheiros estáticos do site.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/auth'));

// Verifica a ligação ao servidor, às sessões e à base de dados.
app.get('/api/teste', (req, res) => {
  req.session.visitas = (req.session.visitas || 0) + 1;
  const contar = (tabela) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get().n;
  res.json({
    mensagem: 'O servidor está a responder',
    hora: new Date().toLocaleTimeString('pt-PT'),
    visitas: req.session.visitas,
    exercicios: contar('exercicios'),
    alimentos: contar('alimentos')
  });
});

app.listen(PORT, (erro) => {
  if (erro) {
    // Um exemplo comum é a porta 3000 já estar em uso.
    console.error('Não foi possível arrancar o servidor:', erro.message);
    process.exit(1);
  }
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
