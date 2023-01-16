const winston = require("winston");

const logConfiguration = {
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: `${__dirname}/logs/combined.log`, level: 'info'}),
        new winston.transports.File({filename: `${__dirname}/logs/error.log`, level: 'warn'})
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MMM-YYYY HH:mm:ss'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    )
}

const logger = winston.createLogger(logConfiguration)

module.exports = logger