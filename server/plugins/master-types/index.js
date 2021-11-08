const Joi = require('@hapi/joi');

const after = function (server) {
    const MasterTypeCtrl = new (require('./controllers/MasterTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/master_types',
            options: {
                description: 'Gets a list of master types',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                validate: {
                    query: Joi.object({
                        tenant_id: Joi.string().uuid().required(),
                        object: Joi.string().max(100),
                        ...MasterTypeCtrl.getPaginationSchema()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.fetchTenantDataHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/master_type',
            options: {
                description: 'Gets an master type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.getByIdHandler(request, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/master_type',
            options: {
                description: 'Adds a new master type',
                validate: {
                    payload: Joi.object({
                        ...MasterTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/master_type',
            options: {
                description: 'Updates master type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...MasterTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/master_types/ordinal',
            options: {
                description: 'Updates master type ordinals',
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
                    return MasterTypeCtrl.bulkUpdateOrdinals(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/master_type',
            options: {
                description: 'Deletes a master type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'MasterType',
        require('./models/MasterType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
