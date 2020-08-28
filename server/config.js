const Confidence = require('confidence');


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}


const config = {
    $meta: 'This file configures the app.',
    port: {
        // web: {
        //     $filter: 'env',
        //     test: 80,
        //     production: process.env.PORT || 8000,
        //     $default: process.env.PORT || 8000
        // },
        server: {
            $filter: 'env',
            test: 8080,
            production: normalizePort(process.env.SERVER_PORT || 4000),
            $default: normalizePort(process.env.SERVER_PORT || 4000)
        }
    },
    db: {
        $filter: 'env',
        production: {
            debug: false
        },
        $default: {
            debug: true
        }
    }
};


const store = new Confidence.Store(config);

const criteria = {
    env: process.env.NODE_ENV
};

exports.get = function (key) {
    return store.get(key, criteria);
};

exports.meta = function (key) {
    return store.meta(key, criteria);
};
