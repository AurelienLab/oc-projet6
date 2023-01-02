const express = require('express')
const router = express.Router()

const auth = require('../middleware/auth')
const sauceCtrl = require('../controllers/sauce')

router.post('/', auth, sauceCtrl.addSauce)
router.get('/:id', sauceCtrl.getOneSauce)
router.get('/', sauceCtrl.getAllSauces)
router.put('/:id', auth, sauceCtrl.editSauce)
router.delete('/:id', auth, sauceCtrl.deleteSauce)
module.exports = router