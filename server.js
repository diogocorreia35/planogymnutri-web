// Servidor do NutriFit (Express).
// Entrega as páginas da pasta public e responde aos pedidos da API (/api/...).
// Para arrancar: npm start  (ou npm run dev, que reinicia sozinho quando alteras um ficheiro).

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Permite ler o JSON que as páginas enviam (registo, login, etc.).
app.use(express.json());

// Sessões: guardam quem tem o login feito. O browser recebe só um cookie com um número.
app.use(session({
  secret: 'cfa849c4bdf91a040d43025a5fd16477ff34d2c864c61bd2000ed2c2f4d8bb91', // chave que protege o cookie da sessão
  resave: false,
  saveUninitialized: false
}));

// Entrega os ficheiros da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de autenticação: /api/auth/registo, /login, /logout e /eu.
// A base de dados (db.js) é aberta, e criada se não existir, quando este ficheiro é carregado.
app.use('/api/auth', require('./routes/auth'));

// Arranca o servidor. Se a porta 3000 já estiver ocupada, avisa e termina.
app.listen(PORT, (erro) => {
  if (erro) {
    console.error('Não foi possível arrancar o servidor:', erro.message);
    process.exit(1);
  }
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
