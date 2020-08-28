const path = require('path');

console.log("PATH TO SECRETS", path.resolve(__dirname, '../../../../../etc/secrets'));

const envs = require('dotenv').config(
    process.env.NODE_ENV === 'production' ? { path: '/etc/secrets' } : null
);

console.log("ENVS FROM SERVER.js", envs);

const server = require('./index');
const manifest = require('./manifest');
const Config = require('./config');

const startServer = async function() {
    try {
        const options = {
            relativeTo: __dirname
        };

        await server.init(manifest, options);
        console.log('API server started, port:', Config.get('/port/api'));
    }
    catch(err) {
        console.log('ERROR STARTING SERVER:', err);
        process.exit(1);
    }
};

startServer();
