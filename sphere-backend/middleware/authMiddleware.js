const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('Verificando token de autenticação...');

  // Verifica se o cabeçalho de autorização está presente
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.error('Cabeçalho de autorização ausente.');
    return res.status(401).json({ message: 'Acesso negado. Cabeçalho de autorização ausente.' });
  }

  // Verifica se o cabeçalho começa com "Bearer " e extrai o token
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    console.error('Token ausente ou malformado.');
    return res.status(401).json({ message: 'Acesso negado. Token ausente ou malformado.' });
  }

  try {
    console.log('Verificando token...');
    
    // Verifica o token com a chave secreta do JWT
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Armazena as informações do usuário decodificado no req

    console.log('Token verificado com sucesso para o usuário:', verified.id); // Log do ID do usuário
    next(); // Passa para o próximo middleware ou rota
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);

    // Lida com diferentes tipos de erros
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    } else {
      return res.status(500).json({ message: 'Erro ao verificar token.' });
    }
  }
};

module.exports = authenticateToken;
