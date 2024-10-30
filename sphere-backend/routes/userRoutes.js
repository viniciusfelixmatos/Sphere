const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Verifique se o caminho está correto
const authenticateToken = require('../middleware/authMiddleware'); // Mantendo o middleware ativo
const upload = require('../middleware/multer'); // Mantém o middleware de upload

// Middleware para logar as requisições
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
};

// Verifica se todas as funções do controller estão definidas
const requiredFunctions = [
    'getUserProfile',
    'updateUserProfile',
    'getUserById',
    'getUserLikes',
    'getUserComments',
    'getUserFavorites',
    'getUserPosts',
    'followUser',
    'unfollowUser',
    'isFollowingUser' // Adicionando o novo método
];

requiredFunctions.forEach((func) => {
    if (typeof userController[func] !== 'function') {
        console.error(`Erro: ${func} não está definido no userController`);
        throw new Error(`${func} não está definido no userController`);
    }
});

// Aplica o logRequest globalmente para todas as rotas
router.use(logRequest);

// Rotas de usuário

// Rota para obter o perfil do usuário
router.get('/profile', authenticateToken, userController.getUserProfile);

// Rota para atualizar o perfil do usuário
router.put('/profile', authenticateToken, upload.single('profilePicture'), userController.updateUserProfile);

// Rota para obter os likes do usuário
router.get('/likes', authenticateToken, userController.getUserLikes);

// Rota para obter os comentários do usuário
router.get('/comments', authenticateToken, userController.getUserComments);

// Rota para obter os favoritos do usuário
router.get('/favorites', authenticateToken, userController.getUserFavorites);

// Rota para obter os posts do usuário
router.get('/posts', authenticateToken, userController.getUserPosts);

// Rota para seguir um usuário
router.post('/follow', authenticateToken, userController.followUser);

// Rota para deixar de seguir um usuário
router.post('/unfollow', authenticateToken, userController.unfollowUser);

// **Nova rota para verificar se o usuário está seguindo outro usuário**
router.get('/:id/isFollowing', authenticateToken, userController.isFollowingUser); // Nova rota

// Rota dinâmica para obter usuário por ID - deve estar no final
router.get('/:id', authenticateToken, userController.getUserById);

// Exporte o roteador
module.exports = router;
