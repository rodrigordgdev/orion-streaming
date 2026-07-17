// importa a biblioteca do SQLite que acabamos de instalar
const Database = require("better-sqlite3");

// cria (ou abre, se já existir) um arquivo de banco chamado "orion.db"
const db = new Database("orion.db");

// cria a tabela de favoritos, SE ela ainda não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS favoritos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    filme_id INTEGER,
    titulo TEXT
  )
`);

console.log("Banco pronto e tabela 'favoritos' criada! ✅");

// exporta o "db" pra outros arquivos poderem usar
module.exports = db;