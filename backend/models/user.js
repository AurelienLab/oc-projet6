const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    email: { type: String, required: true},
    password: { type: String, required: true, select: false }
})

module.exports = mongoose.model('User', userSchema)