const db = require('../config/db'); // Importa o módulo de configuração do banco de dados

// Função auxiliar para buscar usuário por ID
const getUserByIdFromDB = async (userId) => {
    console.log(`Buscando usuário com ID: ${userId}`);
    return new Promise((resolve, reject) => {
        // Seleciona todas as colunas da tabela users
        db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) return reject(err);
            console.log(`Resultados da busca de usuário: ${JSON.stringify(results)}`);
            resolve(results);
        });
    });
};



// Função auxiliar para atualizar o perfil do usuário
const updateUserInDB = async (userId, username, bio, profilePicture) => {
    console.log(`Atualizando usuário com ID: ${userId}, username: ${username}`);
    return new Promise((resolve, reject) => {
        db.query(
            'UPDATE users SET username = ?, bio = ?, profilePicture = ? WHERE id = ?',
            [username, bio, profilePicture, userId],
            (err, results) => {
                if (err) return reject(err);
                console.log(`Perfil do usuário atualizado com sucesso: ${JSON.stringify(results)}`);
                resolve(results);
            }
        );
    });
};

const getUserProfile = async (req, res) => {
    console.log('Iniciando a obtenção do perfil do usuário');
    try {
        const userId = req.user.id; // O ID do usuário já está disponível aqui
        console.log(`ID do usuário: ${userId}`);

        const results = await getUserByIdFromDB(userId);
        if (!results.length) {
            console.warn('Usuário não encontrado');
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = results[0];
        res.status(200).json({
            id: user.id,
            username: user.username,
            postsCount: user.postsCount || 0,
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,
            bio: user.bio || '',
            profilePicture: user.profilePicture || ''
        });
        console.log('Perfil do usuário obtido com sucesso');
    } catch (error) {
        console.error('Erro ao obter o perfil do usuário:', error.message);
        res.status(500).json({ 
            message: 'Erro ao obter o perfil do usuário',
            details: error.message 
        });
    }
};

// Função para atualizar o perfil do usuário
const updateUserProfile = async (req, res) => {
    console.log('Iniciando a atualização do perfil do usuário');
    try {
        const userId = req.user.id;

        const { username, bio } = req.body; // profilePicture deve ser tratado separadamente
        const currentUser = await getUserByIdFromDB(userId); // Busca o usuário atual para obter dados existentes
        const existingUser = currentUser[0];

        // Verifica se os valores não são nulos
        const newUsername = username || existingUser.username; // Se username for nulo, usa o existente
        const newBio = bio || existingUser.bio; // Se bio for nulo, usa o existente
        const newProfilePicture = req.file ? req.file.filename : existingUser.profilePicture; // Usa a nova imagem se existir

        // Atualiza o perfil do usuário no banco de dados
        await updateUserInDB(userId, newUsername, newBio, newProfilePicture);
        
        res.status(200).json({ message: 'Perfil atualizado com sucesso' });
        console.log('Perfil do usuário atualizado com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar o perfil do usuário:', error.message);
        res.status(500).json({ 
            message: 'Erro ao atualizar o perfil do usuário',
            details: error.message 
        });
    }
};

// Função para obter um usuário por ID
const getUserById = async (req, res) => {
    const userId = req.params.id;
    console.log(`Buscando usuário com ID: ${userId}`);

    try {
        const results = await getUserByIdFromDB(userId);
        if (!results.length) {
            console.warn('Usuário não encontrado');
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = results[0];
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email, // Adicionando o campo email
            bio: user.bio || '',
            profilePicture: user.profilePicture || '',
            postsCount: user.postsCount || 0, // Adicionando postsCount
            followersCount: user.followersCount || 0, // Adicionando followersCount
            followingCount: user.followingCount || 0, // Adicionando followingCount
        });
        console.log('Usuário obtido com sucesso:', user);
    } catch (err) {
        console.error('Erro no banco de dados:', err.message);
        res.status(500).json({ 
            message: 'Erro ao buscar usuário',
            details: err.message 
        });
    }
};


// Função para buscar os posts do usuário
const getUserPosts = async (req, res) => {
    console.log('Buscando posts do usuário');
    try {
        const userId = req.user.id;

        const results = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM posts WHERE user_id = ?', [userId], (err, results) => {
                if (err) return reject(err);
                console.log(`Posts encontrados: ${JSON.stringify(results)}`);
                resolve(results);
            });
        });

        res.status(200).json(results);
        console.log('Posts do usuário obtidos com sucesso');
    } catch (error) {
        console.error('Erro ao buscar posts do usuário:', error.message);
        res.status(500).json({ 
            message: 'Erro ao buscar posts do usuário',
            details: error.message 
        });
    }
};

const getUserLikes = async (req, res) => {
    console.log('Buscando posts curtidos pelo usuário');
    try {
        const userId = req.user.id;  // ID do usuário autenticado

        const results = await new Promise((resolve, reject) => {
            db.query(`
                SELECT 
                    p.id, 
                    p.content, 
                    p.image, 
                    p.timestamp, 
                    u.id AS userId,  -- Alias para o ID do criador do post
                    u.username, 
                    u.profilePicture 
                FROM posts p
                JOIN likes l ON p.id = l.post_id  -- Filtra os posts que foram curtidos
                JOIN users u ON p.user_id = u.id  -- Inclui o usuário que criou o post
                WHERE l.user_id = ?;  -- Filtra os likes feitos pelo usuário autenticado
            `, [userId], (err, results) => {
                if (err) return reject(err);
                
                // Verifique se o resultado contém os dados esperados
                if (results.length === 0) {
                    console.warn('Nenhum post curtido encontrado.');
                    return resolve([]);
                }

                // Log detalhado para verificar a estrutura dos dados
                console.log(`Posts curtidos encontrados: ${JSON.stringify(results, null, 2)}`);

                resolve(results);
            });
        });

        // Retorna os resultados para o frontend
        res.status(200).json(results);
        console.log('Posts curtidos obtidos com sucesso');
    } catch (error) {
        console.error('Erro ao buscar posts curtidos:', error.message);
        res.status(500).json({
            message: 'Erro ao buscar posts curtidos',
            details: error.message
        });
    }
};

// Função para buscar os comentários do usuário
const getUserComments = async (req, res) => {
    console.log('Buscando comentários do usuário');
    try {
        const userId = req.user.id;

        const results = await new Promise((resolve, reject) => {
            db.query(`
                SELECT c.*, u.username, u.profilePicture 
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.user_id = ?`, [userId], (err, results) => {
                if (err) return reject(err);
                console.log(`Comentários encontrados: ${JSON.stringify(results)}`);
                resolve(results);
            });
        });
        
        res.status(200).json(results);
        console.log('Comentários do usuário obtidos com sucesso');
    } catch (error) {
        console.error('Erro ao buscar comentários do usuário:', error.message);
        res.status(500).json({ 
            message: 'Erro ao buscar comentários do usuário',
            details: error.message 
        });
    }
};

// Função para buscar os posts favoritos do usuário
const getUserFavorites = async (req, res) => {
    console.log('Buscando posts favoritos do usuário');
    try {
        const userId = req.user.id;

        const results = await new Promise((resolve, reject) => {
            const query = `
                SELECT posts.*, users.username, users.profilePicture 
                FROM posts 
                JOIN users ON posts.user_id = users.id 
                WHERE posts.id IN (SELECT post_id FROM favorites WHERE user_id = ?)
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                console.log(`Posts favoritos encontrados: ${JSON.stringify(results)}`);
                resolve(results);
            });
        });

        res.status(200).json(results);
        console.log('Posts favoritos obtidos com sucesso');
    } catch (error) {
        console.error('Erro ao buscar posts favoritos:', error.message);
        res.status(500).json({ 
            message: 'Erro ao buscar posts favoritos',
            details: error.message 
        });
    }
};

// Função para seguir um usuário (sem Promises, usando callbacks)
const followUser = (req, res) => {
    const userIdToFollow = req.body.userId; // ID do usuário a ser seguido
    const currentUserId = req.user.id;      // ID do usuário atual

    // Verifica se o ID do usuário a ser seguido está definido
    if (!userIdToFollow) {
        return res.status(400).json({ message: 'ID do usuário a ser seguido não fornecido.' });
    }

    // Verifica se o usuário já está seguindo o outro usuário
    const checkFollowingQuery = `
        SELECT * FROM followers WHERE follower_id = ? AND following_id = ?
    `;

    db.query(checkFollowingQuery, [currentUserId, userIdToFollow], (err, results) => {
        if (err) {
            console.error('Erro ao verificar se já está seguindo:', err);
            return res.status(500).json({ message: 'Erro ao verificar se já está seguindo.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Você já está seguindo este usuário.' });
        }

        // Se não estiver seguindo, insere na tabela followers
        const followQuery = `
            INSERT INTO followers (follower_id, following_id) VALUES (?, ?)
        `;

        db.query(followQuery, [currentUserId, userIdToFollow], (err) => {
            if (err) {
                console.error('Erro ao seguir o usuário:', err);
                return res.status(500).json({ message: 'Erro ao seguir o usuário.' });
            }

            // Atualiza o contador de seguidores do usuário seguido
            const updateFollowersCountQuery = `
                UPDATE users SET followersCount = followersCount + 1 WHERE id = ?
            `;

            db.query(updateFollowersCountQuery, [userIdToFollow], (err) => {
                if (err) {
                    console.error('Erro ao atualizar o contador de seguidores:', err);
                    return res.status(500).json({ message: 'Erro ao atualizar o contador de seguidores.' });
                }

                // Atualiza o contador de "following" do usuário atual
                const updateFollowingCountQuery = `
                    UPDATE users SET followingCount = followingCount + 1 WHERE id = ?
                `;

                db.query(updateFollowingCountQuery, [currentUserId], (err) => {
                    if (err) {
                        console.error('Erro ao atualizar o contador de "following":', err);
                        return res.status(500).json({ message: 'Erro ao atualizar o contador de "following".' });
                    }

                    return res.status(200).json({ message: 'Usuário seguido com sucesso.' });
                });
            });
        });
    });
};

// Função para deixar de seguir um usuário (sem Promises, usando callbacks)
const unfollowUser = (req, res) => {
    const userIdToUnfollow = req.body.userId;
    const currentUserId = req.user.id;

    // Verifica se o ID do usuário a ser deixado de seguir está definido
    if (!userIdToUnfollow) {
        return res.status(400).json({ message: 'ID do usuário a ser deixado de seguir não fornecido.' });
    }

    // Verifica se o usuário está realmente seguindo o outro usuário
    const checkFollowingQuery = `
        SELECT * FROM followers WHERE follower_id = ? AND following_id = ?
    `;

    db.query(checkFollowingQuery, [currentUserId, userIdToUnfollow], (err, results) => {
        if (err) {
            console.error('Erro ao verificar se está seguindo:', err);
            return res.status(500).json({ message: 'Erro ao verificar se está seguindo.' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Você não está seguindo este usuário.' });
        }

        // Se estiver seguindo, remove da tabela followers
        const unfollowQuery = `
            DELETE FROM followers WHERE follower_id = ? AND following_id = ?
        `;

        db.query(unfollowQuery, [currentUserId, userIdToUnfollow], (err) => {
            if (err) {
                console.error('Erro ao deixar de seguir o usuário:', err);
                return res.status(500).json({ message: 'Erro ao deixar de seguir o usuário.' });
            }

            // Atualiza o contador de seguidores do usuário que foi deixado de seguir
            const updateFollowersCountQuery = `
                UPDATE users SET followersCount = followersCount - 1 WHERE id = ?
            `;

            db.query(updateFollowersCountQuery, [userIdToUnfollow], (err) => {
                if (err) {
                    console.error('Erro ao atualizar o contador de seguidores:', err);
                    return res.status(500).json({ message: 'Erro ao atualizar o contador de seguidores.' });
                }

                // Atualiza o contador de "following" do usuário atual
                const updateFollowingCountQuery = `
                    UPDATE users SET followingCount = followingCount - 1 WHERE id = ?
                `;

                db.query(updateFollowingCountQuery, [currentUserId], (err) => {
                    if (err) {
                        console.error('Erro ao atualizar o contador de "following":', err);
                        return res.status(500).json({ message: 'Erro ao atualizar o contador de "following".' });
                    }

                    return res.status(200).json({ message: 'Você deixou de seguir o usuário com sucesso.' });
                });
            });
        });
    });
};

// Função para verificar se o usuário está seguindo outro usuário
const isFollowingUser = async (req, res) => {
    const currentUserId = req.user.id; // Obtém o ID do usuário autenticado do token
    const userIdToCheck = req.params.id; // ID do usuário a ser verificado

    console.log(`Verificando se o usuário com ID ${currentUserId} está seguindo o usuário com ID ${userIdToCheck}`);

    try {
        // Alteração para utilizar db.promise().query()
        const [followExists] = await db.promise().query(`
            SELECT * FROM followers 
            WHERE follower_id = ? AND following_id = ?
        `, [currentUserId, userIdToCheck]);

        // Registra o resultado da verificação
        if (followExists.length > 0) {
            console.log(`O usuário com ID ${currentUserId} está seguindo o usuário com ID ${userIdToCheck}`);
        } else {
            console.log(`O usuário com ID ${currentUserId} NÃO está seguindo o usuário com ID ${userIdToCheck}`);
        }

        // Retorna true se o usuário está seguindo, caso contrário, retorna false
        return res.json({ isFollowing: followExists.length > 0 });
    } catch (error) {
        console.error('Erro ao verificar se está seguindo o usuário:', error);
        return res.status(500).json({ error: 'Erro ao verificar seguimento.' });
    }
};


// Exportar as funções
module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserById, 
    getUserLikes,
    getUserComments,
    getUserFavorites,
    getUserPosts,
    followUser,      
    unfollowUser,
    isFollowingUser     
};