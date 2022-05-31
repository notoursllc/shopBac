const Joi = require('joi');

exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {

                const TaxNexusCtrl = new (require('./controllers/TaxNexusCtrl'))(server);

                server.route([
                    {
                        method: 'GET',
                        path: '/nexus',
                        options: {
                            description: 'Finds a TaxNexus object by ID',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return TaxNexusCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/nexus/list',
                        options: {
                            description: 'Gets a list of TaxNexus objects',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    // ...TaxNexusCtrl.getSchema(),
                                    tenant_id: Joi.string().uuid(),
                                    ...TaxNexusCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return TaxNexusCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/nexus',
                        options: {
                            description: 'Adds a new TaxNexus object',
                            validate: {
                                payload: Joi.object({
                                    ...TaxNexusCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return TaxNexusCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/nexus',
                        options: {
                            description: 'Updates a TaxNexus object',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...TaxNexusCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return TaxNexusCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/nexus',
                        options: {
                            description: 'Deletes a TaxNexus resource',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return TaxNexusCtrl.deleteHandler(request, h);
                            }
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'TaxNexus',
                    require('./models/TaxNexus')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
