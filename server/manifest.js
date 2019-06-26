'use strict';

const path = require('path');
const Config = require('./config');

const routePrefix = '/api/v1';

const webManifest = {
    server: {
        // cache: 'redis',
        port: Config.get('/port/api')
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
