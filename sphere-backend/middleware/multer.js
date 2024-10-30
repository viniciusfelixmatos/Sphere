const multer = require('multer');
const path = require('path');

// Configuração do multer para salvar imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as imagens serão salvas
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renomeia o arquivo com timestamp
    }
});

// Filtro para apenas aceitar imagens
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Tipos de arquivo permitidos
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true); // Aceita o arquivo
    } else {
        cb(new Error('Apenas imagens são permitidas!'), false); // Rejeita o arquivo
    }
};

// Configuração do multer
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de tamanho de 5MB
    fileFilter,
});

module.exports = upload;
