require('dotenv').config(); // Carregar variáveis do .env

const express = require('express');
const path = require('path'); // Necessário para servir arquivos estáticos
const cors = require('cors'); // Middleware para CORS
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000; // Use a porta definida no .env, se disponível

// Importar as rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes'); // Adicionar rotas de postagens

// Middleware para configurar o tamanho máximo do upload (limite de 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurar CORS para permitir apenas o frontend
app.use(cors({
  origin: '*', // Permitir apenas a origem do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permitir métodos HTTP
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Permitir cabeçalhos específicos
}));

// Verificar se a pasta 'uploads' existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.error('A pasta uploads não existe! Criando a pasta.');
  fs.mkdirSync(uploadsDir); // Criar pasta se não existir
  console.log('Pasta uploads criada com sucesso.');
}

// Middleware para servir arquivos estáticos (como a imagem de perfil padrão)
app.use('/uploads', express.static(uploadsDir));

// Rotas de autenticação (login e registro)
app.use('/api/auth', authRoutes);

// Rotas de usuário (perfil, atualização, etc.)
app.use('/api/user', userRoutes); // Alterar o caminho para ser mais específico de usuário

// Rotas de postagens (criação, listagem, etc.)
app.use('/api/posts', postRoutes);

// Rota principal (exemplo simples)
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Middleware de captura de erros
app.use((err, req, res, next) => {
  console.error('Erro no backend:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
