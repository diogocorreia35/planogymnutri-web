const Database = require('better-sqlite3');
const path = require('path');

// Abre o ficheiro database.sqlite (se não existir, é criado agora)
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Sem esta linha o SQLite ignora as chaves estrangeiras (e o ON DELETE CASCADE)
db.pragma('foreign_keys = ON');

// ---------- Tabelas (só são criadas se ainda não existirem) ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS utilizadores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    idade         INTEGER,
    altura_cm     INTEGER,
    peso_kg       REAL,
    objetivo      TEXT CHECK (objetivo IN ('perder peso', 'ganhar massa muscular', 'manter peso')),
    criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT NOT NULL UNIQUE,
    grupo_muscular TEXT NOT NULL,
    dificuldade    TEXT NOT NULL CHECK (dificuldade IN ('iniciante', 'intermédio', 'avançado'))
  );

  CREATE TABLE IF NOT EXISTS planos_treino (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    nome          TEXT NOT NULL,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plano_treino_exercicios (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    plano_id     INTEGER NOT NULL REFERENCES planos_treino(id) ON DELETE CASCADE,
    exercicio_id INTEGER NOT NULL REFERENCES exercicios(id),
    dia_semana   INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    series       INTEGER NOT NULL CHECK (series BETWEEN 1 AND 10),
    repeticoes   INTEGER NOT NULL CHECK (repeticoes BETWEEN 1 AND 100)
  );

  CREATE TABLE IF NOT EXISTS alimentos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL UNIQUE,
    categoria     TEXT NOT NULL,
    calorias_100g REAL NOT NULL,
    proteina_100g REAL NOT NULL,
    hidratos_100g REAL NOT NULL,
    gordura_100g  REAL NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS planos_alimentares (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    nome          TEXT NOT NULL,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plano_refeicoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    plano_id      INTEGER NOT NULL REFERENCES planos_alimentares(id) ON DELETE CASCADE,
    alimento_id   INTEGER NOT NULL REFERENCES alimentos(id),
    tipo_refeicao TEXT NOT NULL CHECK (tipo_refeicao IN ('pequeno-almoço', 'almoço', 'lanche', 'jantar', 'ceia')),
    quantidade_g  INTEGER NOT NULL CHECK (quantidade_g BETWEEN 1 AND 2000)
  );
`);

// ---------- Dados iniciais: [nome, grupo muscular, dificuldade] ----------
const exercicios = [
  ['Flexões', 'peito', 'iniciante'],
  ['Flexões inclinadas', 'peito', 'iniciante'],
  ['Supino com halteres', 'peito', 'intermédio'],
  ['Supino com barra', 'peito', 'intermédio'],
  ['Mergulhos nas paralelas', 'peito', 'avançado'],

  ['Remada com elástico', 'costas', 'iniciante'],
  ['Puxada ao peito', 'costas', 'iniciante'],
  ['Remada com halter', 'costas', 'intermédio'],
  ['Remada com barra', 'costas', 'intermédio'],
  ['Elevações na barra', 'costas', 'avançado'],

  ['Agachamento', 'pernas', 'iniciante'],
  ['Afundos', 'pernas', 'iniciante'],
  ['Prensa de pernas', 'pernas', 'intermédio'],
  ['Peso morto romeno', 'pernas', 'intermédio'],
  ['Agachamento búlgaro', 'pernas', 'avançado'],

  ['Elevações laterais', 'ombros', 'iniciante'],
  ['Elevações frontais', 'ombros', 'iniciante'],
  ['Press de ombros com halteres', 'ombros', 'intermédio'],
  ['Face pull', 'ombros', 'intermédio'],
  ['Press militar com barra', 'ombros', 'avançado'],

  ['Rosca com halteres', 'braços', 'iniciante'],
  ['Rosca martelo', 'braços', 'iniciante'],
  ['Extensão de tríceps na polia', 'braços', 'iniciante'],
  ['Rosca com barra', 'braços', 'intermédio'],
  ['Tríceps testa', 'braços', 'intermédio'],

  ['Prancha', 'abdominais', 'iniciante'],
  ['Abdominais crunch', 'abdominais', 'iniciante'],
  ['Elevação de pernas deitado', 'abdominais', 'intermédio'],
  ['Rotação russa', 'abdominais', 'intermédio'],
  ['Roda abdominal', 'abdominais', 'avançado'],

  ['Caminhada rápida', 'cardio', 'iniciante'],
  ['Bicicleta', 'cardio', 'iniciante'],
  ['Corrida contínua', 'cardio', 'intermédio'],
  ['Saltos à corda', 'cardio', 'intermédio'],
  ['Burpees', 'cardio', 'avançado']
];

// ---------- [nome, categoria, kcal, proteína, hidratos, gordura] por 100 g (valores aproximados) ----------
const alimentos = [
  ['Peito de frango grelhado', 'Proteínas', 165, 31, 0, 3.6],
  ['Peito de peru', 'Proteínas', 135, 30, 0, 1],
  ['Ovo cozido', 'Proteínas', 155, 13, 1.1, 11],
  ['Atum em água', 'Proteínas', 116, 26, 0, 1],
  ['Salmão grelhado', 'Proteínas', 206, 22, 0, 12],
  ['Bacalhau cozido', 'Proteínas', 105, 23, 0, 0.9],
  ['Bife de vaca magro', 'Proteínas', 200, 29, 0, 9],
  ['Tofu', 'Proteínas', 76, 8, 1.9, 4.8],
  ['Grão-de-bico cozido', 'Proteínas', 164, 8.9, 27.4, 2.6],
  ['Lentilhas cozidas', 'Proteínas', 116, 9, 20, 0.4],

  ['Arroz branco cozido', 'Hidratos', 130, 2.7, 28, 0.3],
  ['Massa cozida', 'Hidratos', 158, 5.8, 31, 0.9],
  ['Batata cozida', 'Hidratos', 87, 1.9, 20, 0.1],
  ['Batata-doce cozida', 'Hidratos', 90, 2, 21, 0.2],
  ['Pão integral', 'Hidratos', 250, 12, 43, 3.5],
  ['Aveia em flocos', 'Hidratos', 389, 16.9, 66, 6.9],
  ['Quinoa cozida', 'Hidratos', 120, 4.4, 21, 1.9],

  ['Banana', 'Fruta', 89, 1.1, 23, 0.3],
  ['Maçã', 'Fruta', 52, 0.3, 14, 0.2],
  ['Laranja', 'Fruta', 47, 0.9, 12, 0.1],
  ['Morangos', 'Fruta', 32, 0.7, 7.7, 0.3],
  ['Kiwi', 'Fruta', 61, 1.1, 15, 0.5],
  ['Uvas', 'Fruta', 69, 0.7, 18, 0.2],

  ['Brócolos cozidos', 'Legumes', 35, 2.4, 7, 0.4],
  ['Espinafres cozidos', 'Legumes', 23, 3, 3.8, 0.3],
  ['Cenoura', 'Legumes', 41, 0.9, 10, 0.2],
  ['Tomate', 'Legumes', 18, 0.9, 3.9, 0.2],
  ['Alface', 'Legumes', 15, 1.4, 2.9, 0.2],
  ['Pepino', 'Legumes', 15, 0.7, 3.6, 0.1],
  ['Curgete', 'Legumes', 17, 1.2, 3.1, 0.3],

  ['Leite meio-gordo', 'Lacticínios', 46, 3.4, 4.8, 1.6],
  ['Iogurte natural', 'Lacticínios', 61, 3.5, 4.7, 3.3],
  ['Iogurte grego 0%', 'Lacticínios', 59, 10, 3.6, 0.4],
  ['Queijo fresco', 'Lacticínios', 98, 11, 3.4, 4.3],
  ['Queijo flamengo', 'Lacticínios', 350, 25, 2, 27],

  ['Azeite', 'Gorduras', 884, 0, 0, 100],
  ['Amêndoas', 'Gorduras', 579, 21, 22, 50],
  ['Nozes', 'Gorduras', 654, 15, 14, 65],
  ['Manteiga de amendoim', 'Gorduras', 588, 25, 20, 50],
  ['Abacate', 'Gorduras', 160, 2, 8.5, 14.7]
];

// INSERT OR IGNORE: se o item já existe, é saltado. Por isso podes correr isto as vezes que quiseres
const inserirExercicio = db.prepare(
  'INSERT OR IGNORE INTO exercicios (nome, grupo_muscular, dificuldade) VALUES (?, ?, ?)'
);
const inserirAlimento = db.prepare(
  'INSERT OR IGNORE INTO alimentos (nome, categoria, calorias_100g, proteina_100g, hidratos_100g, gordura_100g) VALUES (?, ?, ?, ?, ?, ?)'
);

// Transação: ou entra tudo, ou não entra nada
db.transaction(() => {
  exercicios.forEach((e) => inserirExercicio.run(...e));
  alimentos.forEach((a) => inserirAlimento.run(...a));
})();

// O resto do projeto usa a base de dados com: const db = require('./db');
module.exports = db;

// Se correres "node db.js" no terminal, mostra quantos registos há em cada tabela
if (require.main === module) {
  const tabelas = [
    'utilizadores', 'exercicios', 'planos_treino', 'plano_treino_exercicios',
    'alimentos', 'planos_alimentares', 'plano_refeicoes'
  ];
  console.log('Base de dados pronta: database.sqlite');
  for (const t of tabelas) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
    console.log(`  ${t.padEnd(26)} ${n}`);
  }
}
