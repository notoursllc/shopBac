const Joi = require('joi');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {

                const HeroCtrl = new (require('./controllers/HeroCtrl'))(server);
                const payloadMaxBytes = process.env.ROUTE_PAYLOAD_MAXBYTES || 10485760; // 10MB (1048576 (1 MB) is the default)

                server.route([
                    {
                        method: 'GET',
                        path: '/hero',
                        options: {
                            description: 'Finds a Hero object by ID',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/heros',
                        options: {
                            description: 'Gets a list of Heros',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    published: Joi.boolean(),
                                    ...HeroCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/hero',
                        options: {
                            description: 'Adds a new Hero',
                            payload: {
                                // output: 'stream',
                                output: 'file',
                                parse: true,
                                allow: 'multipart/form-data',
                                maxBytes: payloadMaxBytes,
                                multipart: true
                            },
                            validate: {
                                payload: Joi.object({
                                    file: Joi.object(),
                                    ...HeroCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/hero',
                        options: {
                            description: 'Updates a Hero',
                            payload: {
                                // output: 'stream',
                                output: 'file',
                                parse: true,
                                allow: 'multipart/form-data',
                                maxBytes: payloadMaxBytes,
                                multipart: true
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    file: Joi.object(),
                                    ...HeroCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/heros/ordinal',
                        options: {
                            description: 'Updates Hero ordinals',
                            validate: {
                                payload: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    ordinals: Joi.array().items(
                                        Joi.object().keys({
                                            id: Joi.string().uuid().required(),
                                            ordinal: Joi.number().integer().required()
                                        })
                                    )
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.bulkUpdateOrdinals(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/hero',
                        options: {
                            description: 'Deletes a Hero',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return HeroCtrl.deleteHandler(request, h);
                            }
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'Hero',
                    require('./models/Hero')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
