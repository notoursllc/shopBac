const logdna = require('logdna-winston');
const winston = require('winston');
const bugsnag = require('bugsnag');


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

        winston.setLevels({
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        });

        winston.addColors({
            debug: 'blue',
            info: 'cyan',
            warn: 'yellow',
            error: 'red'
        });

        let transports = [];
        let exceptionHandlers = [];

        // Adding LogDNA transport for production only
        if(process.env.NODE_ENV === 'production') {
            transports.push(
                new (logdna.WinstonTransport)({
                    key: process.env.LOG_DNA_INGESTION_KEY,
                    hostname: process.env.DOMAIN_NAME,
                    env: process.env.NODE_ENV,
                    index_meta: false,  // when true ensures meta object will be searchable
                    // level: 'info'
                })
            )
        }
        // no logging for NODE_ENV = "test".  Not sure if this is the right thing to do.
        else if(process.env.NODE_ENV === 'development') {
            transports.push(
                new (winston.transports.Console)({
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                    handleExceptions: true,
                    humanReadableUnhandledException: true,
                    prettyPrint: true,
                    colorize: true,
                    silent: false
                })
            )
        }

        const logger = new (winston.Logger)({
            transports,
            exceptionHandlers,
            exitOnError: false
        });

        global.logger = logger
    }
};
