const { createLogger, format, transports } = require('winston');
const bugsnag = require('bugsnag');
const logdna = require('logdna-winston');


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

        const myCustomLevels = {
            levels: {
                debug: 0,
                info: 1,
                warn: 2,
                error: 3
            },
            colors: {
                debug: 'blue',
                info: 'cyan',
                warn: 'yellow',
                error: 'red'
            }
        };

        const logger = createLogger({
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.json()
            ),
            level: process.env.LOG_LEVEL || 'info',
            levels: myCustomLevels.levels,
            transports: []
        });

        if(process.env.NODE_ENV === 'production') {
            logger.add(new transports.Logdna({
                key: process.env.LOG_DNA_INGESTION_KEY,
                hostname: process.env.DOMAIN_NAME,
                env: process.env.NODE_ENV,
                index_meta: false,  // when true ensures meta object will be searchable
                handleExceptions: true
            }));
        }
        else if(process.env.NODE_ENV === 'development') {
            logger.add(new transports.Console({
                format: format.combine(
                  format.colorize({ all: true }),
                  format.simple()
                )
            }));
        }

        global.logger = logger
    }
};
