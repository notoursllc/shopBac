const Joi = require('joi');
const isObject = require('lodash.isobject');

const isProd = process.env.NODE_ENV === 'production';

exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm'],
            function (server) {
                const TenantCtrl = new (require('./controllers/TenantCtrl'))(server);
                const TenantMemberCtrl = new (require('./controllers/TenantMemberCtrl'))(server);

                // Session auth
                // CORS cookie notes:
                // * To set a cookie via CORS ajax requests, SameSite=None is required
                // * SameSite=None requires Secure to be true
                server.auth.strategy('session', 'cookie', {
                    // https://hapi.dev/module/cookie/api/?v=11.0.1
                    cookie: {
                        name: 'bv_session',
                        password: process.env.SESSION_COOKIE_PASSWORD,
                        isSecure: isProd,
                        isHttpOnly: true,
                        isSameSite: isProd ? 'None' : false, // not for dev becaue 'None' also requires isSecure=true
                        domain: process.env.SESSION_COOKIE_DOMAIN,
                        path: '/',
                        // ttl: 3600000, // one hour
                        // ttl: 60000, // one minute
                        ttl: process.env.SESSION_TTL,
                        clearInvalid: true
                    },
                    keepAlive: true, //TEST
                    // redirectTo: '/login',
                    validateFunc: async (request, session) => {
                        const TenantMember = await TenantMemberCtrl.modelForgeFetch(
                            { id: session.id }
                        );

                        if(!TenantMember) {
                            return { valid: false };
                        }

                        return {
                            valid: true,
                            credentials: TenantMember.toJSON()
                        };
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

                server.auth.strategy('cronauth', 'basic', {
                    validate: async (request, cronUser, cronPass) => {
                        const isValid = (cronUser === process.env.CRON_USERNAME && cronPass === process.env.CRON_PASSWORD);

                        return {
                            isValid: isValid,
                            credentials: isValid ? { user: cronUser } : null
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
                    {
                        method: 'POST',
                        path: '/tenant/contactus',
                        options: {
                            description: 'Contact us',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    name: Joi.string().trim().max(100).required(),
                                    company: Joi.alternatives().try(Joi.string().trim().max(100), Joi.allow(null)),
                                    email: Joi.string().trim().max(100).required(),
                                    message: Joi.string().trim().max(10000).required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return TenantCtrl.contactUsHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/tenant/exchange-rates',
                        options: {
                            description: 'GET the tenants supported_currencies mapped to the respective exhange rates',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            handler: (request, h) => {
                                return TenantCtrl.exchangeRatesHandler(request, h);
                            }
                        }
                    },


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
                                payload: Joi.object({
                                    ...TenantMemberCtrl.getCreateSchema()
                                })
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
                            description: 'Authenticates a tenant member and sets a cookie',
                            validate: {
                                payload: Joi.object({
                                    ...TenantMemberCtrl.getLoginSchema()
                                })
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
                    },

                    /*
                    *  ACCOUNT
                    */
                    {
                        method: 'GET',
                        path: '/account',
                        options: {
                            description: 'GET a tenant in a limited way',
                            auth: {
                                strategies: ['session']
                            },
                            handler: (request, h) => {
                                return TenantCtrl.fetchAccountHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/account',
                        options: {
                            description: 'Updates a tenant in a limited way',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...TenantCtrl.getAccountSchema(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return TenantCtrl.updateHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/account/api_key',
                        options: {
                            description: 'Updates the API key for the Tenant',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return TenantCtrl.updateApiKeyHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/account/api_key',
                        options: {
                            description: 'Deletes the API key for the Tenant',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return TenantCtrl.deleteApiKeyHandler(request, h);
                            }
                        }
                    },
                ]);

                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'Tenant',
                    require('./models/Tenant')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'TenantMember',
                    require('./models/TenantMember')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
