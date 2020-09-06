const Boom = require('@hapi/boom');
const path = require('path');
const Config = require('./config');

const routePrefix = '/api/v1';
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(url => url.trim()) : ['*'];

const webManifest = {
    server: {
        // cache: 'redis',
        port: Config.get('/port/server'),
        routes: {
            cors: {
                origin: corsOrigins,
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
            {
                plugin: '@nuxtjs/hapi',
                options: path.resolve(__dirname, '../../nuxt.config.js')
            },
            { plugin: '@hapi/inert' },
            { plugin: '@hapi/vision' },
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
                plugin: './plugins/storage',
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
                plugin: './plugins/shipping',
                routes: {
                    prefix: routePrefix
                }
            },
            {
                plugin: './plugins/payment',
                routes: {
                    prefix: routePrefix
                }
            },
            {
                plugin: './plugins/shopping-cart',
                routes: {
                    prefix: routePrefix
                }
            }
        ]
        // options: {
        //     once: false
        // }
    }
};

module.exports = webManifest;
