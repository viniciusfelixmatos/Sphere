// config/db.js
const mysql = require('mysql2');
require('dotenv').config(); // Carregar variáveis do .env

// Cria a conexão usando Promises
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verifica a conexão com o banco de dados
connection.getConnection((err, conn) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL com sucesso!');
  conn.release(); // Libera a conexão de volta para o pool
});

module.exports = connection;
