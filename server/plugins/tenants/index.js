const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');


const after = function (server) {
    const TenantCtrl = new (require('./controllers/TenantCtrl'))(server);
    const TenantMemberCtrl = new (require('./controllers/TenantMemberCtrl'))(server);

    // Session auth
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
            const TenantMember = await TenantMemberCtrl.modelForgeFetch(
                { id: session.id }
            );

            if(!TenantMember) {
                return { valid: false };
            }

            return { valid: true, credentials: TenantMember.toJSON() };
        }
    });


    // Basic auth for store API usage
    server.auth.strategy('storeauth', 'basic', {
        validate: async (request, tenant_id, api_key) => {
            const tenantData = await TenantCtrl.storeAuthIsValid(tenant_id, api_key);
            let credentials = null;

            if(isObject(tenantData) && tenantData.id) {
                credentials = {
                    tenant_id: tenantData.id
                };
            }

            return {
                isValid: !!tenantData,
                credentials: credentials
            };
        }
    });


    // By default the admin can access all routes
    // Routes accessable by the tenant (client app) will need to be
    // specified intentionally by setting route options:
    //
    // auth: {
    //     strategies: ['storeauth', 'session']
    // }

    server.auth.default('session');


    server.route([

        /*
        {
            method: 'GET',
            path: '/tenants',
            options: {
                description: 'Gets a list of tenants',
                handler: (request, h) => {
                    return TenantCtrl.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/tenants/all',
            options: {
                description: 'Gets a list of tenants',
                handler: (request, h) => {
                    return TenantCtrl.getAllHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/tenant',
            options: {
                description: 'Gets a Tenant by ID',
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
        */


        /*
         *  TENANT MEMBERS
         */
        {
            method: 'POST',
            path: '/tenant/member',
            options: {
                auth: false,
                description: 'Creates a new tenant member',
                validate: {
                    payload: TenantMemberCtrl.getCreateSchema()
                },
                handler: (request, h) => {
                    return TenantMemberCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/member/login',
            options: {
                auth: false,
                description: 'Authenticates a tenant member and returns a cookie containing JWT',
                validate: {
                    payload: TenantMemberCtrl.getLoginSchema()
                },
                handler: (request, h) => {
                    return TenantMemberCtrl.loginHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant/member/logout',
            options: {
                auth: false,
                description: 'Logs out a tenant member',
                handler: (request, h) => {
                    return TenantMemberCtrl.logoutHandler(request, h);
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
        'TenantMember',
        require('./models/TenantMember')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
