const Joi = require('@hapi/joi');

const after = function (server) {
    const TenantCtrl = new (require('./controllers/TenantCtrl'))(server);

    server.auth.strategy('jwt', 'jwt',
        {
            // this key is only for testing.  In a multi tenant scenario I will need to look up the secret key in the db,
            // which hapi-auth-jwt2 supports:
            // https://www.npmjs.com/package/hapi-auth-jwt2#additional-notes-on-keys-and-key-lookup-functions
            key: TenantCtrl.getTenantJwtSecretKey,
            // key: process.env.JWT_SERVER_SECRET,
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
    server.auth.default('jwt');


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
                description: 'Adds a new tenant',
                validate: {
                    payload: TenantCtrl.getSchema()
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
        }
    ]);

    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Tenant',
        require('./models/Tenant')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
