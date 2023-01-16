const path = require('path')
const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        console.log(req.body)
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        console.log(req.body)
        const name = JSON.parse(req.body.sauce).name.split(' ').join('_').toLowerCase();
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

module.exports = multer({storage: storage}).single('image');