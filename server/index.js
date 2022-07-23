const Glue = require('@hapi/glue');
const Boom = require('@hapi/boom');
const Config = require('./config');

const routePrefix = '/api/v1';


/**
 * @returns Promise
 */
function getServer() {
    return Glue.compose(
        {
            server: {
                // cache: 'redis',
                port: Config.get('/port/server'),
                routes: {
                    cors: {
                        origin: process.env.CORS_ORIGINS
                            ? process.env.CORS_ORIGINS.split(',').map(url => url.trim())
                            : ['*'],
                        credentials: true
                    },
                    validate: {
                        failAction: (request, h, err) => {
                            global.logger.error(err);

                            if (process.env.NODE_ENV === 'production') {
                                throw Boom.badRequest('Invalid request payload input');
                            }
                            else {
                                // During development, respond with the full error.
                                throw err;
                            }
                        }
                    }
                }
            },
            register: {
                plugins: [
                    { plugin: '@hapi/inert' },
                    { plugin: '@hapi/cookie' },
                    { plugin: '@hapi/basic' },
                    {
                        plugin: 'hapi-rate-limit', // https://www.npmjs.com/package/hapi-rate-limit
                        options: {
                            enabled: true,
                            userLimit: 300,
                            pathLimit: 50
                        }
                    },
                    { plugin: './plugins/logger' },
                    {
                        plugin: './plugins/bookshelf-orm',
                        options: {
                            knex: {
                                debug: Config.get('/db/debug')
                            }
                        }
                    },
                    // { plugin: './plugins/auth-scheme-jwt-cookie' },
                    {
                        plugin: './plugins/tenants',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    { plugin: './plugins/core' },
                    {
                        plugin: './plugins/master-types',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    {
                        plugin: './plugins/package-types',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    { plugin: './plugins/products' },
                    {
                        plugin: './plugins/media',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    {
                        plugin: './plugins/cart',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    {
                        plugin: './plugins/tax-nexus',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    {
                        plugin: './plugins/heros',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                    {
                        plugin: './plugins/exchange-rates',
                        routes: {
                            prefix: routePrefix
                        }
                    },
                ]
                // options: {
                //     once: false
                // }
            }
        },
        { relativeTo: __dirname }
    );
};



// server.initialize starts the server
// but it does not listen on a socket.
// This is used for unit testing
exports.init = async () => {
    const server = await getServer();
    await server.initialize();
    return server;
};

exports.start = async () => {
    const server = await getServer();
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
    return server;
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
