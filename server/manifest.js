'use strict';

const Boom = require('@hapi/boom');
const path = require('path');
const Config = require('./config');

const routePrefix = '/api/v1';

const webManifest = {
    server: {
        // cache: 'redis',
        port: Config.get('/port/api'),
        routes: {
            validate: {
                failAction: async (request, h, err) => {
                    global.logger.error(err);

                    if (process.env.NODE_ENV === 'production') {
                        throw Boom.badRequest(`Invalid request payload input`);
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
            { plugin: './plugins/hapi-basic-auth' },
            { plugin: './plugins/core' },

            {
                plugin: './plugins/product-collections',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-option-labels',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-option-values',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-pics',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-types',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-fit-types',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-sales-channel-types',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-sub-types',
                routes: {
                    prefix: routePrefix
                }
            },

            {
                plugin: './plugins/product-variants',
                routes: {
                    prefix: routePrefix
                }
            },

            { plugin: './plugins/products' },

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
        ],
        // options: {
        //     once: false
        // }
    }
}

module.exports = webManifest;
