const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const { passwordStrength } = require('check-password-strength')
const PasswordValidator = require("password-validator");

const badPasswords = require('./bad-passwords.json')

require('dotenv').config()

const User = require('../models/user')


exports.signin = (req, res, next) => {
    let schema = new PasswordValidator()
    schema
        .is().min(8)
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(1)                          // Must have at least 2 digits
        .is().not().oneOf(badPasswords);

    try {
        if(!validator.isEmail(req.body.email)) {
            throw new Error("Adresse mail invalide")
        }
        if(passwordStrength(req.body.password).id <= 1 || !schema.validate(req.body.password)) {
            throw new Error("Password too weak")
        }
    }
    catch(error) {
        return res.status(400).json({error})
    }


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
    if(!validator.isEmail(req.body.email)) {
        const error = new Error("Adresse mail invalide")
        return res.status(400).json({error : error.message})
    }

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