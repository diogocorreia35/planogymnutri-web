const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db'); // abre (ou cria) a base de dados quando o servidor arranca

const app = express();
const PORT = 3000;

// Permite ler JSON enviado pelo site (formulários, planos, etc.)
app.use(express.json());

// Sessões: é isto que vai manter o utilizador com login feito
app.use(session({
  secret: 'cfa849c4bdf91a040d43025a5fd16477ff34d2c864c61bd2000ed2c2f4d8bb91', // chave das sessões (serve só para desenvolvimento)
  resave: false,
  saveUninitialized: false
}));

// Serve a pasta "public" (HTML, CSS e JavaScript do site)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', require('./routes/auth'));

// Rota de teste: confirma que o site fala com o servidor, que as sessões funcionam
// e que o servidor consegue ler a base de dados
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

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
