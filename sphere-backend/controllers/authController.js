const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Registro de usuário
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Verifica se o usuário já existe
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Erro ao consultar o banco de dados:', err);
                return res.status(500).json({ message: 'Erro no banco de dados' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'Usuário já registrado com esse email' });
            }

            // Criptografar senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // Inserir novo usuário com foto de perfil padrão
            db.query('INSERT INTO users (username, email, password, profilePicture) VALUES (?, ?, ?, ?)', 
                [username, email, hashedPassword, 'profile-default.png'], (err) => {
                if (err) {
                    console.error('Erro ao inserir usuário no banco:', err);
                    return res.status(500).json({ message: 'Erro ao registrar usuário' });
                }
                return res.status(201).json({ message: 'Usuário registrado com sucesso' });
            });
        });
    } catch (error) {
        console.error('Erro no processo de registro:', error);
        return res.status(500).json({ message: 'Erro no registro' });
    }
};

// Login de usuário
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar se o usuário existe
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Erro ao consultar o banco de dados:', err);
                return res.status(500).json({ message: 'Erro no banco de dados' });
            }
            if (results.length === 0) {
                return res.status(400).json({ message: 'Email ou senha incorretos.' }); // Mensagem genérica
            }

            const user = results[0];

            // Comparar senhas
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email ou senha incorretos.' }); // Mensagem genérica
            }

            // Verificar se o JWT_SECRET está configurado
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET não está definido no arquivo .env');
                return res.status(500).json({ message: 'Erro no servidor' });
            }

            // Gerar token JWT
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ message: 'Login bem-sucedido', token });
        });
    } catch (error) {
        console.error('Erro no processo de login:', error);
        return res.status(500).json({ message: 'Erro no login' });
    }
};
