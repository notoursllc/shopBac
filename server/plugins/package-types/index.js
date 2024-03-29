const Joi = require('joi');

const after = function (server) {
    const PackageTypeCtrl = new (require('./controllers/PackageTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/package_types',
            options: {
                description: 'Gets a list of package types',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                validate: {
                    query: Joi.object({
                        tenant_id: Joi.string().uuid().required(),
                        ...PackageTypeCtrl.getPaginationSchema(),
                    })
                },
                handler: (request, h) => {
                    return PackageTypeCtrl.fetchAllForTenantHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/package_type',
            options: {
                description: 'Gets a package type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return PackageTypeCtrl.fetchOneForTenantHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/package_type',
            options: {
                description: 'Adds a new package type',
                validate: {
                    payload: Joi.object({
                        ...PackageTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return PackageTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/package_type',
            options: {
                description: 'Updates a package type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...PackageTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return PackageTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/package_types/ordinal',
            options: {
                description: 'Bulk update package type ordinals',
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
                    return PackageTypeCtrl.bulkUpdateOrdinals(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/package_type',
            options: {
                description: 'Deletes a package type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return PackageTypeCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    server.app.bookshelf.model(
        'PackageType',
        require('./models/PackageType')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
