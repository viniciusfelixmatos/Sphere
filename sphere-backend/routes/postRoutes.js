const express = require('express');
const router = express.Router();
const  authenticateToken  = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

// Desestruturação das funções do controlador
const {
    createPost,
    getAllPosts,
    getPostsByUserId,
    toggleLike,
    addComment,
    toggleFavorite,
} = postController;

// Rotas de postagem
router.post('/', authenticateToken, (req, res, next) => {
    console.log('Criando nova postagem:', req.body);
    createPost(req, res, next);
});

router.get('/', authenticateToken, (req, res, next) => {
    console.log('Buscando todas as postagens.');
    getAllPosts(req, res, next);
});

router.get('/user/:userId', authenticateToken, (req, res, next) => {
    console.log(`Buscando postagens do usuário com ID: ${req.params.userId}`);
    getPostsByUserId(req, res, next);
});

router.post('/:postId/like', authenticateToken, (req, res, next) => {
    console.log(`Curtindo post com ID: ${req.params.postId}`);
    toggleLike(req, res, next);
});

router.delete('/:postId/like', authenticateToken, (req, res, next) => {
    console.log(`Descurtindo post com ID: ${req.params.postId}`);
    toggleLike(req, res, next);
});

router.post('/:postId/comment', authenticateToken, (req, res, next) => {
    console.log(`Adicionando comentário ao post com ID: ${req.params.postId}`, req.body);
    addComment(req, res, next);
});

router.get('/:postId/comments', authenticateToken, (req, res, next) => {
    console.log(`Buscando comentários do post com ID: ${req.params.postId}`);
    getAllCommentsByPostId(req, res, next);
});

router.post('/:postId/favorite', authenticateToken, (req, res, next) => {
    console.log(`Favoritando post com ID: ${req.params.postId}`);
    toggleFavorite(req, res, next);
});

router.delete('/:postId/favorite', authenticateToken, (req, res, next) => {
    console.log(`Desfavoritando post com ID: ${req.params.postId}`);
    toggleFavorite(req, res, next);
});

module.exports = router;
