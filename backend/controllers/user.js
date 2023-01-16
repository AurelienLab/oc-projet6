const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const {passwordStrength} = require('check-password-strength')
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
        //If email is not valid
        if (!validator.isEmail(req.body.email)) {
            throw new Error("Adresse mail invalide")
        }
        //If password is not strong enough
        if (passwordStrength(req.body.password).id <= 1 || !schema.validate(req.body.password)) {
            throw new Error("Password too weak. Reasons: " + schema.validate(req.body.password, {list: true}))
        }
    } catch (error) { // if error thrown : stop execution and return error
        logger.warn('Bad credentials for signup - ', error)
        return res.status(400).json({error: error.message})
    }


    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            })

            user.save()
                .then(() => res.status(201).json({message: "Successfully signed up"}))
                .catch(error => {
                    res.status(400).json({error: error.message})
                    logger.error('Error during user signup - ', error)
                })
        })
        .catch(error => {
            res.status(400).json({error: error.message})
            logger.error('Error on password hash - ', error)
        })
}


exports.login = (req, res, next) => {
    // If email is not valid, stop execution and returns error
    if (!validator.isEmail(req.body.email)) {
        const error = new Error("Invalid email address entered")
        logger.info('Login error - invalid email - ', error)
        return res.status(400).json({error: error.message})
    }

    User.findOne({email: req.body.email}).select('password')
        .then(user => {
            if (!user) {
                logger.info('Login error from ' + req.ip)
                const err = new Error("Wrong mail and/or password")
                return res.status(401).json({error: err.message})
            }

            //Check if password is the right one
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        logger.info('Login error from ' + req.ip)
                        const err = new Error("Wrong mail and/or password")
                        return res.status(401).json({error: err.message})
                    }
                    //Response with the new auth token
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
                    res.status(500).json({error: error.message})
                    logger.error(`Error during bcrypt comparison - `, error)
                })
        })
        .catch(error => {
            res.status(500).json({error: error.message})
            logger.error(`Mongoose error while finding user`, error)
        })
}