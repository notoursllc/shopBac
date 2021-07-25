const winston = require('winston');
const bugsnag = require('@bugsnag/js');
const isObject = require('lodash.isobject');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {

        // Bugsnag setup:
        if(process.env.NODE_ENV !== 'test') {
            const bugsnagClient = bugsnag({
                apiKey: process.env.BUG_SNAG_API_KEY,
                releaseStage: 'production'
            });

            global.bugsnag = () => {
                const args = arguments;
                if(process.env.NODE_ENV === 'production') {
                    bugsnagClient.notify(args);
                }
            };
        }
        else {
            global.bugsnag = function(err) {
                console.error(err);
            }
        }

        const prettyJson = winston.format.printf((info) => {
            if (isObject(info.meta)) {
                info.meta = `- ${JSON.stringify(info.meta)}`;
            }
            return `${info.timestamp} [${info.level}]: ${info.message} ${info.meta}`;
        });

        global.logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.colorize(),
                winston.format.timestamp(),
                // This doesn't acutally format the results in LogDNA, except that it does cause
                // the 'meta' object to be stringified in the LogDNA UI, which is all I really want.
                // A 'prettiefied' meta object in LogDNA is kind of annoying read, I think.
                prettyJson
            ),
            transports: [
                new winston.transports.Console({
                    level: process.env.LOG_LEVEL || 'info'
                })
            ]
        });

    }
};
