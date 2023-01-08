const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit')

logger = require('./logger')
require('dotenv').config()

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express()
const env = process.env

const userRoutes = require('./routes/user')
const sauceRoutes = require('./routes/sauce')

app.use(limiter)

//Connexion MongoDB
mongoose.connect(`mongodb+srv://${env.MONGODB_USER}:${env.MONGODB_PASSWORD}@${env.MONGODB_SERVER}/${env.MONGODB_DATABASE}?retryWrites=true&w=majority`,
    { useNewUrlParser: true,
        useUnifiedTopology: true })
    .then(() => logger.info('Successfully connected to MongoDB'))
    .catch((error) => logger.error('MongoDB connexion failed - ', error));

app.use(express.json());

//Gestion CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(
    mongoSanitize({
        allowDots: true,
        onSanitize: ({ req, key }) => {
            logger.warn(`This request[${key}] is sanitized`, req[key]);
        },
    }),
);

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/auth', userRoutes)
app.use('/api/sauces', sauceRoutes)

module.exports = app

