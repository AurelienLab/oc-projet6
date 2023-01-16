const jwt = require('jsonwebtoken')
require('dotenv').config()

auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decodedToken = jwt.verify(token, process.env.AUTH_TOKEN_SECRET)
        const userId = decodedToken.userId
        req.auth = {
            userId
        }
        next()
    }
    catch(error) {
        res.status(401).json({error: error.message})
    }
}

module.exports = auth