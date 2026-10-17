const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

// Um "router" é um conjunto de rotas. No server.js fica ligado ao endereço /api/auth,
// por isso a rota '/registo' abaixo responde em /api/auth/registo
const router = express.Router();

// Tamanho mínimo da palavra-passe (tem de ser igual ao da página registo.html)
const PASSWORD_MIN = 8;

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

    // A conta fica criada. O utilizador inicia sessão depois, no login (passo 3B)
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

module.exports = router;
