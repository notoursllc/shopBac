const path = require('path');
const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const coreController = require('./coreController');


const after = function(server) {
    const routes = [
        // {
        //     method: 'GET',
        //     path: '/api/v1/jwt',
        //     options: {
        //         auth: false,
        //         description: 'Returns the client token',
        //         handler: coreController.getClientJwtHandler
        //     }
        // },
        {
            method: 'POST',
            path: '/api/v1/logger',
            options: {
                description: 'Logs stuff',
                validate: {
                    payload: Joi.object({
                        type: Joi.string(),
                        message: Joi.string()
                    })
                },
                handler: coreController.loggerHandler
            }
        },
        {
            method: 'GET',
            path: '/api/v1/healthz',
            options: {
                auth: false,
                description: 'Simple health check',
                handler: coreController.healthzHandler
            }
        },
        {
            method: 'GET',
            path: '/robots.txt', // NOTE: no routePrefix on this one
            options: {
                auth: false,
                description: 'For generating robots.txt',
            },
            handler: coreController.robotsHandler
        }

        // commentig out to get nuxt working (?)
        // {
        //     method: 'GET',
        //     path: '/{path*}',
        //     options: {
        //         auth: false
        //     },
        //     handler: function (request, reply) {
        //         reply.file(path.resolve(__dirname, '../../../dist/index.html'));

        //         // TODO: get CSRF token to add to template?
        //         // return reply.view('index', {
        //         //     crumb: 123
        //         // });
        //         // return reply.view('index', {});
        //     }
        // }
    ];

    // nginx handles static file access in production, for better performance
    // so only add these routes if running locally.
    // Even so it's probably best to develop locally using Nanobox, so perhaps
    // this can be removed
    if(process.env.IS_LOCAL) {
        routes.unshift(
            {
                method: 'GET',
                path: '/static/{filepath*}',
                options: {
                    auth: false,
                    cache: {
                        expiresIn: 24 * 60 * 60 * 1000,
                        privacy: 'public'
                    }
                },
                handler: {
                    directory: {
                        path: path.resolve(__dirname, '../../../dist/static/'),
                        listing: false,
                        index: false
                    }
                }
            },
            {
                path: '/favicon.ico',
                method: 'GET',
                options: {
                    auth: false,
                    cache: {
                        expiresIn: 1000*60*60*24*21
                    }
                },
                handler: coreController.faviconHandler
            }
        );
    }

    server.route(routes);
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        coreController.setServer(server);

        /*
        server.auth.strategy('xCartToken', 'jwt-cookie', {
            secret: process.env.JWT_TOKEN_SECRET,
            cookieKey: 'cart-jwt',
            verifyOptions: {   // https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
                ignoreExpiration: true,    // do not reject expired tokens
                algorithms: [ 'HS256' ]
            }
        });
        server.auth.default('xCartToken');
        */

        server.views({
            engines: {
                html: require('handlebars')
            },
            path: path.resolve(__dirname, '../../../dist')
            // partialsPath: '../../views/partials',
            // relativeTo: __dirname // process.cwd() // prefer this over __dirname when compiling to dist/cjs and using rollup
        });


        server.decorate('toolkit', 'apiSuccess', function (responseData, paginationObj) {
            const response = {};
            response.data = responseData;

            if(isObject(paginationObj)) {
                response.pagination = paginationObj;
            }

            return this.response(response);
        });


        // server.ext('onPostAuth', (request, h) => {
        //     // https://github.com/BoseCorp/hapi-auth-jwt2#want-to-access-the-jwt-token-after-validation
        //     if(isObject(request.auth.credentials) && request.auth.credentials.tenant_id) {
        //         const tenantId = request.auth.credentials.tenant_id;

        //         // query
        //         // I don't think query can be an array, right?
        //         if(isObject(request.query)) {
        //             request.query.tenant_id = tenantId;
        //         }

        //         // payload
        //         if(Array.isArray(request.payload)) {
        //             request.payload.forEach((item) => {
        //                 if(isObject(item)) {
        //                     item.tenant_id = tenantId;
        //                 }
        //             });
        //         }
        //         else if(isObject(request.payload)) {
        //             request.payload.tenant_id = tenantId;
        //         }
        //     }

        //     return h.continue;
        // });


        // Updates the response output with a 'data' property if a data
        // property also exists in the Boom error
        server.ext('onPreResponse', (request, h) => {
            const response = request.response;

            if (!response.isBoom || !response.hasOwnProperty('output')) {
                return h.continue;
            }

            const is4xx = response.output.statusCode >= 400 && response.output.statusCode < 500;

            if (is4xx && response.data) {
                response.output.payload.data = response.data;
            }

            return h.continue;
        });


        server.dependency(['vision'], after);
    }
};
