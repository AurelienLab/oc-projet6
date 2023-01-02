const express = require('express')
const router = express.Router()

const auth = require('../middleware/auth')
const multer = require('../middleware/multer-config')
const sauceCtrl = require('../controllers/sauce')

router.post('/', auth, multer, sauceCtrl.addSauce)
router.get('/:id', sauceCtrl.getOneSauce)
router.get('/', sauceCtrl.getAllSauces)
router.put('/:id', auth, multer, sauceCtrl.editSauce)
router.delete('/:id', auth, sauceCtrl.deleteSauce)
router.post('/:id/like', auth, sauceCtrl.likeSauce)
module.exports = router