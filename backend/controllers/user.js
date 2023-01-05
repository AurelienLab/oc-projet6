const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const User = require('../models/user')

exports.signin = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            })

            user.save()
                .then(() => res.status(201).json({ message: "Utilisateur ajouté."}))
                .catch(error => res.status(400).json({error}))
        })
        .catch(error => res.status(400).json({error}))
}


exports.login = (req, res, next) => {
    User.findOne({email : req.body.email}).select('password')
        .then(user => {
            if(!user) {
                return res.status(401).json({message: "Paire email/mot de passe incorrecte"})
            }

            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if(!valid) {
                        return res.status(401).json({message: "Paire email/mot de passe incorrecte"})
                    }
                    const response = {
                        userId: user._id,
                        token: jwt.sign(
                            {userId: user._id},
                            process.env.AUTH_TOKEN_SECRET,
                            {expiresIn: "24h"}
                        )
                    }

                    res.status(200).json(response)
                })
                .catch(error => res.status(500).json({error}))
        })
        .catch(error => res.status(500).json({error}))
}