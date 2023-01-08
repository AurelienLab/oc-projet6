const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const { passwordStrength } = require('check-password-strength')
const PasswordValidator = require("password-validator");

const badPasswords = require('./bad-passwords.json')

logger = require('../logger')
require('dotenv').config()

const User = require('../models/user')


exports.signup = (req, res, next) => {
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
            throw new Error("Password too weak. Reasons: " + schema.validate(req.body.password, { list: true}))
        }
    }
    catch(error) {
        logger.warn('Bad credentials for signup - ', error)
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
                .catch(error => {
                    res.status(400).json({error})
                    logger.error('Error during user signup - ', error)
                })
        })
        .catch(error => {
            res.status(400).json({error})
            logger.error('Error on password hash - ', error)
        })
}


exports.login = (req, res, next) => {
    if(!validator.isEmail(req.body.email)) {
        const error = new Error("Invalid email address entered")
        logger.info('Login error - invalid email - ', error)
        return res.status(400).json({error : error.message})
    }

    User.findOne({email : req.body.email}).select('password')
        .then(user => {
            if(!user) {
                logger.info('Login error from ' + req.ip)
                return res.status(401).json({message: "Wrong mail and/or password"})
            }

            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if(!valid) {
                        logger.info('Login error from ' + req.ip)
                        return res.status(401).json({message: "Wrong mail and/or password"})
                    }
                    const response = {
                        userId: user._id,
                        token: jwt.sign(
                            {userId: user._id},
                            process.env.AUTH_TOKEN_SECRET,
                            {expiresIn: "24h"}
                        )
                    }
                    logger.info(`User ${user._id} successfully logged from ${req.ip}`)
                    res.status(200).json(response)
                })
                .catch(error => {
                    res.status(500).json({error})
                    logger.error(`Error during bcrypt comparison - `, error)
                })
        })
        .catch(error => {
            res.status(500).json({error})
            logger.error(`Mongoose error while finding user`, error)
        })
}