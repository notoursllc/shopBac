const logdnaWinston = require('logdna-winston');
const winston = require('winston');
const bugsnag = require('bugsnag');
const isObject = require('lodash.isobject');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        // Bugsnag setup:
        bugsnag.register(process.env.BUG_SNAG_API_KEY, {
            releaseStage: 'production',
            // autoNotifyUnhandledRejection: false // https://docs.bugsnag.com/platforms/nodejs/other/
        });

        global.bugsnag = function() {
            const args = arguments;
            if(process.env.NODE_ENV === 'production') {
                bugsnag.notify(args);
            }
        }

        let logger = null;

        let prettyJson = winston.format.printf((info) => {
            if (isObject(info.meta)) {
                info.meta = `- ${JSON.stringify(info.meta)}`
            }
            return `${info.timestamp} [${info.level}]: ${info.message} ${info.meta || ''}`;
        });

        // Log DNA setup:
        if(process.env.NODE_ENV === 'production') {
            logger = winston.createLogger({
                transports: [
                    new logdnaWinston({
                        key: process.env.LOG_DNA_INGESTION_KEY,
                        hostname: process.env.DOMAIN_NAME,
                        // ip: ipAddress,
                        // mac: macAddress,
                        app: 'web',
                        env: process.env.NODE_ENV,
                        level: 'info', // Default to debug, maximum level of log, doc: https://github.com/winstonjs/winston#logging-levels
                        index_meta: false, // Defaults to false, when true ensures meta object will be searchable
                        handleExceptions: true,
                        exitOnError: false
                    })
                ],
                format: winston.format.combine(
                    // This doesn't acutally format the results in LogDNA, except that it does cause
                    // the 'meta' object to be stringified in the LogDNA UI, which is all I really want.
                    // A 'prettiefied' meta object in LogDNA is kind of annoying read, I think.
                    prettyJson
                )
            });
        }
        else {
            logger = winston.createLogger({
                transports: [
                    new winston.transports.Console({
                        level: process.env.NODE_ENV === 'test' ? 'error' : (process.env.LOG_LEVEL || 'info')
                    })
                ],
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.prettyPrint(),
                    // winston.format.json(),
                    // winston.format.splat(),
                    // winston.format.simple(),
                    prettyJson
                )
            });
        }

        global.logger = logger;
    }
};
