const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Deve corresponder ao limite apresentado no formulário de registo.
const PASSWORD_MIN = 6;

// Evita revelar se um email existe, mantendo o custo da comparação semelhante.
const HASH_FALSO = bcrypt.hashSync('palavra-passe-inventada', 10);

// POST /api/auth/registo : cria uma conta nova
router.post('/registo', async (req, res) => {
  const corpo = req.body || {};
  if (typeof corpo.nome !== 'string' || typeof corpo.email !== 'string' || typeof corpo.password !== 'string') {
    return res.status(400).json({ erro: 'Preenche todos os campos.' });
  }
  const nome = corpo.nome.trim();
  const email = corpo.email.trim().toLowerCase();
  const password = corpo.password;

  // A validação do servidor é obrigatória, mesmo que o cliente valide os campos.
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
    // Guarda apenas o hash; a palavra-passe original não é persistida.
    const hash = await bcrypt.hash(password, 10);

    // Os parâmetros mantêm os valores separados da instrução SQL.
    db.prepare('INSERT INTO utilizadores (nome, email, password_hash) VALUES (?, ?, ?)')
      .run(nome, email, hash);

    res.status(201).json({ ok: true, nome });
  } catch (erro) {
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
    const utilizador = db
      .prepare('SELECT id, nome, email, password_hash FROM utilizadores WHERE email = ?')
      .get(email);

    // Compara com o hash guardado; se o email não existir, usa o hash fictício.
    const certa = await bcrypt.compare(corpo.password, utilizador ? utilizador.password_hash : HASH_FALSO);

    // Usa a mesma resposta para não revelar se o email está registado.
    if (!utilizador || !certa) {
      return res.status(401).json({ erro: 'Email ou palavra-passe incorretos.' });
    }

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

// Devolve o estado de autenticação para atualizar a navegação do cliente.
router.get('/eu', (req, res) => {
  res.set('Cache-Control', 'no-store');

  const id = req.session.utilizadorId;
  if (!id) {
    return res.json({ logado: false });
  }

  const utilizador = db.prepare('SELECT id, nome, email FROM utilizadores WHERE id = ?').get(id);
  if (!utilizador) {
    return req.session.destroy(() => res.json({ logado: false }));
  }

  res.json({ logado: true, utilizador }); 
});

module.exports = router;
