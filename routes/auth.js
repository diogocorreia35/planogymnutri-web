const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

// Um "router" é um conjunto de rotas. No server.js fica ligado ao endereço /api/auth,
// por isso a rota '/registo' abaixo responde em /api/auth/registo, e assim por diante
const router = express.Router();

// Tamanho mínimo da palavra-passe (tem de ser igual ao da página registo.html)
const PASSWORD_MIN = 6;

// Hash de uma palavra-passe inventada. É usado no login quando o email não existe,
// para a resposta demorar o mesmo tempo e ninguém descobrir que emails estão registados
const HASH_FALSO = bcrypt.hashSync('palavra-passe-inventada', 10);

// POST /api/auth/registo : cria uma conta nova
router.post('/registo', async (req, res) => {
  // Dados que a página enviou (req.body). Têm de chegar como texto
  const corpo = req.body || {};
  if (typeof corpo.nome !== 'string' || typeof corpo.email !== 'string' || typeof corpo.password !== 'string') {
    return res.status(400).json({ erro: 'Preenche todos os campos.' });
  }
  const nome = corpo.nome.trim();
  const email = corpo.email.trim().toLowerCase();
  const password = corpo.password;

  // Validação no servidor (é a que conta, porque o formulário pode ser contornado)
  if (!nome || !email || !password) {
    return res.status(400).json({ erro: 'Preenche todos os campos.' });
  }
  if (nome.length > 100) {
    return res.status(400).json({ erro: 'O nome é demasiado longo.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'O email não é válido.' });
  }
  if (password.length < PASSWORD_MIN) {
    return res.status(400).json({ erro: `A palavra-passe tem de ter pelo menos ${PASSWORD_MIN} caracteres.` });
  }

  try {
    // O hash é uma versão "baralhada" da palavra-passe. A verdadeira nunca é guardada
    const hash = await bcrypt.hash(password, 10);

    // Os "?" são preenchidos com os valores a seguir. Isto impede que alguém estrague
    // a base de dados escrevendo código nos campos do formulário
    db.prepare('INSERT INTO utilizadores (nome, email, password_hash) VALUES (?, ?, ?)')
      .run(nome, email, hash);

    // A conta fica criada. O utilizador inicia sessão depois, no login
    res.status(201).json({ ok: true, nome });
  } catch (erro) {
    // A coluna email é UNIQUE: se já existir, a base de dados recusa
    if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ erro: 'Já existe uma conta com este email.' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Aconteceu um erro no servidor. Tenta outra vez.' });
  }
});

// POST /api/auth/login : inicia sessão
router.post('/login', async (req, res) => {
  const corpo = req.body || {};
  if (typeof corpo.email !== 'string' || typeof corpo.password !== 'string' || !corpo.email.trim() || !corpo.password) {
    return res.status(400).json({ erro: 'Preenche o email e a palavra-passe.' });
  }
  const email = corpo.email.trim().toLowerCase();

  try {
    // Procura o utilizador pelo email
    const utilizador = db
      .prepare('SELECT id, nome, email, password_hash FROM utilizadores WHERE email = ?')
      .get(email);

    // Compara a palavra-passe escrita com o hash guardado (nunca se "desfaz" o hash)
    const certa = await bcrypt.compare(corpo.password, utilizador ? utilizador.password_hash : HASH_FALSO);

    // A mesma mensagem para "email não existe" e "palavra-passe errada"
    if (!utilizador || !certa) {
      return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
    }

    // Guarda na sessão quem é o utilizador: é isto que o mantém "com login feito"
    req.session.utilizadorId = utilizador.id;

    res.json({ ok: true, utilizador: { id: utilizador.id, nome: utilizador.nome, email: utilizador.email } });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Aconteceu um erro no servidor. Tenta outra vez.' });
  }
});

// POST /api/auth/logout : termina a sessão
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/eu : diz quem tem a sessão iniciada (as páginas usam isto para saber
// se mostram "Entrar / Criar conta" ou "Olá, nome / O meu perfil / Sair")
router.get('/eu', (req, res) => {
  res.set('Cache-Control', 'no-store'); // o browser não pode guardar esta resposta

  const id = req.session.utilizadorId;
  if (!id) {
    return res.json({ logado: false });
  }

  const utilizador = db.prepare('SELECT id, nome, email FROM utilizadores WHERE id = ?').get(id);
  if (!utilizador) {
    // A conta já não existe: limpa a sessão
    return req.session.destroy(() => res.json({ logado: false }));
  }

  res.json({ logado: true, utilizador }); 
});

module.exports = router;
