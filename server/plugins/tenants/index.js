const Joi = require('@hapi/joi');

const after = function (server) {
    const TenantCtrl = new (require('./controllers/TenantCtrl'))(server);
    const TenantUserCtrl = new (require('./controllers/TenantUserCtrl'))(server);

    server.auth.strategy('jwt', 'jwt',
        {
            // this key is only for testing.  In a multi tenant scenario I will need to look up the secret key in the db,
            // which hapi-auth-jwt2 supports:
            // https://www.npmjs.com/package/hapi-auth-jwt2#additional-notes-on-keys-and-key-lookup-functions
            key: process.env.JWT_TOKEN_SECRET,
            validate: (decoded, request) => {
                return TenantCtrl.validateJwtKey(decoded, request);
            },
            // verify: TenantCtrl.validateJwtKey,
            verifyOptions: {
                // ignoreExpiration: true,
                algorithms: [ 'HS256' ]
            }
        }
    );

    server.auth.strategy('session', 'cookie', {
        // https://hapi.dev/module/cookie/api/?v=11.0.1
        cookie: {
            name: 'bv_session',
            password: process.env.ADMIN_JWT_TOKEN_SECRET,
            isSecure: process.env.NODE_ENV === 'production',
            path: '/',
            clearInvalid: true
        },
        // redirectTo: '/login',
        validateFunc: async (request, session) => {
            const TenantUser = await TenantUserCtrl.modelForgeFetch(
                { id: session.id }
            );

            if(!TenantUser) {
                return { valid: false };
            }

            return { valid: true, credentials: TenantUser.toJSON() };
        }
    });

    // By default the admin can access all routes
    // Routes accessable by the tenant (client app) will need to be
    // specified intentionally by setting route options:
    //
    // auth: {
    //     strategies: ['jwt', 'session']
    // }


    server.auth.default('session');


    server.route([
        {
            method: 'GET',
            path: '/tenants',
            options: {
                description: 'Gets a list of tenants',
                handler: (request, h) => {
                    return TenantCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/tenant',
            options: {
                description: 'Gets an master type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/login',
            options: {
                auth: false,
                description: 'Authenticates a tenant and returns a JWT',
                validate: {
                    payload: TenantCtrl.getAuthSchema()
                },
                handler: (request, h) => {
                    return TenantCtrl.authHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/refresh',
            options: {
                auth: false,
                cors: {
                    credentials: true // so cookies can be accepted
                },
                description: 'Returns a new refresh token',
                validate: {
                    payload: TenantCtrl.getRefreshSchema()
                },
                handler: (request, h) => {
                    return TenantCtrl.authHandler(request, h);
                }
            }
        },
        // temp test route
        {
            method: 'GET',
            path: '/tenant/test',
            options: {
                auth: 'jwt',
                description: 'Authenticates a tenant and returns a JWT',
                handler: (request, h) => {
                    return h.apiSuccess({ test: 'success' });
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant',
            options: {
                auth: false,
                description: 'Adds a new tenant',
                validate: {
                    payload: TenantCtrl.getCreateSchema()
                },
                handler: (request, h) => {
                    return TenantCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/tenant',
            options: {
                description: 'Updates a tenant',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...TenantCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/tenant',
            options: {
                description: 'Deletes a tenant',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.deleteHandler(request, h);
                }
            }
        },


        /*
         *  TENANT USERS
         */
        {
            method: 'POST',
            path: '/tenant/user',
            options: {
                auth: false,
                description: 'Creates a new tenant user',
                validate: {
                    payload: TenantUserCtrl.getCreateSchema()
                },
                handler: (request, h) => {
                    return TenantUserCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/user/login',
            options: {
                auth: false,
                description: 'Authenticates a tenant user and returns a cookie containing JWT',
                validate: {
                    payload: TenantUserCtrl.getLoginSchema()
                },
                handler: (request, h) => {
                    return TenantUserCtrl.loginHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/user/logout',
            options: {
                auth: false,
                description: 'Logs out a tenant user',
                handler: (request, h) => {
                    return TenantUserCtrl.logoutHandler(request, h);
                }
            }
        }
    ]);

    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Tenant',
        require('./models/Tenant')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'TenantUser',
        require('./models/TenantUser')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
