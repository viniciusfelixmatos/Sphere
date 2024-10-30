const db = require('../config/db');

// Função auxiliar para tratar erros
const handleError = (res, err, message, status = 500) => {
    console.error(message, err);
    return res.status(status).json({ message });
};

// Função auxiliar para buscar usuário
const getUserById = async (userId) => {
    const queryString = 'SELECT username, profilePicture FROM users WHERE id = ?';
    const result = await new Promise((resolve, reject) => {
        db.query(queryString, [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

    if (result.length === 0) {
        throw new Error('Usuário não encontrado.'); // Lança um erro se o usuário não for encontrado
    }

    return result[0];
};

// Função auxiliar para contar likes e comentários
const getCounts = async (postId) => {
    const likesCountQuery = 'SELECT COUNT(*) AS count FROM likes WHERE post_id = ?';
    const commentsCountQuery = 'SELECT COUNT(*) AS count FROM comments WHERE post_id = ?';

    const [likesCount, commentsCount] = await Promise.all([
        new Promise((resolve, reject) => {
            db.query(likesCountQuery, [postId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(commentsCountQuery, [postId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        })
    ]);

    return {
        likesCount: likesCount[0].count,
        commentsCount: commentsCount[0].count
    };
};

// Criar nova postagem
exports.createPost = async (req, res) => {
    console.log('Recebendo requisição para criar nova postagem.');

    const { content } = req.body;
    const userId = req.user ? req.user.id : null; // Captura o ID do usuário
    const image = req.file ? req.file.filename : null;

    if (!userId) {
        console.log('Usuário não autenticado.');
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!content || content.trim() === '') {
        console.log('Conteúdo da postagem é obrigatório.');
        return res.status(400).json({ message: 'Conteúdo da postagem é obrigatório.' });
    }

    try {
        // Inserir nova postagem
        const insertQuery = 'INSERT INTO posts (user_id, content, image, timestamp) VALUES (?, ?, ?, ?)';
        const timestamp = new Date(); // Definindo o timestamp para a postagem
        const result = await new Promise((resolve, reject) => {
            db.query(insertQuery, [userId, content, image, timestamp], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const postId = result.insertId;

        // Atualizar postsCount no usuário
        console.log(`Atualizando postsCount para o usuário ${userId}...`);
        const updateQuery = 'UPDATE users SET postsCount = postsCount + 1 WHERE id = ?';
        console.log(`Executando consulta: ${updateQuery} com id = ${userId}`);
        
        const updateResult = await new Promise((resolve, reject) => {
            db.query(updateQuery, [userId], (err, results) => {
                if (err) {
                    console.error('Erro ao atualizar postsCount:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        // Verificando se a atualização ocorreu
        if (updateResult.affectedRows === 0) {
            console.warn(`Nenhuma linha foi afetada ao atualizar postsCount para o usuário ${userId}.`);
            return res.status(500).json({ message: 'Erro ao atualizar postsCount.' });
        } else {
            console.log(`postsCount para o usuário ${userId} atualizado com sucesso. Linhas afetadas: ${updateResult.affectedRows}`);
        }

        // Obter informações do usuário
        const user = await getUserById(userId);

        const newPost = {
            id: postId,
            user: {
                id: userId,
                username: user.username,
                profilePicture: user.profilePicture || 'profile-default.png',
            },
            content,
            image,
            likes: 0,
            comments: [],
            favorites: false,
            timestamp: timestamp,
        };

        console.log('Postagem criada com sucesso:', newPost);
        return res.status(201).json({ message: 'Postagem criada com sucesso.', post: newPost });
    } catch (err) {
        console.error('Erro ao criar postagem:', err);
        return handleError(res, err, 'Não foi possível criar a postagem. Tente novamente mais tarde.');
    }
};

// Buscar todas as postagens
exports.getAllPosts = async (req, res) => {
    console.log('Recebendo requisição para buscar todas as postagens.');

    const userId = req.user?.id;

    // Verificação: usuário deve estar autenticado
    if (!userId) {
        console.log('Usuário não autenticado.');
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const query = `
        SELECT p.id, p.content, p.image, p.timestamp, 
               p.user_id, u.username, u.profilePicture, 
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likesCount,
               (SELECT COUNT(*) FROM favorites WHERE post_id = p.id AND user_id = ?) AS isFavorite,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS hasLiked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.timestamp DESC;
    `;

    try {
        const results = await new Promise((resolve, reject) => {
            db.query(query, [userId, userId], (err, results) => {
                if (err) return reject(err);
                console.log('Resultados das postagens recebidos do banco de dados:', results);
                resolve(results);
            });
        });

        // Obter comentários para cada post
        const posts = await Promise.all(results.map(async (post) => {
            const { likesCount } = await getCounts(post.id);

            // Buscar os comentários do post
            const commentsQuery = `
                SELECT c.id, c.text, c.timestamp, u.username, u.profilePicture
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.timestamp DESC;
            `;

            const comments = await new Promise((resolve, reject) => {
                db.query(commentsQuery, [post.id], (err, results) => {
                    if (err) return reject(err);
                    console.log(`Comentários recebidos para o post ID ${post.id}:`, results);
                    resolve(results);
                });
            });

            // Formatar os dados do post
            return {
                id: post.id,
                user: {
                    id: post.user_id,
                    username: post.username || 'Usuário Desconhecido', // Garantindo que sempre tenha um nome de usuário
                    profilePicture: post.profilePicture || 'assets/default-profile.png', // Imagem padrão se não houver
                },
                content: post.content,
                image: post.image || null,
                likes: likesCount,
                comments: comments.map(comment => ({
                    id: comment.id,
                    text: comment.text || 'Sem conteúdo disponível', // Atualizado para 'text'
                    user: {
                        username: comment.username || 'Comentador Desconhecido', // Garantindo que sempre tenha um nome de usuário
                        profilePicture: comment.profilePicture || 'assets/default-profile.png', // Imagem padrão se não houver
                    },
                    timestamp: comment.timestamp,
                })),
                favorites: post.isFavorite > 0,
                hasLiked: post.hasLiked > 0,
                timestamp: post.timestamp,
            };
        }));

        console.log('Postagens recuperadas com sucesso:', posts.length);
        return res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar postagens:', err);
        return res.status(500).json({ message: 'Erro ao buscar postagens' });
    }
};

// Buscar postagens por ID de usuário
exports.getPostsByUserId = async (req, res) => {
    const { userId } = req.params;

    console.log(`Recebendo requisição para buscar postagens do usuário com ID: ${userId}`);

    const query = `
        SELECT p.id, p.content, p.image, p.timestamp, 
               p.user_id, u.username, u.profilePicture, 
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likesCount
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.timestamp DESC;
    `;

    try {
        const results = await new Promise((resolve, reject) => {
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const posts = results.map(post => ({
            id: post.id,
            user: {
                id: post.user_id,
                username: post.username,
                profilePicture: post.profilePicture || 'profile-default.png',
            },
            content: post.content,
            image: post.image || null,
            likes: post.likesCount || 0,
            comments: [], // Inicialmente vazio
            timestamp: post.timestamp,
        }));

        console.log('Postagens do usuário recuperadas com sucesso:', posts.length);
        return res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar postagens do usuário:', err);
        return handleError(res, err, 'Erro ao buscar postagens do usuário');
    }
};

// Adicionar ou remover like
exports.toggleLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Verificação: postId é obrigatório
    if (!postId) {
        console.log('Post ID é obrigatório.');
        return res.status(400).json({ message: 'Post ID é obrigatório.' });
    }

    try {
        // Verificar se o usuário já curtiu o post
        const checkLikeQuery = 'SELECT * FROM likes WHERE user_id = ? AND post_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(checkLikeQuery, [userId, postId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (results.length > 0) {
            // Se já curtiu, remove o like
            const deleteLikeQuery = 'DELETE FROM likes WHERE user_id = ? AND post_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteLikeQuery, [userId, postId], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            console.log('Like removido com sucesso.');
            return res.status(200).json({ message: 'Like removido com sucesso.' });
        } else {
            // Se não curtiu, adiciona o like
            const insertLikeQuery = 'INSERT INTO likes (user_id, post_id) VALUES (?, ?)';
            await new Promise((resolve, reject) => {
                db.query(insertLikeQuery, [userId, postId], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            console.log('Like adicionado com sucesso.');
            return res.status(201).json({ message: 'Like adicionado com sucesso.' });
        }
    } catch (err) {
        console.error('Erro ao alternar like:', err);
        return handleError(res, err, 'Erro ao alternar like.');
    }
};

// Adicionar comentário
exports.addComment = async (req, res) => {
    const { postId } = req.params;
    const { text } = req.body; // Manter 'text' para corresponder ao nome da coluna
    const userId = req.user.id;

    // Verifica se o texto do comentário não está vazio
    if (!text || text.trim() === '') { // Mantendo 'text' aqui
        console.log('Conteúdo do comentário é obrigatório.');
        return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório.' });
    }

    try {
        // Consulta SQL para inserir o comentário usando o campo 'text'
        const insertCommentQuery = 'INSERT INTO comments (user_id, post_id, text) VALUES (?, ?, ?)';
        const result = await new Promise((resolve, reject) => {
            db.query(insertCommentQuery, [userId, postId, text], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const commentId = result.insertId;
        const user = await getUserById(userId);
        
        // Criação do novo comentário
        const newComment = {
            id: commentId,
            text, // Garantindo que estamos usando 'text'
            user: {
                username: user.username,
                profilePicture: user.profilePicture || 'profile-default.png',
            },
            timestamp: new Date(), // Timestamp atual
        };

        console.log('Comentário adicionado com sucesso:', newComment);
        return res.status(201).json({ message: 'Comentário adicionado com sucesso.', comment: newComment });
    } catch (err) {
        console.error('Erro ao adicionar comentário:', err);
        return handleError(res, err, 'Erro ao adicionar comentário.');
    }
};

// Buscar todos os comentários de uma postagem
exports.getAllCommentsByPostId = async (req, res) => {
    const { postId } = req.params;

    // Verifica se o postId foi fornecido
    if (!postId) {
        console.log('Post ID é obrigatório.');
        return res.status(400).json({ message: 'Post ID é obrigatório.' });
    }

    console.log(`Recebendo requisição para buscar comentários do post ID: ${postId}`);

    // Consulta SQL para buscar comentários
    const commentsQuery = `
        SELECT c.id, c.text, c.timestamp, 
               u.username, u.profilePicture 
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.timestamp DESC;
    `;

    try {
        // Executa a consulta ao banco de dados
        console.log(`Executando consulta SQL: ${commentsQuery} com postId: ${postId}`);
        const results = await new Promise((resolve, reject) => {
            db.query(commentsQuery, [postId], (err, results) => {
                if (err) {
                    console.error('Erro ao executar consulta SQL:', err);
                    return reject(err);
                }
                console.log('Resultados da consulta SQL recebidos:', results);
                resolve(results);
            });
        });

        // Formata os resultados
        const comments = results.map(comment => {
            const formattedComment = {
                id: comment.id,
                text: comment.text,  // O text do comentário deve ser retornado
                user: {
                    username: comment.username,
                    profilePicture: comment.profilePicture ? `uploads/${comment.profilePicture}` : 'profile-default.png',  // Caminho atualizado
                },
                timestamp: comment.timestamp,
            };
            console.log('Comentário formatado:', formattedComment);  // Log do comentário formatado
            return formattedComment;
        });

        console.log(`Total de comentários encontrados: ${comments.length}`);
        return res.status(200).json(comments);  // Retorna os comentários encontrados
    } catch (err) {
        console.error('Erro ao buscar comentários:', err);
        return handleError(res, err, 'Erro ao buscar comentários.');  // Função de manejo de erro
    }
};

// Alternar favorito
exports.toggleFavorite = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    // Verificação: postId é obrigatório
    if (!postId) {
        console.log('Post ID é obrigatório.');
        return res.status(400).json({ message: 'Post ID é obrigatório.' });
    }

    try {
        // Verificar se o usuário já favoritou o post
        const checkFavoriteQuery = 'SELECT * FROM favorites WHERE user_id = ? AND post_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(checkFavoriteQuery, [userId, postId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (results.length > 0) {
            // Se já favoritou, remove o favorito
            const deleteFavoriteQuery = 'DELETE FROM favorites WHERE user_id = ? AND post_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteFavoriteQuery, [userId, postId], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            console.log('Favorito removido com sucesso.');
            return res.status(200).json({ message: 'Favorito removido com sucesso.' });
        } else {
            // Se não favoritou, adiciona o favorito
            const insertFavoriteQuery = 'INSERT INTO favorites (user_id, post_id) VALUES (?, ?)';
            await new Promise((resolve, reject) => {
                db.query(insertFavoriteQuery, [userId, postId], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            console.log('Favorito adicionado com sucesso.');
            return res.status(201).json({ message: 'Favorito adicionado com sucesso.' });
        }
    } catch (err) {
        console.error('Erro ao alternar favorito:', err);
        return handleError(res, err, 'Erro ao alternar favorito.');
    }

};
